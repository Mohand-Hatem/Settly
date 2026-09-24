import { queryOptions } from "@tanstack/react-query";
import { searchProperties, fetchSearchClusters, type SearchQueryParams } from "@/api/search";

export const searchKeys = {
  all: ["search"] as const,
  properties: (params: SearchQueryParams) => [...searchKeys.all, "properties", params] as const,
  clusters: (params: SearchQueryParams) => [...searchKeys.all, "clusters", params] as const,
};

export function searchPropertiesQuery(params: SearchQueryParams) {
  return queryOptions({
    queryKey: searchKeys.properties(params),
    queryFn: ({ signal }) => searchProperties(params, signal),
    staleTime: 60_000, // 1 minute
  });
}

export function searchClustersQuery(params: SearchQueryParams) {
  return queryOptions({
    queryKey: searchKeys.clusters(params),
    queryFn: ({ signal }) => fetchSearchClusters(params, signal),
    staleTime: 60_000,
  });
}
