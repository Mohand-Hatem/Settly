import { z } from "../../../shared/openapi/zod.js";

// ==============================================================================
// Multi-property compare (GET /api/v1/catalog/compare)
// ==============================================================================

export const CompareQuerySchema = z
  .object({
    ids: z
      .string()
      .min(1, "At least two property IDs must be provided")
      .openapi({
        description: "Comma-separated list of 2 to 4 property UUIDs or slugs to compare",
        example: "0191eb45-8f67-73d8-9db8-bc234a9e51c8,0191eb45-9a12-74c1-8eb1-ca124b8d72e9",
      }),
  })
  .openapi("CompareQuery");

export const CompareAmenitySchema = z.object({
  id: z.string(),
  slug: z.string(),
  nameEn: z.string(),
  nameAr: z.string(),
  category: z.string(),
});

export const CompareItemSchema = z
  .object({
    id: z.string(),
    slug: z.string(),
    titleEn: z.string().nullable(),
    titleAr: z.string().nullable(),
    propertyType: z.string(),
    listingIntent: z.string(),
    price: z.string(),
    rentalPeriod: z.string().nullable(),
    bedrooms: z.number(),
    bathrooms: z.number(),
    areaSqm: z.number(),
    pricePerSqm: z.number(),
    latitude: z.number(),
    longitude: z.number(),
    coverImage: z.string().nullable(),
    images: z.array(z.string()),
    area: z.object({
      id: z.string(),
      slug: z.string(),
      nameEn: z.string(),
      nameAr: z.string(),
    }),
    amenities: z.array(CompareAmenitySchema),
  })
  .openapi("CompareItem");

export const CompareResponseSchema = z
  .object({
    items: z.array(CompareItemSchema).openapi({
      description: "Array of compared residences with aligned specifications",
    }),
    count: z.number().openapi({ description: "Number of properties compared (2 to 4)" }),
  })
  .openapi("CompareResponse");

export type CompareItem = z.infer<typeof CompareItemSchema>;
export type CompareResponse = z.infer<typeof CompareResponseSchema>;
