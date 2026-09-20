import { api } from "./client";
import { unwrap } from "./errors";
import type { components } from "./v1.d.ts";

export type Offer = components["schemas"]["Offer"];
export type OfferList = components["schemas"]["OfferList"];
export type OfferRevision = components["schemas"]["OfferRevision"];
export type OfferStatus = components["schemas"]["OfferStatus"];
export type CreateOfferInput = components["schemas"]["CreateOffer"];
export type CounterOfferInput = components["schemas"]["CounterOffer"];
export type OfferScope = "live" | "terminal" | "all";

export async function createOffer(
  input: CreateOfferInput,
  idempotencyKey: string
): Promise<Offer> {
  return unwrap(
    await api.POST("/api/v1/offers", {
      body: input,
      params: { header: { "Idempotency-Key": idempotencyKey } },
    })
  );
}

export async function fetchOffer(id: string, signal?: AbortSignal): Promise<Offer> {
  return unwrap(
    await api.GET("/api/v1/offers/{id}", {
      params: { path: { id } },
      signal,
    })
  );
}

export async function counterOffer(
  id: string,
  input: CounterOfferInput
): Promise<Offer> {
  return unwrap(
    await api.POST("/api/v1/offers/{id}/counter", {
      params: { path: { id } },
      body: input,
    })
  );
}

export async function acceptOffer(id: string): Promise<Offer> {
  return unwrap(
    await api.POST("/api/v1/offers/{id}/accept", {
      params: { path: { id } },
    })
  );
}

export async function rejectOffer(id: string, reason?: string): Promise<Offer> {
  return unwrap(
    await api.POST("/api/v1/offers/{id}/reject", {
      params: { path: { id } },
      body: { reason },
    })
  );
}

export async function withdrawOffer(id: string, reason?: string): Promise<Offer> {
  return unwrap(
    await api.POST("/api/v1/offers/{id}/withdraw", {
      params: { path: { id } },
      body: { reason },
    })
  );
}

export async function fetchMyOffers(
  params: { scope?: OfferScope; cursor?: string; limit?: number },
  signal?: AbortSignal
): Promise<OfferList> {
  return unwrap(
    await api.GET("/api/v1/me/offers", {
      params: { query: { limit: 20, ...params } },
      signal,
    })
  );
}

export async function fetchAgentOffers(
  params: { scope?: OfferScope; propertyId?: string; cursor?: string; limit?: number },
  signal?: AbortSignal
): Promise<OfferList> {
  return unwrap(
    await api.GET("/api/v1/me/agent/offers", {
      params: { query: { limit: 20, ...params } },
      signal,
    })
  );
}

export async function fetchMyOfferForProperty(
  propertyId: string,
  signal?: AbortSignal
): Promise<Offer | null> {
  return unwrap(
    await api.GET("/api/v1/properties/{id}/my-offer", {
      params: { path: { id: propertyId } },
      signal,
    })
  );
}
