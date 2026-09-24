import type { z } from "zod";
import type {
  ListingIntentEnum,
  PropertyTypeEnum,
  PropertyStatusEnum,
} from "../../catalog/schema/property.schema.js";

export type ListingIntent = z.infer<typeof ListingIntentEnum>;
export type PropertyType = z.infer<typeof PropertyTypeEnum>;
export type PropertyStatus = z.infer<typeof PropertyStatusEnum>;

export interface SearchFilterChipDto {
  kind: "intent" | "type" | "area" | "bedrooms" | "minPrice" | "maxPrice" | "amenity";
  value: string;
  label: string;
}

export interface SearchPropertyImageDto {
  id: string;
  url: string;
  captionEn?: string | null;
  isCover: boolean;
  order: number;
}

export interface SearchPropertyItemDto {
  id: string;
  slug: string;
  titleEn: string;
  descriptionEn?: string | null;
  propertyType: PropertyType;
  listingIntent: ListingIntent;
  price: string;
  bedrooms: number;
  bathrooms: number;
  areaSqm: string;
  status: PropertyStatus;
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
  images: SearchPropertyImageDto[];
  amenities: string[];
}

export interface SearchPropertiesResponseDto {
  items: SearchPropertyItemDto[];
  total: number;
  chips: SearchFilterChipDto[];
  residualQuery?: string;
  degraded: boolean;
  hasMore: boolean;
  nextCursor?: string | null;
}

export interface SearchClusterDto {
  lat: number;
  lng: number;
  count: number;
}

export interface SearchClustersResponseDto {
  clusters: SearchClusterDto[];
  total: number;
}
