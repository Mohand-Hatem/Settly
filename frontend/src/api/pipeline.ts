import { api } from "./client";
import { unwrap } from "./errors";
import type { components } from "./v1.d.ts";

export type Viewing = components["schemas"]["Viewing"];
export type ViewingList = components["schemas"]["ViewingList"];
export type ViewingStatus = components["schemas"]["ViewingStatus"];
export type ViewingSlots = components["schemas"]["ViewingSlots"];
export type Availability = components["schemas"]["Availability"];
export type UpdateAvailability = components["schemas"]["UpdateAvailability"];
export type ViewingScope = "pending" | "upcoming" | "past";

export async function fetchViewingSlots(propertyId: string, signal?: AbortSignal): Promise<ViewingSlots> {
  return unwrap(
    await api.GET("/api/v1/properties/{id}/viewing-slots", { params: { path: { id: propertyId } }, signal })
  );
}

export async function requestViewing(
  input: { propertyId: string; startsAt: string; note?: string },
  idempotencyKey: string
): Promise<Viewing> {
  return unwrap(
    await api.POST("/api/v1/viewings", {
      body: input,
      params: { header: { "Idempotency-Key": idempotencyKey } },
    })
  );
}

export async function fetchMyViewings(
  params: { scope: ViewingScope; cursor?: string; limit?: number },
  signal?: AbortSignal
): Promise<ViewingList> {
  return unwrap(
    await api.GET("/api/v1/me/viewings", { params: { query: { limit: 20, ...params } }, signal })
  );
}

export async function fetchAgentViewings(
  params: { scope: ViewingScope; cursor?: string; limit?: number; from?: string; to?: string },
  signal?: AbortSignal
): Promise<ViewingList> {
  return unwrap(
    await api.GET("/api/v1/me/agent/viewings", { params: { query: { limit: 20, ...params } }, signal })
  );
}

export async function fetchAvailability(signal?: AbortSignal): Promise<Availability> {
  return unwrap(await api.GET("/api/v1/me/availability", { signal }));
}

export async function saveAvailability(body: UpdateAvailability): Promise<Availability> {
  return unwrap(await api.PUT("/api/v1/me/availability", { body }));
}

type ActionPath =
  | "confirm"
  | "decline"
  | "propose-reschedule"
  | "accept-reschedule"
  | "decline-reschedule"
  | "cancel"
  | "complete"
  | "no-show";

/** One function per state-machine action (UX_PATTERNS §5: each transition is its own button). */
export async function viewingAction(
  id: string,
  action: ActionPath,
  body?: { reason?: string; startsAt?: string }
): Promise<Viewing> {
  const params = { path: { id } };
  switch (action) {
    case "confirm":
      return unwrap(await api.POST("/api/v1/viewings/{id}/confirm", { params }));
    case "decline":
      return unwrap(await api.POST("/api/v1/viewings/{id}/decline", { params, body: { reason: body?.reason } }));
    case "propose-reschedule":
      return unwrap(
        await api.POST("/api/v1/viewings/{id}/propose-reschedule", { params, body: { startsAt: body!.startsAt! } })
      );
    case "accept-reschedule":
      return unwrap(await api.POST("/api/v1/viewings/{id}/accept-reschedule", { params }));
    case "decline-reschedule":
      return unwrap(await api.POST("/api/v1/viewings/{id}/decline-reschedule", { params }));
    case "cancel":
      return unwrap(await api.POST("/api/v1/viewings/{id}/cancel", { params, body: { reason: body?.reason } }));
    case "complete":
      return unwrap(await api.POST("/api/v1/viewings/{id}/complete", { params }));
    case "no-show":
      return unwrap(await api.POST("/api/v1/viewings/{id}/no-show", { params }));
  }
}
