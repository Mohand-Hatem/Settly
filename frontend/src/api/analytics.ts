import { api } from "./client";
import { unwrap } from "./errors";
import type { components } from "./v1.d.ts";

export type MarketPulseResponse = components["schemas"]["MarketPulseResponse"];

export async function fetchMarketPulse(signal?: AbortSignal): Promise<MarketPulseResponse> {
  return unwrap(await api.GET("/api/v1/analytics/market-pulse", { signal }));
}
