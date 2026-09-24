import { z } from "zod";
import {
  PropertyTypeEnum,
  ListingIntentEnum,
  PropertyStatusEnum,
} from "../../catalog/schema/property.schema.js";

export const SearchFilterChipSchema = z.object({
  kind: z.enum(["intent", "type", "area", "bedrooms", "minPrice", "maxPrice", "amenity"]),
  value: z.string(),
  label: z.string(),
});

export const SearchPropertyImageSchema = z.object({
  id: z.string().uuid(),
  url: z.string().url(),
  captionEn: z.string().nullable().optional(),
  isCover: z.boolean(),
  order: z.number().int(),
});

export const SearchPropertyItemSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  titleEn: z.string(),
  descriptionEn: z.string().nullable().optional(),
  propertyType: PropertyTypeEnum,
  listingIntent: ListingIntentEnum,
  price: z.string(),
  bedrooms: z.number().int(),
  bathrooms: z.number().int(),
  areaSqm: z.string(),
  status: PropertyStatusEnum,
  featured: z.boolean(),
  latitude: z.number(),
  longitude: z.number(),
  publishedAt: z.string().nullable().optional(),
  area: z.object({
    id: z.string().uuid(),
    slug: z.string(),
    nameEn: z.string(),
  }),
  coverImage: z.string().optional(),
  images: z.array(SearchPropertyImageSchema),
  amenities: z.array(z.string()),
});

export const SearchPropertiesQuerySchema = z.object({
  q: z.string().trim().max(250).optional(),
  intent: ListingIntentEnum.optional(),
  propertyType: PropertyTypeEnum.optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  bedrooms: z.coerce.number().int().min(0).optional(),
  areaId: z.string().uuid().optional(),
  amenities: z.union([z.string(), z.array(z.string())]).optional(),
  bounds: z
    .string()
    .regex(/^[-+]?\d+(?:\.\d+)?,[-+]?\d+(?:\.\d+)?,[-+]?\d+(?:\.\d+)?,[-+]?\d+(?:\.\d+)?$/)
    .optional(),
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const SearchPropertiesResponseSchema = z.object({
  items: z.array(SearchPropertyItemSchema),
  total: z.number().int(),
  chips: z.array(SearchFilterChipSchema),
  residualQuery: z.string().optional(),
  degraded: z.boolean(),
  hasMore: z.boolean(),
  nextCursor: z.string().uuid().nullable().optional(),
});

export const SearchClusterSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  count: z.number().int(),
});

export const SearchClustersResponseSchema = z.object({
  clusters: z.array(SearchClusterSchema),
  total: z.number().int(),
});
