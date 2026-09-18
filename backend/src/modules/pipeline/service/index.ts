import { getPropertyById } from "../../catalog/service/property.service.js";
import {
  pipelineRepository,
  type Cursor,
  type ViewingRecord,
  type AvailabilityRow,
  type ViewingStatus,
} from "../repository/index.js";
import type { ViewingResponse } from "../schema/index.js";
import {
  ProblemError,
  notFoundError,
  forbiddenError,
  conflictError,
} from "../../../shared/errors/problem-details.js";
import { subscribe } from "../../../shared/events/bus.js";
import { addDays, cairoDate, cairoToUtc, minutesOf, timeOf, weekdayOf } from "./cairo-time.js";

/** Business constants for viewings (BUSINESS_RULES §1, §3; #106). */
export const VIEWING_MINUTES = 60;
export const BOOKING_HORIZON_DAYS = 30;
export const MAX_OPEN_REQUESTS = 3; // I9
export const NO_SHOW_GRACE_MINUTES = 30;
const MINUTE = 60_000;

type Actor = { id: string; emailVerified: boolean };

// ------------------------------------------------------------------ helpers
function validationProblem(path: string, code: string, detail?: string): ProblemError {
  return new ProblemError({
    type: "/errors/validation-failed",
    title: "Validation Failed",
    status: 422,
    detail: detail ?? "One or more request parameters failed validation schema checks.",
    errors: [{ path, code }],
  });
}

function stateConflict(viewing: ViewingRecord | null): ProblemError {
  return conflictError(
    "/errors/state-conflict",
    "State Conflict",
    "This viewing has changed. Refresh and try again.",
    viewing ? { currentStatus: viewing.status } : undefined
  );
}

function toResponse(v: ViewingRecord, view: "buyer" | "agent"): ViewingResponse {
  return {
    id: v.id,
    status: v.status,
    startsAt: v.startsAt.toISOString(),
    endsAt: v.endsAt.toISOString(),
    note: v.notes,
    cancellationReason: v.cancellationReason,
    cancelledBy: v.cancelledBy,
    property: {
      id: v.property.id,
      slug: v.property.slug,
      title: v.property.titleEn,
      imageUrl: v.property.images[0]?.url ?? null,
    },
    agent: { id: v.agent.id, name: v.agent.name },
    buyer: view === "agent" ? { id: v.buyer.id, name: v.buyer.name } : null,
    createdAt: v.createdAt.toISOString(),
    updatedAt: v.updatedAt.toISOString(),
  };
}

function encodeCursor(v: ViewingRecord): string {
  return Buffer.from(JSON.stringify({ v: 1, s: v.startsAt.toISOString(), i: v.id })).toString("base64url");
}

function decodeCursor(raw: string | undefined): Cursor | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
    if (parsed.v !== 1 || typeof parsed.i !== "string") throw new Error("bad cursor");
    return { startsAt: new Date(parsed.s), id: parsed.i };
  } catch {
    throw new ProblemError({
      type: "/errors/invalid-cursor",
      title: "Invalid Cursor",
      status: 400,
      detail: "The pagination cursor is malformed.",
    });
  }
}

const SCOPES: Record<"pending" | "upcoming" | "past", { statuses: ViewingStatus[]; order: "asc" | "desc" }> = {
  pending: { statuses: ["REQUESTED", "RESCHEDULE_PROPOSED"], order: "asc" },
  upcoming: { statuses: ["CONFIRMED"], order: "asc" },
  past: { statuses: ["COMPLETED", "NO_SHOW", "DECLINED", "CANCELLED", "EXPIRED"], order: "desc" },
};

/** Public listing that can take viewings: exists and is PUBLISHED (V1). Otherwise 404. */
async function getBookableListing(propertyId: string) {
  const property = await getPropertyById(propertyId).catch(() => null);
  if (!property || (property.status !== "PUBLISHED" && property.status !== "RESERVED")) {
    throw notFoundError("Property", propertyId);
  }
  return property;
}

// ------------------------------------------------------------------ availability
type Window = { dayOfWeek: number; startTime: string; endTime: string };

function toAvailability(rows: AvailabilityRow[]) {
  return {
    timezone: "Africa/Cairo" as const,
    windows: rows
      .filter((r) => !r.isBlackout)
      .map((r) => ({ dayOfWeek: r.dayOfWeek, startTime: r.startTime, endTime: r.endTime })),
    blackouts: rows
      .filter((r) => r.isBlackout && r.specificDate)
      .map((r) => r.specificDate!.toISOString().slice(0, 10))
      .sort(),
  };
}

async function getAvailability(agentId: string) {
  return toAvailability(await pipelineRepository.listAvailability(agentId));
}

async function setAvailability(agentId: string, input: { windows: Window[]; blackouts: string[] }) {
  input.windows.forEach((w, i) => {
    if (minutesOf(w.endTime) - minutesOf(w.startTime) < VIEWING_MINUTES) {
      throw validationProblem(`windows.${i}`, "window_too_short", "Each window must be at least 60 minutes long.");
    }
  });
  const byDay = new Map<number, Window[]>();
  input.windows.forEach((w) => byDay.set(w.dayOfWeek, [...(byDay.get(w.dayOfWeek) ?? []), w]));
  for (const [day, windows] of byDay) {
    const sorted = [...windows].sort((a, b) => minutesOf(a.startTime) - minutesOf(b.startTime));
    for (let i = 1; i < sorted.length; i++) {
      if (minutesOf(sorted[i]!.startTime) < minutesOf(sorted[i - 1]!.endTime)) {
        throw validationProblem(`windows`, "overlapping_windows", `Windows overlap on day ${day}.`);
      }
    }
  }
  const blackouts = [...new Set(input.blackouts)].map((date) => ({
    date: new Date(`${date}T00:00:00.000Z`),
    dayOfWeek: weekdayOf(date),
  }));
  await pipelineRepository.replaceAvailability(agentId, input.windows, blackouts);
  return getAvailability(agentId);
}

/**
 * 60-minute slots (#106) inside the agent's weekly windows, in Cairo wall-clock, from now up to 30
 * days ahead. Slots overlapping the agent's CONFIRMED viewings are removed; REQUESTED ones are not,
 * because exclusivity attaches at confirmation (BUSINESS_RULES §3.1).
 */
async function computeSlots(agentId: string, fromDate: string, toDate: string, now: Date) {
  const rows = await pipelineRepository.listAvailability(agentId);
  const windows = rows.filter((r) => !r.isBlackout);
  const blackouts = new Set(
    rows.filter((r) => r.isBlackout && r.specificDate).map((r) => r.specificDate!.toISOString().slice(0, 10))
  );
  const horizon = new Date(now.getTime() + BOOKING_HORIZON_DAYS * 24 * 60 * MINUTE);

  const candidates: { startsAt: Date; endsAt: Date }[] = [];
  for (let date = fromDate; date <= toDate; date = addDays(date, 1)) {
    if (blackouts.has(date)) continue;
    const dow = weekdayOf(date);
    for (const w of windows.filter((x) => x.dayOfWeek === dow)) {
      for (let m = minutesOf(w.startTime); m + VIEWING_MINUTES <= minutesOf(w.endTime); m += VIEWING_MINUTES) {
        const startsAt = cairoToUtc(date, timeOf(m));
        if (!startsAt || startsAt <= now || startsAt > horizon) continue;
        candidates.push({ startsAt, endsAt: new Date(startsAt.getTime() + VIEWING_MINUTES * MINUTE) });
      }
    }
  }
  if (candidates.length === 0) return [];

  const confirmed = await pipelineRepository.listConfirmedIntervals(
    agentId,
    candidates[0]!.startsAt,
    candidates[candidates.length - 1]!.endsAt
  );
  return candidates
    .filter((c) => !confirmed.some((v) => v.startsAt < c.endsAt && v.endsAt > c.startsAt))
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
}

async function getSlotsForProperty(propertyId: string, query: { from?: string; to?: string }, now = new Date()) {
  const property = await getBookableListing(propertyId);
  const today = cairoDate(now);
  const lastDay = addDays(today, BOOKING_HORIZON_DAYS);
  const from = query.from && query.from > today ? query.from : today;
  const to = query.to && query.to < lastDay ? query.to : lastDay;
  const slots = property.status === "PUBLISHED" && from <= to
    ? await computeSlots(property.agentId, from, to, now)
    : [];
  return {
    timezone: "Africa/Cairo" as const,
    durationMinutes: VIEWING_MINUTES as 60,
    slots: slots.map((s) => ({ startsAt: s.startsAt.toISOString(), endsAt: s.endsAt.toISOString() })),
  };
}

async function assertIsSlot(agentId: string, startsAt: Date, now: Date, path: string) {
  const date = cairoDate(startsAt);
  const slots = await computeSlots(agentId, date, date, now);
  if (!slots.some((s) => s.startsAt.getTime() === startsAt.getTime())) {
    throw conflictError(
      "/errors/slot-unavailable",
      "Slot Unavailable",
      "This time is not available. Choose another slot.",
      { field: path }
    );
  }
}

// ------------------------------------------------------------------ V1: request
async function requestViewing(actor: Actor, input: { propertyId: string; startsAt: string; note?: string }) {
  const now = new Date();
  const property = await getBookableListing(input.propertyId);
  if (property.status !== "PUBLISHED") {
    throw conflictError("/errors/listing-unavailable", "Listing Unavailable", "This listing is not taking viewings.");
  }
  if (property.agentId === actor.id) {
    // Self-dealing ban (#59): an agent may not request a viewing on their own listing.
    throw forbiddenError("You cannot request a viewing on your own listing.");
  }
  const startsAt = new Date(input.startsAt);
  await assertIsSlot(property.agentId, startsAt, now, "startsAt");

  const result = await pipelineRepository.createRequest({
    buyerId: actor.id,
    agentId: property.agentId,
    propertyId: property.id,
    startsAt,
    endsAt: new Date(startsAt.getTime() + VIEWING_MINUTES * MINUTE),
    notes: input.note?.length ? input.note : null,
    maxOpen: MAX_OPEN_REQUESTS,
  });
  if (result.status === "limit_reached") {
    throw conflictError(
      "/errors/open-viewing-limit",
      "Open Viewing Limit Reached",
      `You can have at most ${MAX_OPEN_REQUESTS} open viewing requests.`,
      { limit: MAX_OPEN_REQUESTS }
    );
  }
  return toResponse(result.viewing, "buyer");
}

// ------------------------------------------------------------------ transitions
async function loadForParty(viewingId: string, actorId: string, party: "buyer" | "agent") {
  const v = await pipelineRepository.findViewing(viewingId);
  const isParty = v && (party === "buyer" ? v.buyerId === actorId : v.agentId === actorId);
  // 404 leak rule (API.md §6): a viewing you are not party to "does not exist".
  if (!v || !isParty) throw notFoundError("Viewing", viewingId);
  return v;
}

async function guardedTransition(
  v: ViewingRecord,
  from: ViewingStatus[],
  data: Parameters<typeof pipelineRepository.transition>[2]
) {
  if (!from.includes(v.status)) throw stateConflict(v);
  const updated = await pipelineRepository.transition(v.id, from, data);
  if (!updated) throw stateConflict(await pipelineRepository.findViewing(v.id));
  return updated;
}

/** V2 (agent) and V5 (buyer accepts the proposed time). */
async function confirmOrAccept(v: ViewingRecord, from: ViewingStatus) {
  if (v.status !== from) throw stateConflict(v);
  const result = await pipelineRepository.confirm(v.id, v.agentId, from);
  if (result.status === "stale") throw stateConflict(await pipelineRepository.findViewing(v.id));
  if (result.status === "overlap") {
    throw conflictError(
      "/errors/viewing-overlap",
      "Viewing Overlap",
      "The agent already has a confirmed viewing at this time."
    );
  }
  return result.viewing;
}

const agentActions = {
  async confirm(agentId: string, id: string) {
    return toResponse(await confirmOrAccept(await loadForParty(id, agentId, "agent"), "REQUESTED"), "agent");
  },
  async decline(agentId: string, id: string, reason?: string) {
    const v = await loadForParty(id, agentId, "agent");
    return toResponse(
      await guardedTransition(v, ["REQUESTED"], { status: "DECLINED", cancellationReason: reason ?? null, cancelledBy: "AGENT" }),
      "agent"
    );
  },
  async proposeReschedule(agentId: string, id: string, startsAtIso: string) {
    const v = await loadForParty(id, agentId, "agent");
    const startsAt = new Date(startsAtIso);
    await assertIsSlot(agentId, startsAt, new Date(), "startsAt");
    return toResponse(
      await guardedTransition(v, ["REQUESTED"], {
        status: "RESCHEDULE_PROPOSED",
        startsAt,
        endsAt: new Date(startsAt.getTime() + VIEWING_MINUTES * MINUTE),
      }),
      "agent"
    );
  },
  async cancel(agentId: string, id: string, reason: string) {
    const v = await loadForParty(id, agentId, "agent");
    return toResponse(
      await guardedTransition(v, ["CONFIRMED"], { status: "CANCELLED", cancellationReason: reason, cancelledBy: "AGENT" }),
      "agent"
    );
  },
  async complete(agentId: string, id: string) {
    const v = await loadForParty(id, agentId, "agent");
    if (Date.now() < v.startsAt.getTime()) {
      throw conflictError("/errors/too-early", "Too Early", "A viewing can be completed only after it starts.");
    }
    const updated = await guardedTransition(v, ["CONFIRMED"], { status: "COMPLETED" });
    await pipelineRepository.advanceLeadToContacted(v.buyerId, v.propertyId);
    return toResponse(updated, "agent");
  },
  async noShow(agentId: string, id: string) {
    const v = await loadForParty(id, agentId, "agent");
    if (Date.now() < v.startsAt.getTime() + NO_SHOW_GRACE_MINUTES * MINUTE) {
      throw conflictError(
        "/errors/too-early",
        "Too Early",
        `A no-show can be recorded only ${NO_SHOW_GRACE_MINUTES} minutes after the start time.`
      );
    }
    return toResponse(await guardedTransition(v, ["CONFIRMED"], { status: "NO_SHOW" }), "agent");
  },
};

const buyerActions = {
  async acceptReschedule(buyerId: string, id: string) {
    return toResponse(await confirmOrAccept(await loadForParty(id, buyerId, "buyer"), "RESCHEDULE_PROPOSED"), "buyer");
  },
  async declineReschedule(buyerId: string, id: string) {
    const v = await loadForParty(id, buyerId, "buyer");
    return toResponse(
      await guardedTransition(v, ["RESCHEDULE_PROPOSED"], { status: "CANCELLED", cancelledBy: "USER" }),
      "buyer"
    );
  },
  /**
   * V6a (withdraw a pending request) and V7 (cancel a confirmed viewing). Exit is never blocked and
   * never needs email verification (§9.1, #38, #62). V7 requires a reason.
   */
  async cancel(buyerId: string, id: string, reason?: string) {
    const v = await loadForParty(id, buyerId, "buyer");
    if (v.status === "CONFIRMED" && !reason) {
      throw validationProblem("reason", "required", "A reason is required to cancel a confirmed viewing.");
    }
    return toResponse(
      await guardedTransition(v, ["REQUESTED", "CONFIRMED"], {
        status: "CANCELLED",
        cancellationReason: reason ?? null,
        cancelledBy: "USER",
      }),
      "buyer"
    );
  },
};

/** One cancel endpoint for both parties: the listing agent follows V7, the buyer V6a/V7. */
async function cancel(actorId: string, id: string, reason?: string) {
  const v = await pipelineRepository.findViewing(id);
  if (!v || (v.buyerId !== actorId && v.agentId !== actorId)) throw notFoundError("Viewing", id);
  if (v.agentId === actorId) {
    if (!reason) throw validationProblem("reason", "required", "A reason is required to cancel a viewing.");
    return agentActions.cancel(actorId, id, reason);
  }
  return buyerActions.cancel(actorId, id, reason);
}

// ------------------------------------------------------------------ lists
async function listMine(
  actorId: string,
  view: "buyer" | "agent",
  query: { scope: keyof typeof SCOPES; cursor?: string; limit: number; from?: string; to?: string }
) {
  const { statuses, order } = SCOPES[query.scope];
  const cursor = decodeCursor(query.cursor);
  const { rows, hasMore } =
    view === "buyer"
      ? await pipelineRepository.listForBuyer(actorId, statuses, order, cursor, query.limit)
      : await pipelineRepository.listForAgent(
          actorId,
          statuses,
          order,
          cursor,
          query.limit,
          query.from && query.to ? { from: new Date(query.from), to: new Date(query.to) } : undefined
        );
  return {
    items: rows.map((r) => toResponse(r, view)),
    pageInfo: { nextCursor: hasMore ? encodeCursor(rows[rows.length - 1]!) : null, hasNextPage: hasMore },
  };
}

async function getOne(actorId: string, id: string) {
  const v = await pipelineRepository.findViewing(id);
  if (!v || (v.buyerId !== actorId && v.agentId !== actorId)) throw notFoundError("Viewing", id);
  return toResponse(v, v.agentId === actorId ? "agent" : "buyer");
}

// ------------------------------------------------------------------ system (V10, V11)
async function expireStaleRequests(now = new Date()) {
  return pipelineRepository.expireStale(now);
}

subscribe("property.statusChanged", async ({ propertyId, to }) => {
  if (to !== "PUBLISHED" && to !== "RESERVED") {
    await pipelineRepository.cancelForProperty(propertyId, "The listing is no longer available.");
  }
});

export const viewingService = {
  getAvailability,
  setAvailability,
  getSlotsForProperty,
  requestViewing,
  agentActions,
  buyerActions,
  cancel,
  listMine,
  getOne,
  expireStaleRequests,
};

// Kept for the module index contract.
export const pipelineService = viewingService;
