import type { Prisma, OfferStatus } from "@prisma/client";
import { uuidv7 } from "uuidv7";
import { prisma } from "../../../shared/database/prisma.js";
import { lockUser } from "../sql/index.js";
import { LIVE_OFFER_STATUSES, OfferStatusType } from "../schema/offer.schema.js";

const offerInclude = {
  property: {
    select: {
      id: true,
      slug: true,
      titleEn: true,
      price: true,
      listingIntent: true,
      status: true,
      agentId: true,
      images: {
        select: { url: true },
        orderBy: [{ isCover: "desc" }, { order: "asc" }],
        take: 1,
      },
    },
  },
  buyer: {
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
    },
  },
  agent: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  revisions: {
    orderBy: { revisionNumber: "asc" },
  },
  payments: {
    orderBy: { createdAt: "desc" },
    take: 1,
  },
} satisfies Prisma.OfferInclude;

export type OfferRecord = Prisma.OfferGetPayload<{ include: typeof offerInclude }>;

export class OfferRepository {
  /**
   * Check if a buyer currently has any live offer on ANY listing owned by this agent.
   * Required for Buyer Phone Visibility Rule (#60, #66, #72).
   */
  async buyerHasActiveOfferWithAgent(buyerId: string, agentId: string): Promise<boolean> {
    const count = await prisma.offer.count({
      where: {
        buyerId,
        agentId,
        status: { in: LIVE_OFFER_STATUSES as OfferStatus[] },
      },
    });
    return count > 0;
  }

  async findPropertyForOffer(propertyId: string) {
    return prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        id: true,
        slug: true,
        titleEn: true,
        price: true,
        listingIntent: true,
        status: true,
        agentId: true,
        agent: {
          select: { id: true, name: true },
        },
      },
    });
  }

  async findLiveOfferForBuyerAndProperty(buyerId: string, propertyId: string) {
    return prisma.offer.findFirst({
      where: {
        buyerId,
        propertyId,
        status: { in: LIVE_OFFER_STATUSES as OfferStatus[] },
      },
      include: offerInclude,
    });
  }

  /**
   * O1: Create Initial Offer with Invariant I12 advisory lock
   */
  async createOffer(input: {
    buyerId: string;
    agentId: string;
    propertyId: string;
    amount: number;
    earnestMoney?: number;
    conditions?: string;
    proposedClosingDate?: string;
    maxLiveOffers: number;
  }): Promise<
    | { status: "created"; offer: OfferRecord }
    | { status: "limit_reached" }
    | { status: "already_exists" }
  > {
    return prisma.$transaction(async (tx) => {
      // Transaction-scoped lock on buyer to atomically guarantee Invariant I12
      await lockUser(tx, input.buyerId);

      const liveCount = await tx.offer.count({
        where: {
          buyerId: input.buyerId,
          status: { in: LIVE_OFFER_STATUSES as OfferStatus[] },
        },
      });

      if (liveCount >= input.maxLiveOffers) {
        return { status: "limit_reached" as const };
      }

      const existing = await tx.offer.findFirst({
        where: {
          buyerId: input.buyerId,
          propertyId: input.propertyId,
          status: { in: LIVE_OFFER_STATUSES as OfferStatus[] },
        },
      });

      if (existing) {
        return { status: "already_exists" as const };
      }

      const offerId = uuidv7();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7-day TTL (O10)

      await tx.offer.create({
        data: {
          id: offerId,
          buyerId: input.buyerId,
          agentId: input.agentId,
          propertyId: input.propertyId,
          status: "PENDING_AGENT",
          expiresAt,
        },
      });

      await tx.offerRevision.create({
        data: {
          id: uuidv7(),
          offerId,
          actorId: input.buyerId,
          revisionNumber: 1,
          amount: BigInt(input.amount),
          earnestMoney: input.earnestMoney ? BigInt(input.earnestMoney) : null,
          conditions: input.conditions ?? null,
          proposedClosingDate: input.proposedClosingDate
            ? new Date(input.proposedClosingDate)
            : null,
        },
      });

      // Advance or create Lead per Business Rules §3.3
      await tx.lead.upsert({
        where: {
          buyerId_propertyId: {
            buyerId: input.buyerId,
            propertyId: input.propertyId,
          },
        },
        create: {
          id: uuidv7(),
          buyerId: input.buyerId,
          agentId: input.agentId,
          propertyId: input.propertyId,
          status: "QUALIFIED",
        },
        update: {
          agentId: input.agentId,
          status: "QUALIFIED",
        },
      });

      const created = await tx.offer.findUniqueOrThrow({
        where: { id: offerId },
        include: offerInclude,
      });

      return { status: "created" as const, offer: created };
    });
  }

  /**
   * O2 & O3: Counter-Offer (atomic CAS transition and new revision)
   */
  async counterOffer(input: {
    offerId: string;
    actorId: string;
    expectedStatus: OfferStatusType;
    nextStatus: OfferStatusType;
    amount: number;
    earnestMoney?: number;
    conditions?: string;
    proposedClosingDate?: string;
  }): Promise<{ status: "ok"; offer: OfferRecord } | { status: "conflict" }> {
    return prisma.$transaction(async (tx) => {
      const current = await tx.offer.findUnique({
        where: { id: input.offerId },
        include: { revisions: { orderBy: { revisionNumber: "desc" }, take: 1 } },
      });

      if (!current || current.status !== input.expectedStatus) {
        return { status: "conflict" as const };
      }

      const nextRevNum = (current.revisions[0]?.revisionNumber ?? 0) + 1;
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7-day TTL

      await tx.offer.update({
        where: { id: input.offerId },
        data: {
          status: input.nextStatus as OfferStatus,
          expiresAt,
        },
      });

      await tx.offerRevision.create({
        data: {
          id: uuidv7(),
          offerId: input.offerId,
          actorId: input.actorId,
          revisionNumber: nextRevNum,
          amount: BigInt(input.amount),
          earnestMoney: input.earnestMoney ? BigInt(input.earnestMoney) : null,
          conditions: input.conditions ?? null,
          proposedClosingDate: input.proposedClosingDate
            ? new Date(input.proposedClosingDate)
            : null,
        },
      });

      const updated = await tx.offer.findUniqueOrThrow({
        where: { id: input.offerId },
        include: offerInclude,
      });

      return { status: "ok" as const, offer: updated };
    });
  }

  /**
   * O4 & O5: Accept Offer (Atomic creation of Payment + 72-hour deadline)
   */
  async acceptOffer(input: {
    offerId: string;
    expectedStatus: OfferStatusType;
    depositEgp: number;
  }): Promise<{ status: "ok"; offer: OfferRecord } | { status: "conflict" }> {
    return prisma.$transaction(async (tx) => {
      const current = await tx.offer.findUnique({
        where: { id: input.offerId },
      });

      if (!current || current.status !== input.expectedStatus) {
        return { status: "conflict" as const };
      }

      const depositDeadline = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 hours per Business Rules §1

      await tx.offer.update({
        where: { id: input.offerId },
        data: {
          status: "ACCEPTED",
          acceptedAt: new Date(),
          expiresAt: depositDeadline,
        },
      });

      await tx.payment.create({
        data: {
          id: uuidv7(),
          offerId: input.offerId,
          buyerId: current.buyerId,
          grossAmount: BigInt(input.depositEgp),
          feeAmount: 0n,
          netAmount: BigInt(input.depositEgp),
          currency: "EGP",
          status: "PENDING",
          deadlineAt: depositDeadline,
        },
      });

      const updated = await tx.offer.findUniqueOrThrow({
        where: { id: input.offerId },
        include: offerInclude,
      });

      return { status: "ok" as const, offer: updated };
    });
  }

  /**
   * O6: Reject Offer (Agent only)
   */
  async rejectOffer(
    offerId: string,
    reason?: string
  ): Promise<{ status: "ok"; offer: OfferRecord } | { status: "conflict" }> {
    return prisma.$transaction(async (tx) => {
      const current = await tx.offer.findUnique({ where: { id: offerId } });
      if (!current || current.status !== "PENDING_AGENT") {
        return { status: "conflict" as const };
      }

      await tx.offer.update({
        where: { id: offerId },
        data: {
          status: "REJECTED",
          rejectionReason: reason ?? null,
        },
      });

      const updated = await tx.offer.findUniqueOrThrow({
        where: { id: offerId },
        include: offerInclude,
      });

      return { status: "ok" as const, offer: updated };
    });
  }

  /**
   * O7 & O8: Withdraw Offer (Buyer only)
   */
  async withdrawOffer(
    offerId: string,
    reason?: string
  ): Promise<
    | { status: "ok"; offer: OfferRecord }
    | { status: "conflict" }
    | { status: "already_reserved" }
  > {
    return prisma.$transaction(async (tx) => {
      const current = await tx.offer.findUnique({
        where: { id: offerId },
        include: { payments: { where: { status: "SUCCEEDED" } } },
      });

      if (!current) {
        return { status: "conflict" as const };
      }

      if (current.status === "RESERVED" || current.payments.length > 0) {
        return { status: "already_reserved" as const };
      }

      if (!["PENDING_AGENT", "PENDING_BUYER", "ACCEPTED"].includes(current.status)) {
        return { status: "conflict" as const };
      }

      // Cancel any pending payment (per Business Rules §5 Y5 / O8)
      await tx.payment.updateMany({
        where: { offerId, status: "PENDING" },
        data: { status: "CANCELLED" },
      });

      await tx.offer.update({
        where: { id: offerId },
        data: {
          status: "WITHDRAWN",
          withdrawalReason: reason ?? null,
        },
      });

      const updated = await tx.offer.findUniqueOrThrow({
        where: { id: offerId },
        include: offerInclude,
      });

      return { status: "ok" as const, offer: updated };
    });
  }

  async getOfferById(id: string): Promise<OfferRecord | null> {
    return prisma.offer.findUnique({
      where: { id },
      include: offerInclude,
    });
  }

  async listOffersForBuyer(
    buyerId: string,
    filter: {
      scope?: "live" | "terminal" | "all";
      propertyId?: string;
      cursor?: string;
      limit: number;
    }
  ): Promise<{ items: OfferRecord[]; nextCursor: string | null; hasNextPage: boolean }> {
    const where: Prisma.OfferWhereInput = {
      buyerId,
      ...(filter.propertyId && { propertyId: filter.propertyId }),
      ...(filter.scope === "live" && { status: { in: LIVE_OFFER_STATUSES as OfferStatus[] } }),
      ...(filter.scope === "terminal" && {
        status: { notIn: LIVE_OFFER_STATUSES as OfferStatus[] },
      }),
    };

    const take = filter.limit + 1;
    const items = await prisma.offer.findMany({
      where,
      take,
      ...(filter.cursor && { cursor: { id: filter.cursor }, skip: 1 }),
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      include: offerInclude,
    });

    const hasNextPage = items.length > filter.limit;
    const pageItems = hasNextPage ? items.slice(0, filter.limit) : items;
    const nextCursor = hasNextPage ? pageItems[pageItems.length - 1]?.id ?? null : null;

    return { items: pageItems, nextCursor, hasNextPage };
  }

  async listOffersForAgent(
    agentId: string,
    filter: {
      scope?: "live" | "terminal" | "all";
      propertyId?: string;
      cursor?: string;
      limit: number;
    }
  ): Promise<{ items: OfferRecord[]; nextCursor: string | null; hasNextPage: boolean }> {
    const where: Prisma.OfferWhereInput = {
      agentId,
      ...(filter.propertyId && { propertyId: filter.propertyId }),
      ...(filter.scope === "live" && { status: { in: LIVE_OFFER_STATUSES as OfferStatus[] } }),
      ...(filter.scope === "terminal" && {
        status: { notIn: LIVE_OFFER_STATUSES as OfferStatus[] },
      }),
    };

    const take = filter.limit + 1;
    const items = await prisma.offer.findMany({
      where,
      take,
      ...(filter.cursor && { cursor: { id: filter.cursor }, skip: 1 }),
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      include: offerInclude,
    });

    const hasNextPage = items.length > filter.limit;
    const pageItems = hasNextPage ? items.slice(0, filter.limit) : items;
    const nextCursor = hasNextPage ? pageItems[pageItems.length - 1]?.id ?? null : null;

    return { items: pageItems, nextCursor, hasNextPage };
  }

  /**
   * Two-Party Sale Confirmation (BUY-10, AGT-07)
   */
  async confirmSaleByParty(offerId: string, role: "BUYER" | "AGENT"): Promise<OfferRecord> {
    return prisma.offer.update({
      where: { id: offerId },
      data: {
        ...(role === "BUYER" ? { buyerConfirmedAt: new Date() } : { agentConfirmedAt: new Date() }),
      },
      include: offerInclude,
    });
  }

  /**
   * Complete Sale Atomic Bundle (P9 & O13, Decision #77, #83)
   */
  async completeSaleAtomic(offerId: string, propertyId: string, buyerId: string): Promise<OfferRecord> {
    return prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('prop_sale_' || ${propertyId}))`;

      const updatedOffer = await tx.offer.update({
        where: { id: offerId },
        data: {
          status: "COMPLETED",
        },
        include: offerInclude,
      });

      await tx.property.update({
        where: { id: propertyId },
        data: {
          status: "SOLD",
        },
      });

      await tx.lead.updateMany({
        where: {
          propertyId,
          buyerId,
        },
        data: {
          status: "QUALIFIED",
        },
      });

      return updatedOffer;
    });
  }

  /**
   * Report Dispute on Reserved Sale
   */
  async disputeSale(offerId: string, userId: string, reason: string): Promise<OfferRecord> {
    return prisma.offer.update({
      where: { id: offerId },
      data: {
        disputedAt: new Date(),
        disputedById: userId,
        disputeReason: reason,
      },
      include: offerInclude,
    });
  }

  /**
   * Admin Confirm Sale Completion (P9 / P9a / ADM-07, Decision #82)
   */
  async adminConfirmSale(
    offerId: string,
    propertyId: string,
    buyerId: string,
    adminId: string,
    notes: string
  ): Promise<OfferRecord> {
    return prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('prop_sale_' || ${propertyId}))`;

      const updatedOffer = await tx.offer.update({
        where: { id: offerId },
        data: {
          status: "COMPLETED",
          adminReviewedAt: new Date(),
          adminReviewedById: adminId,
          adminReviewDecision: "CONFIRMED_SOLD",
          adminReviewNotes: notes,
        },
        include: offerInclude,
      });

      await tx.property.update({
        where: { id: propertyId },
        data: {
          status: "SOLD",
        },
      });

      await tx.lead.updateMany({
        where: {
          propertyId,
          buyerId,
        },
        data: {
          status: "QUALIFIED",
        },
      });

      return updatedOffer;
    });
  }

  /**
   * Admin Declare Sale Fell Through (P10 / O14 / ADM-07, Decision #82, §7)
   */
  async adminFellThroughSale(
    offerId: string,
    propertyId: string,
    adminId: string,
    cause: string,
    reason: string,
    notes?: string
  ): Promise<OfferRecord> {
    return prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('prop_sale_' || ${propertyId}))`;

      const updatedOffer = await tx.offer.update({
        where: { id: offerId },
        data: {
          status: "FELL_THROUGH",
          adminReviewedAt: new Date(),
          adminReviewedById: adminId,
          adminReviewDecision: "FELL_THROUGH",
          adminReviewNotes: `[Cause: ${cause}] Reason: ${reason}. Notes: ${notes ?? ""}`.trim(),
        },
        include: offerInclude,
      });

      await tx.property.update({
        where: { id: propertyId },
        data: {
          status: "PUBLISHED",
        },
      });

      return updatedOffer;
    });
  }

  /**
   * Admin Extend Review Period (ADM-07, Decision #82)
   */
  async adminExtendSaleReview(
    offerId: string,
    adminId: string,
    extensionDays: number,
    notes: string
  ): Promise<OfferRecord> {
    const extensionMs = extensionDays * 24 * 60 * 60 * 1000;
    const deadline = new Date(Date.now() + extensionMs);

    return prisma.offer.update({
      where: { id: offerId },
      data: {
        adminReviewedAt: new Date(),
        adminReviewedById: adminId,
        adminReviewDecision: "EXTENDED",
        adminReviewNotes: notes,
        adminReviewDeadline: deadline,
      },
      include: offerInclude,
    });
  }

  /**
   * Admin List Sales Review Queue (ADM-07)
   */
  async listAdminSales(filter: {
    tab: "ACTION_REQUIRED" | "ACTIVE" | "RESOLVED";
    search?: string;
    cursor?: string;
    limit: number;
  }): Promise<{
    items: OfferRecord[];
    nextCursor: string | null;
    hasNextPage: boolean;
    counts: { actionRequired: number; active: number; resolved: number };
  }> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const searchCondition: Prisma.OfferWhereInput | undefined = filter.search?.trim()
      ? {
          OR: [
            { property: { titleEn: { contains: filter.search.trim(), mode: "insensitive" } } },
            { buyer: { name: { contains: filter.search.trim(), mode: "insensitive" } } },
            { buyer: { email: { contains: filter.search.trim(), mode: "insensitive" } } },
            { agent: { name: { contains: filter.search.trim(), mode: "insensitive" } } },
          ],
        }
      : undefined;

    const actionRequiredWhere: Prisma.OfferWhereInput = {
      status: "RESERVED",
      OR: [
        { disputedAt: { not: null } },
        { createdAt: { lte: thirtyDaysAgo } },
        { adminReviewDeadline: { lte: now } },
      ],
      ...(searchCondition && searchCondition),
    };

    const activeWhere: Prisma.OfferWhereInput = {
      status: "RESERVED",
      ...(searchCondition && searchCondition),
    };

    const resolvedWhere: Prisma.OfferWhereInput = {
      status: { in: ["COMPLETED", "FELL_THROUGH"] },
      ...(searchCondition && searchCondition),
    };

    const [actionRequiredCount, activeCount, resolvedCount] = await Promise.all([
      prisma.offer.count({ where: actionRequiredWhere }),
      prisma.offer.count({ where: activeWhere }),
      prisma.offer.count({ where: resolvedWhere }),
    ]);

    const activeTabWhere =
      filter.tab === "ACTION_REQUIRED"
        ? actionRequiredWhere
        : filter.tab === "RESOLVED"
        ? resolvedWhere
        : activeWhere;

    const take = filter.limit + 1;
    const items = await prisma.offer.findMany({
      where: activeTabWhere,
      take,
      ...(filter.cursor && { cursor: { id: filter.cursor }, skip: 1 }),
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      include: offerInclude,
    });

    const hasNextPage = items.length > filter.limit;
    const pageItems = hasNextPage ? items.slice(0, filter.limit) : items;
    const nextCursor = hasNextPage ? pageItems[pageItems.length - 1]?.id ?? null : null;

    return {
      items: pageItems,
      nextCursor,
      hasNextPage,
      counts: {
        actionRequired: actionRequiredCount,
        active: activeCount,
        resolved: resolvedCount,
      },
    };
  }

  async countActionRequiredSales(): Promise<number> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const now = new Date();
    return await prisma.offer.count({
      where: {
        status: "RESERVED",
        OR: [
          { disputedAt: { not: null } },
          { createdAt: { lte: thirtyDaysAgo } },
          { adminReviewDeadline: { lte: now } },
        ],
      },
    });
  }
}

export const offerRepository = new OfferRepository();
