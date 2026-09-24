import { api } from "./client";
import { unwrap } from "./errors";

export interface SearchFilterChip {
  kind: "intent" | "type" | "area" | "bedrooms" | "minPrice" | "maxPrice" | "amenity";
  value: string;
  label: string;
}

export interface SearchPropertyItem {
  id: string;
  slug: string;
  titleEn: string;
  descriptionEn?: string | null;
  propertyType: "APARTMENT" | "VILLA" | "DUPLEX" | "PENTHOUSE" | "TOWNHOUSE" | "CHALET";
  listingIntent: "SALE" | "RENT";
  price: string;
  bedrooms: number;
  bathrooms: number;
  areaSqm: string;
  status: string;
  featured: boolean;
  latitude: number;
  longitude: number;
  publishedAt?: string | null;
  area: {
    id: string;
    slug: string;
    nameEn: string;
  };
  coverImage?: string;
  images: Array<{
    id: string;
    url: string;
    captionEn?: string | null;
    isCover: boolean;
    order: number;
  }>;
  amenities: string[];
}

export interface SearchPropertiesResponse {
  items: SearchPropertyItem[];
  total: number;
  chips: SearchFilterChip[];
  residualQuery?: string;
  degraded: boolean;
  hasMore: boolean;
  nextCursor?: string | null;
}

export interface SearchCluster {
  lat: number;
  lng: number;
  count: number;
}

export interface SearchClustersResponse {
  clusters: SearchCluster[];
  total: number;
}

export interface SearchQueryParams {
  q?: string;
  intent?: "SALE" | "RENT";
  propertyType?: "APARTMENT" | "VILLA" | "DUPLEX" | "PENTHOUSE" | "TOWNHOUSE" | "CHALET";
  minPrice?: number | null;
  maxPrice?: number | null;
  bedrooms?: number | null;
  areaId?: string;
  bounds?: string;
  cursor?: string;
  limit?: number;
}

export async function searchProperties(
  params: SearchQueryParams = {},
  signal?: AbortSignal
): Promise<SearchPropertiesResponse> {
  return unwrap(
    await api.GET("/api/v1/search/properties", {
      params: { query: params },
      signal,
    })
  ) as SearchPropertiesResponse;
}

export async function fetchSearchClusters(
  params: SearchQueryParams = {},
  signal?: AbortSignal
): Promise<SearchClustersResponse> {
  return unwrap(
    await api.GET("/api/v1/search/properties/clusters", {
      params: { query: params },
      signal,
    })
  ) as SearchClustersResponse;
}
