import type { Prisma, ViewingStatus, ActorType } from "@prisma/client";
import { uuidv7 } from "uuidv7";
import { prisma } from "../../../shared/database/prisma.js";
import { lockUser, VIEWING_OVERLAP_CONSTRAINT } from "../sql/index.js";

export const OPEN_STATUSES: ViewingStatus[] = ["REQUESTED", "RESCHEDULE_PROPOSED"];
export const NON_TERMINAL_STATUSES: ViewingStatus[] = ["REQUESTED", "RESCHEDULE_PROPOSED", "CONFIRMED"];

const viewingInclude = {
  property: {
    select: {
      id: true,
      slug: true,
      titleEn: true,
      images: { select: { url: true }, orderBy: [{ isCover: "desc" }, { order: "asc" }], take: 1 },
    },
  },
  buyer: { select: { id: true, name: true } },
  agent: { select: { id: true, name: true } },
} satisfies Prisma.ViewingInclude;

export type ViewingRecord = Prisma.ViewingGetPayload<{ include: typeof viewingInclude }>;

export type AvailabilityRow = {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isBlackout: boolean;
  specificDate: Date | null;
};

function isOverlapViolation(err: unknown): boolean {
  return err instanceof Error && err.message.includes(VIEWING_OVERLAP_CONSTRAINT);
}

export class PipelineRepository {
  // ---------------------------------------------------------------- availability
  async listAvailability(agentId: string): Promise<AvailabilityRow[]> {
    return prisma.agentAvailability.findMany({
      where: { agentId },
      orderBy: [{ isBlackout: "asc" }, { dayOfWeek: "asc" }, { startTime: "asc" }],
      select: { id: true, dayOfWeek: true, startTime: true, endTime: true, isBlackout: true, specificDate: true },
    });
  }

  async replaceAvailability(
    agentId: string,
    windows: { dayOfWeek: number; startTime: string; endTime: string }[],
    blackouts: { date: Date; dayOfWeek: number }[]
  ): Promise<void> {
    await prisma.$transaction([
      prisma.agentAvailability.deleteMany({ where: { agentId } }),
      prisma.agentAvailability.createMany({
        data: [
          ...windows.map((w) => ({ id: uuidv7(), agentId, ...w, isBlackout: false })),
          ...blackouts.map((b) => ({
            id: uuidv7(),
            agentId,
            dayOfWeek: b.dayOfWeek,
            startTime: "00:00",
            endTime: "23:59",
            isBlackout: true,
            specificDate: b.date,
          })),
        ],
      }),
    ]);
  }

  async listConfirmedIntervals(agentId: string, from: Date, to: Date) {
    return prisma.viewing.findMany({
      where: { agentId, status: "CONFIRMED", startsAt: { lt: to }, endsAt: { gt: from } },
      select: { startsAt: true, endsAt: true },
    });
  }

  // ---------------------------------------------------------------- viewings
  /** V1 inside one transaction: per-buyer lock → I9 count → insert → lead create-or-reuse (#75). */
  async createRequest(input: {
    buyerId: string;
    agentId: string;
    propertyId: string;
    startsAt: Date;
    endsAt: Date;
    notes: string | null;
    maxOpen: number;
  }): Promise<{ status: "created"; viewing: ViewingRecord } | { status: "limit_reached" }> {
    return prisma.$transaction(
      async (tx) => {
        await lockUser(tx, input.buyerId);
        const open = await tx.viewing.count({
          where: { buyerId: input.buyerId, status: { in: OPEN_STATUSES } },
        });
        if (open >= input.maxOpen) return { status: "limit_reached" as const };

        const viewing = await tx.viewing.create({
          data: {
            id: uuidv7(),
            buyerId: input.buyerId,
            agentId: input.agentId,
            propertyId: input.propertyId,
            startsAt: input.startsAt,
            endsAt: input.endsAt,
            notes: input.notes,
          },
          include: viewingInclude,
        });
        await tx.lead.upsert({
          where: { buyerId_propertyId: { buyerId: input.buyerId, propertyId: input.propertyId } },
          create: {
            id: uuidv7(),
            buyerId: input.buyerId,
            agentId: input.agentId,
            propertyId: input.propertyId,
          },
          update: {},
        });
        return { status: "created" as const, viewing };
      },
      { maxWait: 15000, timeout: 30000 }
    );
  }

  async findViewing(id: string): Promise<ViewingRecord | null> {
    return prisma.viewing.findUnique({ where: { id }, include: viewingInclude });
  }

  /** Conditional update (status CAS). Returns the updated row, or null if the status moved on. */
  async transition(
    id: string,
    from: ViewingStatus[],
    data: Prisma.ViewingUpdateManyMutationInput
  ): Promise<ViewingRecord | null> {
    const { count } = await prisma.viewing.updateMany({ where: { id, status: { in: from } }, data });
    return count === 1 ? this.findViewing(id) : null;
  }

  /**
   * V2 / V5: move to CONFIRMED under the agent's advisory lock. The exclusion constraint remains the
   * database backstop against overlap (R4); rival REQUESTED rows for the same agent and time are
   * auto-declined in the same transaction.
   */
  async confirm(
    id: string,
    agentId: string,
    from: ViewingStatus,
    data: Prisma.ViewingUpdateManyMutationInput = {}
  ): Promise<{ status: "ok"; viewing: ViewingRecord } | { status: "stale" } | { status: "overlap" }> {
    try {
      const result = await prisma.$transaction(
        async (tx) => {
          // Serialise confirmations per agent: without this, two overlapping confirmations deadlock
          // (each waits on the other's exclusion check while trying to decline the other's row).
          await lockUser(tx, agentId);
          const { count } = await tx.viewing.updateMany({
            where: { id, status: from },
            data: { ...data, status: "CONFIRMED" },
          });
          if (count !== 1) return "stale" as const;
          const v = await tx.viewing.findUniqueOrThrow({ where: { id } });
          await tx.viewing.updateMany({
            where: {
              id: { not: id },
              agentId: v.agentId,
              status: "REQUESTED",
              startsAt: { lt: v.endsAt },
              endsAt: { gt: v.startsAt },
            },
            data: {
              status: "DECLINED",
              cancellationReason: "Another viewing was confirmed for this time.",
              cancelledBy: "SYSTEM",
            },
          });
          return "ok" as const;
        },
        { maxWait: 15000, timeout: 30000 }
      );
      if (result === "stale") return { status: "stale" };
      return { status: "ok", viewing: (await this.findViewing(id))! };
    } catch (err) {
      if (isOverlapViolation(err)) return { status: "overlap" };
      throw err;
    }
  }

  async advanceLeadToContacted(buyerId: string, propertyId: string): Promise<void> {
    await prisma.lead.updateMany({
      where: { buyerId, propertyId, status: "NEW" },
      data: { status: "CONTACTED" },
    });
  }

  async listForBuyer(buyerId: string, statuses: ViewingStatus[], order: "asc" | "desc", cursor: Cursor | null, limit: number) {
    return this.list({ buyerId, status: { in: statuses } }, order, cursor, limit);
  }

  async listForAgent(
    agentId: string,
    statuses: ViewingStatus[],
    order: "asc" | "desc",
    cursor: Cursor | null,
    limit: number,
    range?: { from: Date; to: Date }
  ) {
    return this.list(
      {
        agentId,
        status: { in: statuses },
        ...(range && { startsAt: { gte: range.from, lt: range.to } }),
      },
      order,
      cursor,
      limit
    );
  }

  private async list(where: Prisma.ViewingWhereInput, order: "asc" | "desc", cursor: Cursor | null, limit: number) {
    const cmp = order === "asc" ? "gt" : "lt";
    const rows = await prisma.viewing.findMany({
      where: {
        ...where,
        ...(cursor && {
          OR: [
            { startsAt: { [cmp]: cursor.startsAt } },
            { startsAt: cursor.startsAt, id: { [cmp]: cursor.id } },
          ],
        }),
      },
      orderBy: [{ startsAt: order }, { id: order }],
      take: limit + 1,
      include: viewingInclude,
    });
    return { rows: rows.slice(0, limit), hasMore: rows.length > limit };
  }

  /** V10: open requests whose time has passed with no response. */
  async expireStale(now: Date): Promise<number> {
    const { count } = await prisma.viewing.updateMany({
      where: { status: { in: OPEN_STATUSES }, startsAt: { lte: now } },
      data: { status: "EXPIRED", cancelledBy: "SYSTEM" },
    });
    return count;
  }

  /** V11: the listing left PUBLISHED/RESERVED — cancel every non-terminal viewing on it. */
  async cancelForProperty(propertyId: string, reason: string): Promise<number> {
    const { count } = await prisma.viewing.updateMany({
      where: { propertyId, status: { in: NON_TERMINAL_STATUSES } },
      data: { status: "CANCELLED", cancellationReason: reason, cancelledBy: "SYSTEM" },
    });
    return count;
  }
}

export type Cursor = { startsAt: Date; id: string };
export type { ViewingStatus };
export type CancelActor = ActorType;

export const pipelineRepository = new PipelineRepository();
