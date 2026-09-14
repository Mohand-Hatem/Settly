import { z } from "../../../shared/openapi/zod.js";

export const AreaLevelValues = ["GOVERNORATE", "CITY", "DISTRICT", "COMPOUND"] as const;
export type AreaLevelType = (typeof AreaLevelValues)[number];

export const AreaLevelEnumSchema = z.enum(AreaLevelValues).openapi({
  description: "Geographic administrative level within the Egyptian real estate taxonomy",
  example: "DISTRICT",
});

export const AreaItemSchema = z
  .object({
    id: z.string().uuid().openapi({
      description: "Unique Area UUIDv7 identifier",
      example: "0191eb45-8f67-73d8-9db8-bc234a9e51c8",
    }),
    slug: z.string().openapi({
      description: "URL-friendly unique slug identifier",
      example: "new-cairo",
    }),
    nameEn: z.string().openapi({
      description: "Canonical English area name",
      example: "New Cairo",
    }),
    nameAr: z.string().openapi({
      description: "Canonical Arabic area name",
      example: "القاهرة الجديدة",
    }),
    aliases: z.array(z.string()).openapi({
      description: "Alternative aliases or colloquial names for search autocomplete matching",
      example: ["Fifth Settlement", "التجمع الخامس"],
    }),
    parentId: z.string().uuid().nullable().openapi({
      description: "Parent area UUIDv7 in the geographic hierarchy (e.g. Governorate for a City)",
      example: null,
    }),
    level: AreaLevelEnumSchema,
    boundaryGeoJson: z.string().nullable().openapi({
      description: "Optional GeoJSON boundary geometry string for map visualization",
      example: null,
    }),
    centerLat: z.number().nullable().openapi({
      description: "Geographic latitude coordinate of the area centroid",
      example: 30.0244,
    }),
    centerLng: z.number().nullable().openapi({
      description: "Geographic longitude coordinate of the area centroid",
      example: 31.4921,
    }),
    createdAt: z.string().datetime().openapi({
      description: "ISO 8601 creation timestamp",
    }),
    updatedAt: z.string().datetime().openapi({
      description: "ISO 8601 update timestamp",
    }),
  })
  .openapi("AreaItem");

export const AreaQuerySchema = z
  .object({
    level: AreaLevelEnumSchema.optional(),
    parentId: z.string().uuid().optional(),
  })
  .openapi("AreaQuery");

export const AreaListResponseSchema = z
  .object({
    items: z.array(AreaItemSchema).openapi({
      description: "Array of geographic areas matching query criteria",
    }),
  })
  .openapi("AreaListResponse");

export type AreaItem = z.infer<typeof AreaItemSchema>;
export type AreaQuery = z.infer<typeof AreaQuerySchema>;
export type AreaListResponse = z.infer<typeof AreaListResponseSchema>;
