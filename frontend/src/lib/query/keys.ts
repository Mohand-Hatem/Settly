/**
 * Query key factories. Every server-state query goes through these so cache reads,
 * writes (setQueryData) and invalidations agree on the exact key shape.
 */
export const catalogKeys = {
  all: ["catalog"] as const,
  propertyList: (params: { limit?: number } = {}) =>
    [...catalogKeys.all, "properties", params] as const,
  // Order matters: the compare matrix renders columns in id order
  compare: (ids: readonly string[]) => [...catalogKeys.all, "compare", [...ids]] as const,
  areas: () => [...catalogKeys.all, "areas"] as const,
  myProperties: (params: { limit?: number; cursor?: string } = {}) =>
    [...catalogKeys.all, "my-properties", params] as const,
};

export const analyticsKeys = {
  all: ["analytics"] as const,
  marketPulse: () => [...analyticsKeys.all, "market-pulse"] as const,
};
