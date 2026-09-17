import { api } from "./client";
import { unwrap } from "./errors";
import type { components } from "./v1.d.ts";

export type PropertyResponse = components["schemas"]["PropertyResponse"];
export type PropertyListResponse = components["schemas"]["PropertyListResponse"];
export type CompareItem = components["schemas"]["CompareItem"];
export type CompareResponse = components["schemas"]["CompareResponse"];

export async function fetchPropertyList(
  params: { limit?: number } = {},
  signal?: AbortSignal
): Promise<PropertyListResponse> {
  return unwrap(await api.GET("/api/v1/properties", { params: { query: params }, signal }));
}

/** Items come back in database order, not request order; callers sort by the requested ids. */
export async function fetchCompare(ids: readonly string[], signal?: AbortSignal): Promise<CompareResponse> {
  return unwrap(
    await api.GET("/api/v1/catalog/compare", { params: { query: { ids: ids.join(",") } }, signal })
  );
}

export async function fetchAreas(signal?: AbortSignal) {
  return unwrap(await api.GET("/api/v1/areas", { signal }));
}
