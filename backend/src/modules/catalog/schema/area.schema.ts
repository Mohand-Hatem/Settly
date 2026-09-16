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
export const AreaInsightsResponseSchema = z
  .object({
    area: AreaItemSchema,
    metrics: z.object({
      activePropertiesCount: z.number().openapi({ example: 12 }),
      compoundsCount: z.number().openapi({ example: 4 }),
      averagePricePerSqm: z.number().openapi({ example: 68500 }),
      minPrice: z.string().openapi({ example: "12500000" }),
      maxPrice: z.string().openapi({ example: "45000000" }),
      averageYieldPercentage: z.number().openapi({ example: 8.4 }),
      capitalAppreciationYoY: z.number().openapi({ example: 28.5 }),
    }),
    propertyTypesDistribution: z.record(z.string(), z.number()).openapi({
      description: "Inventory count grouped by property type",
      example: { VILLA: 8, APARTMENT: 4 },
    }),
    historicalPriceTrend: z
      .array(
        z.object({
          period: z.string().openapi({ example: "Q1 2025" }),
          avgPricePerSqm: z.number().openapi({ example: 52000 }),
          changePercent: z.number().openapi({ example: 14.2 }),
        })
      )
      .openapi({ description: "Quarterly historical price per sqm telemetry" }),
  })
  .openapi("AreaInsightsResponse");

export type AreaItem = z.infer<typeof AreaItemSchema>;
export type AreaQuery = z.infer<typeof AreaQuerySchema>;
export type AreaListResponse = z.infer<typeof AreaListResponseSchema>;
export type AreaInsightsResponse = z.infer<typeof AreaInsightsResponseSchema>;
