import { BUSINESS_CONSTANTS } from "../../../config/index.js";
import {
  conflictError,
  forbiddenError,
  notFoundError,
  ProblemError,
} from "../../../shared/errors/problem-details.js";
import {
  offerRepository,
  type OfferRecord,
} from "../repository/offer.repository.js";
import { notificationService } from "../../notifications/service/index.js";
import type {
  CreateOfferSchema,
  CounterOfferSchema,
  OfferResponse,
  OfferListQuerySchema,
  AdminSalesQuerySchema,
  AdminSaleItemSchema,
} from "../schema/offer.schema.js";
import type { z } from "zod";

function notFound(resource: string, id?: string, instance?: string) {
  return notFoundError(resource, id, instance);
}

function forbidden(code: string, detail: string, instance?: string) {
  return new ProblemError({
    type: `/errors/${code}`,
    title: "Forbidden",
    status: 403,
    detail,
    instance,
  });
}

function conflict(type: string, detail: string, instance?: string) {
  return conflictError(`/errors/${type}`, type, detail, undefined, instance);
}

export class OfferService {
  /**
   * Format an OfferRecord into the public API OfferResponse contract.
   * Enforces Decision #60 (no agent phone) and Decision #66, #72 (buyer phone visible only during active offer).
   */
  private async formatOffer(
    offer: OfferRecord,
    viewerId: string,
    viewerRole: "BUYER" | "AGENT" | "ADMIN"
  ): Promise<OfferResponse> {
    const latestRevision = offer.revisions[offer.revisions.length - 1];
    if (!latestRevision) {
      throw new Error(`Offer ${offer.id} has no revisions`);
    }

    // Buyer phone visibility rule: visible to agent only while the buyer has a live offer with this agent
    let canViewBuyerPhone = false;
    if (viewerRole === "ADMIN" || viewerId === offer.buyerId) {
      canViewBuyerPhone = true;
    } else if (viewerId === offer.agentId) {
      canViewBuyerPhone = await offerRepository.buyerHasActiveOfferWithAgent(
        offer.buyerId,
        offer.agentId
      );
    }

    const latestAmount = Number(latestRevision.amount);
    const depositEgp = Math.min(
      Math.round(latestAmount * BUSINESS_CONSTANTS.DEPOSIT_PERCENTAGE),
      BUSINESS_CONSTANTS.DEPOSIT_CAP_EGP
    );

    const pendingPayment = offer.payments[0];

    return {
      id: offer.id,
      propertyId: offer.propertyId,
      status: offer.status as OfferResponse["status"],
      currentAmount: latestAmount,
      acceptedAt: offer.acceptedAt ? offer.acceptedAt.toISOString() : null,
      expiresAt: offer.expiresAt ? offer.expiresAt.toISOString() : null,
      rejectionReason: offer.rejectionReason,
      withdrawalReason: offer.withdrawalReason,
      depositAmount: depositEgp,
      depositDeadlineAt: pendingPayment ? pendingPayment.deadlineAt.toISOString() : null,
      buyerConfirmedAt: offer.buyerConfirmedAt ? offer.buyerConfirmedAt.toISOString() : null,
      agentConfirmedAt: offer.agentConfirmedAt ? offer.agentConfirmedAt.toISOString() : null,
      disputedAt: offer.disputedAt ? offer.disputedAt.toISOString() : null,
      disputedById: offer.disputedById ?? null,
      disputeReason: offer.disputeReason ?? null,
      adminReviewedAt: offer.adminReviewedAt ? offer.adminReviewedAt.toISOString() : null,
      adminReviewedById: offer.adminReviewedById ?? null,
      adminReviewDecision: offer.adminReviewDecision ?? null,
      adminReviewNotes: offer.adminReviewNotes ?? null,
      adminReviewDeadline: offer.adminReviewDeadline ? offer.adminReviewDeadline.toISOString() : null,
      property: {
        id: offer.property.id,
        slug: offer.property.slug,
        title: offer.property.titleEn,
        price: Number(offer.property.price),
        imageUrl: offer.property.images[0]?.url ?? null,
        intent: offer.property.listingIntent,
        status: offer.property.status,
      },
      buyer: {
        id: offer.buyer.id,
        name: offer.buyer.name,
        phone: canViewBuyerPhone ? offer.buyer.phone : null,
      },
      agent: {
        id: offer.agent.id,
        name: offer.agent.name,
        phone: null, // Decision #60: Agent phone is never public
      },
      latestRevision: {
        id: latestRevision.id,
        revisionNumber: latestRevision.revisionNumber,
        actorId: latestRevision.actorId,
        actorRole: latestRevision.actorId === offer.buyerId ? "BUYER" : "AGENT",
        amount: Number(latestRevision.amount),
        earnestMoney: latestRevision.earnestMoney ? Number(latestRevision.earnestMoney) : null,
        conditions: latestRevision.conditions,
        proposedClosingDate: latestRevision.proposedClosingDate
          ? latestRevision.proposedClosingDate.toISOString()
          : null,
        createdAt: latestRevision.createdAt.toISOString(),
      },
      revisions: offer.revisions.map((rev) => ({
        id: rev.id,
        revisionNumber: rev.revisionNumber,
        actorId: rev.actorId,
        actorRole: rev.actorId === offer.buyerId ? "BUYER" : "AGENT",
        amount: Number(rev.amount),
        earnestMoney: rev.earnestMoney ? Number(rev.earnestMoney) : null,
        conditions: rev.conditions,
        proposedClosingDate: rev.proposedClosingDate
          ? rev.proposedClosingDate.toISOString()
          : null,
        createdAt: rev.createdAt.toISOString(),
      })),
      createdAt: offer.createdAt.toISOString(),
      updatedAt: offer.updatedAt.toISOString(),
    };
  }

  /**
   * O1: Submit initial offer (Buyer -> PENDING_AGENT)
   */
  async createOffer(
    user: { id: string; emailVerified: boolean },
    input: z.infer<typeof CreateOfferSchema>
  ): Promise<OfferResponse> {
    if (!user.emailVerified) {
      throw forbidden(
        "email-not-verified",
        "A verified email is required to submit an offer.",
        "/api/v1/offers"
      );
    }

    const property = await offerRepository.findPropertyForOffer(input.propertyId);
    if (!property) {
      throw notFound("Property not found", `/api/v1/properties/${input.propertyId}`);
    }

    if (property.status !== "PUBLISHED") {
      throw conflict(
        "property-not-published",
        "Offers can only be submitted on published listings.",
        `/api/v1/properties/${input.propertyId}`
      );
    }

    if (property.listingIntent !== "SALE") {
      throw conflict(
        "sale-only",
        "Offers are permitted on properties for sale only (Business Rules O1).",
        `/api/v1/properties/${input.propertyId}`
      );
    }

    if (property.agentId === user.id) {
      throw forbidden(
        "own-listing",
        "Agents cannot submit an offer on their own listings (#50).",
        `/api/v1/properties/${input.propertyId}`
      );
    }

    const result = await offerRepository.createOffer({
      buyerId: user.id,
      agentId: property.agentId,
      propertyId: input.propertyId,
      amount: input.amount,
      earnestMoney: input.earnestMoney,
      conditions: input.conditions,
      proposedClosingDate: input.proposedClosingDate,
      maxLiveOffers: BUSINESS_CONSTANTS.MAX_LIVE_OFFERS_PER_BUYER,
    });

    if (result.status === "limit_reached") {
      throw conflict(
        "max-live-offers-exceeded",
        `You have reached the limit of ${BUSINESS_CONSTANTS.MAX_LIVE_OFFERS_PER_BUYER} concurrent live offers (Invariant I12).`,
        "/api/v1/offers"
      );
    }

    if (result.status === "already_exists") {
      throw conflict(
        "active-offer-exists",
        "You already have an active offer on this property.",
        `/api/v1/properties/${input.propertyId}`
      );
    }

    void notificationService
      .notifyUser({
        userId: property.agentId,
        type: "OFFER_SUBMITTED",
        params: {
          offerId: result.offer.id,
          propertyId: input.propertyId,
          propertyTitle: property.titleEn,
          priceEgp: input.amount,
          buyerName: (user as { name?: string }).name || "A buyer",
          recipientRole: "agent",
        },
        sendEmail: true,
      })
      .catch(() => {});

    return this.formatOffer(result.offer, user.id, "BUYER");
  }

  /**
   * O2 (Agent) & O3 (Buyer): Counter an offer
   */
  async counterOffer(
    user: { id: string; emailVerified: boolean; role?: string },
    offerId: string,
    input: z.infer<typeof CounterOfferSchema>
  ): Promise<OfferResponse> {
    const offer = await offerRepository.getOfferById(offerId);
    if (!offer) {
      throw notFound("Offer not found", `/api/v1/offers/${offerId}`);
    }

    const isBuyer = user.id === offer.buyerId;
    const isAgent = user.id === offer.agentId;

    if (!isBuyer && !isAgent) {
      throw forbidden("not-offer-party", "Only offer parties can counter this offer.");
    }

    let expectedStatus: "PENDING_AGENT" | "PENDING_BUYER";
    let nextStatus: "PENDING_AGENT" | "PENDING_BUYER";

    if (isAgent) {
      expectedStatus = "PENDING_AGENT";
      nextStatus = "PENDING_BUYER";
    } else {
      if (!user.emailVerified) {
        throw forbidden("email-not-verified", "A verified email is required to counter an offer.");
      }
      expectedStatus = "PENDING_BUYER";
      nextStatus = "PENDING_AGENT";
    }

    if (offer.status !== expectedStatus) {
      throw conflict(
        "offer-status-conflict",
        `Offer cannot be countered in its current state (${offer.status}). It must be ${expectedStatus}.`
      );
    }

    const result = await offerRepository.counterOffer({
      offerId,
      actorId: user.id,
      expectedStatus,
      nextStatus,
      amount: input.amount,
      earnestMoney: input.earnestMoney,
      conditions: input.conditions,
      proposedClosingDate: input.proposedClosingDate,
    });

    if (result.status === "conflict") {
      throw conflict(
        "offer-state-changed",
        "The offer state changed while preparing your counter-offer. Please refresh."
      );
    }

    const counterRecipientId = isAgent ? offer.buyerId : offer.agentId;
    void notificationService
      .notifyUser({
        userId: counterRecipientId,
        type: "OFFER_COUNTERED",
        params: {
          offerId,
          propertyTitle: offer.property.titleEn,
          priceEgp: input.amount,
          recipientRole: isAgent ? "buyer" : "agent",
        },
        sendEmail: true,
      })
      .catch(() => {});

    return this.formatOffer(result.offer, user.id, isAgent ? "AGENT" : "BUYER");
  }

  /**
   * O4 (Agent) & O5 (Buyer): Accept the offer
   */
  async acceptOffer(
    user: { id: string; emailVerified?: boolean; role?: string },
    offerId: string
  ): Promise<OfferResponse> {
    const offer = await offerRepository.getOfferById(offerId);
    if (!offer) {
      throw notFound("Offer not found", `/api/v1/offers/${offerId}`);
    }

    const isBuyer = user.id === offer.buyerId;
    const isAgent = user.id === offer.agentId;

    if (!isBuyer && !isAgent) {
      throw forbidden("not-offer-party", "Only offer parties can accept this offer.");
    }

    // Only the party whose turn it is can accept
    const expectedStatus = isAgent ? "PENDING_AGENT" : "PENDING_BUYER";
    if (offer.status !== expectedStatus) {
      throw conflict(
        "offer-status-conflict",
        `Only the pending party can accept this offer. Current status is ${offer.status}, expected ${expectedStatus}.`
      );
    }

    const latestRevision = offer.revisions[offer.revisions.length - 1];
    if (!latestRevision) {
      throw new Error(`Offer ${offerId} has no revisions`);
    }

    const depositEgp = Math.min(
      Math.round(Number(latestRevision.amount) * BUSINESS_CONSTANTS.DEPOSIT_PERCENTAGE),
      BUSINESS_CONSTANTS.DEPOSIT_CAP_EGP
    );

    const result = await offerRepository.acceptOffer({
      offerId,
      expectedStatus,
      depositEgp,
    });

    if (result.status === "conflict") {
      throw conflict(
        "offer-state-changed",
        "The offer state changed before it could be accepted. Please refresh."
      );
    }

    void notificationService
      .notifyUser({
        userId: offer.buyerId,
        type: "OFFER_ACCEPTED",
        params: {
          offerId,
          propertyTitle: offer.property.titleEn,
          priceEgp: Number(latestRevision.amount),
          recipientRole: "buyer",
        },
        sendEmail: true,
      })
      .catch(() => {});

    return this.formatOffer(result.offer, user.id, isAgent ? "AGENT" : "BUYER");
  }

  /**
   * O6: Agent rejects the offer
   */
  async rejectOffer(
    user: { id: string },
    offerId: string,
    reason?: string
  ): Promise<OfferResponse> {
    const offer = await offerRepository.getOfferById(offerId);
    if (!offer) {
      throw notFound("Offer not found", `/api/v1/offers/${offerId}`);
    }

    if (user.id !== offer.agentId) {
      throw forbidden("agent-only", "Only the listing agent can reject this offer.");
    }

    if (offer.status !== "PENDING_AGENT") {
      throw conflict(
        "offer-status-conflict",
        `Offer cannot be rejected in its current state (${offer.status}).`
      );
    }

    const result = await offerRepository.rejectOffer(offerId, reason);
    if (result.status === "conflict") {
      throw conflict(
        "offer-state-changed",
        "The offer state changed before it could be rejected. Please refresh."
      );
    }

    void notificationService
      .notifyUser({
        userId: offer.buyerId,
        type: "OFFER_REJECTED",
        params: {
          offerId,
          propertyTitle: offer.property.titleEn,
          recipientRole: "buyer",
        },
        sendEmail: true,
      })
      .catch(() => {});

    return this.formatOffer(result.offer, user.id, "AGENT");
  }

  /**
   * O7 & O8: Buyer withdraws the offer
   */
  async withdrawOffer(
    user: { id: string },
    offerId: string,
    reason?: string
  ): Promise<OfferResponse> {
    const offer = await offerRepository.getOfferById(offerId);
    if (!offer) {
      throw notFound("Offer not found", `/api/v1/offers/${offerId}`);
    }

    if (user.id !== offer.buyerId) {
      throw forbidden("buyer-only", "Only the buyer can withdraw this offer.");
    }

    const result = await offerRepository.withdrawOffer(offerId, reason);
    if (result.status === "already_reserved") {
      throw conflict(
        "offer-reserved",
        "This offer is already reserved with a confirmed deposit. It cannot be unilaterally withdrawn."
      );
    }

    if (result.status === "conflict") {
      throw conflict(
        "offer-status-conflict",
        `Offer cannot be withdrawn in its current state (${offer.status}).`
      );
    }

    return this.formatOffer(result.offer, user.id, "BUYER");
  }

  /**
   * Get single offer details
   */
  async getOffer(
    user: { id: string; role?: string },
    offerId: string
  ): Promise<OfferResponse> {
    const offer = await offerRepository.getOfferById(offerId);
    if (!offer) {
      throw notFound("Offer not found", `/api/v1/offers/${offerId}`);
    }

    const isBuyer = user.id === offer.buyerId;
    const isAgent = user.id === offer.agentId;
    const isAdmin = user.role === "ADMIN";

    if (!isBuyer && !isAgent && !isAdmin) {
      throw forbidden("not-offer-party", "You do not have permission to view this offer.");
    }

    const role = isAdmin ? "ADMIN" : isAgent ? "AGENT" : "BUYER";
    return this.formatOffer(offer, user.id, role);
  }

  /**
   * Check if current buyer has an active offer on a property
   */
  async getMyOfferForProperty(
    buyerId: string,
    propertyId: string
  ): Promise<OfferResponse | null> {
    const offer = await offerRepository.findLiveOfferForBuyerAndProperty(buyerId, propertyId);
    if (!offer) return null;
    return this.formatOffer(offer, buyerId, "BUYER");
  }

  /**
   * List offers for current user (as buyer or agent)
   */
  async listMine(
    userId: string,
    role: "buyer" | "agent",
    query: z.infer<typeof OfferListQuerySchema>
  ) {
    const result =
      role === "buyer"
        ? await offerRepository.listOffersForBuyer(userId, {
            scope: query.scope,
            propertyId: query.propertyId,
            cursor: query.cursor,
            limit: query.limit,
          })
        : await offerRepository.listOffersForAgent(userId, {
            scope: query.scope,
            propertyId: query.propertyId,
            cursor: query.cursor,
            limit: query.limit,
          });

    const items = await Promise.all(
      result.items.map((offer) =>
        this.formatOffer(offer, userId, role === "buyer" ? "BUYER" : "AGENT")
      )
    );

    return {
      items,
      pageInfo: {
        nextCursor: result.nextCursor,
        hasNextPage: result.hasNextPage,
      },
    };
  }

  /**
   * Two-Party Sale Confirmation (BUY-10, AGT-07, Decision #77, #102)
   */
  async confirmSale(
    offerId: string,
    user: { id: string; role: string }
  ): Promise<{ status: "ok"; offer: OfferResponse } | { status: "error"; error: ProblemError }> {
    const offer = await offerRepository.getOfferById(offerId);
    if (!offer) {
      return { status: "error", error: notFound("Offer", offerId) };
    }

    if (offer.status !== "RESERVED") {
      return {
        status: "error",
        error: conflict(
          "invalid-offer-state",
          `Sale confirmation requires offer to be in RESERVED state, currently ${offer.status}`
        ),
      };
    }

    const isBuyer = user.id === offer.buyerId;
    const isAgent = user.id === offer.agentId;

    if (!isBuyer && !isAgent) {
      return {
        status: "error",
        error: forbidden("forbidden", "Only the buyer or listing agent of this reservation can confirm sale completion"),
      };
    }

    const role: "BUYER" | "AGENT" = isBuyer ? "BUYER" : "AGENT";

    if (role === "BUYER" && offer.buyerConfirmedAt) {
      return {
        status: "error",
        error: conflict("already-confirmed", "Buyer has already confirmed sale completion"),
      };
    }

    if (role === "AGENT" && offer.agentConfirmedAt) {
      return {
        status: "error",
        error: conflict("already-confirmed", "Agent has already confirmed sale completion"),
      };
    }

    const counterpartyConfirmed = role === "BUYER" ? Boolean(offer.agentConfirmedAt) : Boolean(offer.buyerConfirmedAt);

    if (counterpartyConfirmed) {
      // Both parties have confirmed! Execute Atomic Completion Bundle (P9 & O13)
      const completed = await offerRepository.completeSaleAtomic(offer.id, offer.propertyId, offer.buyerId);
      const finalized = await offerRepository.confirmSaleByParty(completed.id, role);

      // Notify both parties
      await notificationService.notifyUser({
        userId: offer.buyerId,
        type: "SALE_COMPLETED",
        params: {
          offerId: offer.id,
          propertyTitle: offer.property.titleEn,
          propertySlug: offer.property.slug,
          message: `Congratulations! Both parties have confirmed conveyance. Property is now SOLD.`,
        },
      });

      await notificationService.notifyUser({
        userId: offer.agentId,
        type: "SALE_COMPLETED",
        params: {
          offerId: offer.id,
          propertyTitle: offer.property.titleEn,
          propertySlug: offer.property.slug,
          message: `Sale completed! Both parties have confirmed conveyance. Property marked SOLD.`,
        },
      });

      const formatted = await this.formatOffer(finalized, user.id, isBuyer ? "BUYER" : "AGENT");
      return { status: "ok", offer: formatted };
    } else {
      // First party confirming
      const updated = await offerRepository.confirmSaleByParty(offer.id, role);

      const recipientId = role === "BUYER" ? offer.agentId : offer.buyerId;
      const actorLabel = role === "BUYER" ? "The buyer" : "The listing agent";

      await notificationService.notifyUser({
        userId: recipientId,
        type: role === "BUYER" ? "BUYER_CONFIRMED_SALE" : "AGENT_CONFIRMED_SALE",
        params: {
          offerId: offer.id,
          propertyTitle: offer.property.titleEn,
          message: `${actorLabel} has confirmed sale completion. Please review and confirm to finalize the transaction.`,
        },
      });

      const formatted = await this.formatOffer(updated, user.id, isBuyer ? "BUYER" : "AGENT");
      return { status: "ok", offer: formatted };
    }
  }

  /**
   * Report Dispute on Reserved Sale (P9a)
   */
  async disputeSale(
    offerId: string,
    user: { id: string; role: string },
    reason: string
  ): Promise<{ status: "ok"; offer: OfferResponse } | { status: "error"; error: ProblemError }> {
    const offer = await offerRepository.getOfferById(offerId);
    if (!offer) {
      return { status: "error", error: notFound("Offer", offerId) };
    }

    if (offer.status !== "RESERVED") {
      return {
        status: "error",
        error: conflict("invalid-offer-state", `Can only dispute an offer in RESERVED state, currently ${offer.status}`),
      };
    }

    const isBuyer = user.id === offer.buyerId;
    const isAgent = user.id === offer.agentId;

    if (!isBuyer && !isAgent) {
      return {
        status: "error",
        error: forbidden("forbidden", "Only the buyer or listing agent can report a dispute for this reservation"),
      };
    }

    if (offer.disputedAt) {
      return {
        status: "error",
        error: conflict("already-disputed", "A dispute has already been recorded for this transaction"),
      };
    }

    const updated = await offerRepository.disputeSale(offer.id, user.id, reason);

    const recipientId = isBuyer ? offer.agentId : offer.buyerId;
    const actorLabel = isBuyer ? "Buyer" : "Agent";

    await notificationService.notifyUser({
      userId: recipientId,
      type: "SALE_DISPUTED",
      params: {
        offerId: offer.id,
        propertyTitle: offer.property.titleEn,
        message: `${actorLabel} reported a dispute on the conveyance process: "${reason}". Case entered Admin Review.`,
      },
    });

    const formatted = await this.formatOffer(updated, user.id, isBuyer ? "BUYER" : "AGENT");
    return { status: "ok", offer: formatted };
  }

  private formatAdminSaleItem(offer: OfferRecord): z.infer<typeof AdminSaleItemSchema> {
    const latestRevision = offer.revisions[offer.revisions.length - 1];
    const agreedPrice = latestRevision ? Number(latestRevision.amount) : Number(offer.property.price);
    const depositAmount = Math.min(
      Math.round(agreedPrice * BUSINESS_CONSTANTS.DEPOSIT_PERCENTAGE),
      BUSINESS_CONSTANTS.DEPOSIT_CAP_EGP
    );

    const now = new Date();
    const reservationDate = offer.acceptedAt ?? offer.updatedAt;
    const daysElapsed = Math.floor((now.getTime() - new Date(reservationDate).getTime()) / (24 * 60 * 60 * 1000));
    const isDeadlinePassed = daysElapsed >= 30 || (offer.adminReviewDeadline ? new Date(offer.adminReviewDeadline).getTime() <= now.getTime() : false);
    const isDisputed = Boolean(offer.disputedAt);
    const requiresAction = offer.status === "RESERVED" && (isDisputed || isDeadlinePassed);

    return {
      id: offer.id,
      propertyId: offer.propertyId,
      status: offer.status as z.infer<typeof AdminSaleItemSchema>["status"],
      agreedPrice,
      depositAmount,
      property: {
        id: offer.property.id,
        title: offer.property.titleEn ?? "Untitled Property",
        slug: offer.property.slug,
        imageUrl: offer.property.images[0]?.url ?? null,
        price: Number(offer.property.price),
        status: offer.property.status,
      },
      buyer: {
        id: offer.buyer.id,
        name: offer.buyer.name,
        email: offer.buyer.email,
      },
      agent: {
        id: offer.agent.id,
        name: offer.agent.name,
        email: offer.agent.email,
      },
      buyerConfirmedAt: offer.buyerConfirmedAt ? offer.buyerConfirmedAt.toISOString() : null,
      agentConfirmedAt: offer.agentConfirmedAt ? offer.agentConfirmedAt.toISOString() : null,
      disputedAt: offer.disputedAt ? offer.disputedAt.toISOString() : null,
      disputeReason: offer.disputeReason ?? null,
      adminReviewedAt: offer.adminReviewedAt ? offer.adminReviewedAt.toISOString() : null,
      adminReviewDecision: offer.adminReviewDecision ?? null,
      adminReviewNotes: offer.adminReviewNotes ?? null,
      adminReviewDeadline: offer.adminReviewDeadline ? offer.adminReviewDeadline.toISOString() : null,
      reservationDate: reservationDate ? reservationDate.toISOString() : null,
      daysElapsed,
      isDisputed,
      isDeadlinePassed,
      requiresAction,
    };
  }

  async listAdminSales(query: z.infer<typeof AdminSalesQuerySchema>) {
    const result = await offerRepository.listAdminSales({
      tab: query.tab ?? "ACTION_REQUIRED",
      search: query.search,
      cursor: query.cursor,
      limit: query.limit,
    });

    const items = result.items.map((offer) => this.formatAdminSaleItem(offer));

    return {
      items,
      counts: result.counts,
      pageInfo: {
        nextCursor: result.nextCursor,
        hasNextPage: result.hasNextPage,
      },
    };
  }

  async getAdminSaleById(offerId: string) {
    const offer = await offerRepository.getOfferById(offerId);
    if (!offer) {
      return { status: "error", error: notFound("SaleCase", offerId) };
    }
    return { status: "ok", sale: this.formatAdminSaleItem(offer) };
  }

  async adminConfirmSale(
    offerId: string,
    adminUser: { id: string },
    notes: string
  ): Promise<{ status: "ok"; offer: OfferResponse } | { status: "error"; error: ProblemError }> {
    const offer = await offerRepository.getOfferById(offerId);
    if (!offer) {
      return { status: "error", error: notFound("Offer", offerId) };
    }

    if (offer.status !== "RESERVED") {
      return {
        status: "error",
        error: conflict("invalid-offer-state", `Can only confirm a sale in RESERVED state, currently ${offer.status}`),
      };
    }

    if (adminUser.id === offer.buyerId || adminUser.id === offer.agentId) {
      return {
        status: "error",
        error: forbidden("admin-conflict-of-interest", "You are a participant in this transaction and cannot adjudicate it"),
      };
    }

    const updated = await offerRepository.adminConfirmSale(
      offer.id,
      offer.propertyId,
      offer.buyerId,
      adminUser.id,
      notes
    );

    await notificationService.notifyUser({
      userId: offer.buyerId,
      type: "SALE_COMPLETED",
      params: {
        offerId: offer.id,
        propertyTitle: offer.property.titleEn,
        message: `An administrator reviewed and confirmed sale completion. Property is now SOLD.`,
      },
    });

    await notificationService.notifyUser({
      userId: offer.agentId,
      type: "SALE_COMPLETED",
      params: {
        offerId: offer.id,
        propertyTitle: offer.property.titleEn,
        message: `An administrator reviewed and confirmed sale completion. Property is now SOLD.`,
      },
    });

    const formatted = await this.formatOffer(updated, adminUser.id, "ADMIN");
    return { status: "ok", offer: formatted };
  }

  async adminFellThroughSale(
    offerId: string,
    adminUser: { id: string },
    input: { cause: string; reason: string; notes?: string }
  ): Promise<{ status: "ok"; offer: OfferResponse } | { status: "error"; error: ProblemError }> {
    const offer = await offerRepository.getOfferById(offerId);
    if (!offer) {
      return { status: "error", error: notFound("Offer", offerId) };
    }

    if (offer.status !== "RESERVED") {
      return {
        status: "error",
        error: conflict("invalid-offer-state", `Can only fail an offer in RESERVED state, currently ${offer.status}`),
      };
    }

    if (adminUser.id === offer.buyerId || adminUser.id === offer.agentId) {
      return {
        status: "error",
        error: forbidden("admin-conflict-of-interest", "You are a participant in this transaction and cannot adjudicate it"),
      };
    }

    const updated = await offerRepository.adminFellThroughSale(
      offer.id,
      offer.propertyId,
      adminUser.id,
      input.cause,
      input.reason,
      input.notes
    );

    await notificationService.notifyUser({
      userId: offer.buyerId,
      type: "SALE_FELL_THROUGH",
      params: {
        offerId: offer.id,
        propertyTitle: offer.property.titleEn,
        message: `Sale review concluded: the transaction fell through (${input.reason}). Refund evaluation initiated.`,
      },
    });

    await notificationService.notifyUser({
      userId: offer.agentId,
      type: "SALE_FELL_THROUGH",
      params: {
        offerId: offer.id,
        propertyTitle: offer.property.titleEn,
        message: `Sale review concluded: transaction fell through (${input.reason}). Property relisted.`,
      },
    });

    const formatted = await this.formatOffer(updated, adminUser.id, "ADMIN");
    return { status: "ok", offer: formatted };
  }

  async adminExtendSaleReview(
    offerId: string,
    adminUser: { id: string },
    input: { extensionDays: number; notes: string }
  ): Promise<{ status: "ok"; offer: OfferResponse } | { status: "error"; error: ProblemError }> {
    const offer = await offerRepository.getOfferById(offerId);
    if (!offer) {
      return { status: "error", error: notFound("Offer", offerId) };
    }

    if (offer.status !== "RESERVED") {
      return {
        status: "error",
        error: conflict("invalid-offer-state", `Can only extend an offer in RESERVED state, currently ${offer.status}`),
      };
    }

    if (adminUser.id === offer.buyerId || adminUser.id === offer.agentId) {
      return {
        status: "error",
        error: forbidden("admin-conflict-of-interest", "You are a participant in this transaction and cannot adjudicate it"),
      };
    }

    const updated = await offerRepository.adminExtendSaleReview(
      offer.id,
      adminUser.id,
      input.extensionDays,
      input.notes
    );

    await notificationService.notifyUser({
      userId: offer.buyerId,
      type: "SALE_REVIEW_EXTENDED",
      params: {
        offerId: offer.id,
        propertyTitle: offer.property.titleEn,
        message: `Administrative review for this sale was extended by ${input.extensionDays} days: "${input.notes}".`,
      },
    });

    await notificationService.notifyUser({
      userId: offer.agentId,
      type: "SALE_REVIEW_EXTENDED",
      params: {
        offerId: offer.id,
        propertyTitle: offer.property.titleEn,
        message: `Administrative review for this sale was extended by ${input.extensionDays} days: "${input.notes}".`,
      },
    });

    const formatted = await this.formatOffer(updated, adminUser.id, "ADMIN");
    return { status: "ok", offer: formatted };
  }

  async countActionRequiredSales(): Promise<number> {
    return await offerRepository.countActionRequiredSales();
  }
}

export const offerService = new OfferService();

