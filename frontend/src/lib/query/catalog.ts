import { queryOptions } from "@tanstack/react-query";
import { fetchAreas, fetchCompare, fetchPropertyList } from "@/api/catalog";
import { fetchMarketPulse } from "@/api/analytics";
import { analyticsKeys, catalogKeys } from "./keys";

/**
 * Shared query definitions: the key and fetcher always travel together, so a
 * useQuery, a fetchQuery and a setQueryData for the same data cannot drift apart.
 */

export const propertyListQuery = (params: { limit?: number } = {}) =>
  queryOptions({
    queryKey: catalogKeys.propertyList(params),
    queryFn: ({ signal }) => fetchPropertyList(params, signal),
  });

export const compareQuery = (ids: readonly string[]) =>
  queryOptions({
    queryKey: catalogKeys.compare(ids),
    queryFn: ({ signal }) => fetchCompare(ids, signal),
  });

export const areasQuery = () =>
  queryOptions({
    queryKey: catalogKeys.areas(),
    queryFn: ({ signal }) => fetchAreas(signal),
    // Area taxonomy changes rarely
    staleTime: 10 * 60_000,
  });

export const marketPulseQuery = () =>
  queryOptions({
    queryKey: analyticsKeys.marketPulse(),
    queryFn: ({ signal }) => fetchMarketPulse(signal),
    staleTime: 10 * 60_000,
  });
