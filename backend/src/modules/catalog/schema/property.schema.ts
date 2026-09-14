import { z } from "../../../shared/openapi/zod.js";
import { AreaItemSchema } from "./area.schema.js";
import { AmenityItemSchema } from "./amenity.schema.js";

// ==============================================================================
// Enums
// ==============================================================================

export const PropertyTypeEnum = z
  .enum(["APARTMENT", "VILLA", "DUPLEX", "PENTHOUSE", "TOWNHOUSE", "CHALET"])
  .openapi("PropertyType");

export const ListingIntentEnum = z
  .enum(["SALE", "RENT"])
  .openapi("ListingIntent");

export const PropertyStatusEnum = z
  .enum([
    "DRAFT",
    "PENDING_REVIEW",
    "PUBLISHED",
    "RESERVED",
    "SOLD",
    "RENTED",
    "ARCHIVED",
    "SUSPENDED",
  ])
  .openapi("PropertyStatus");

export const RentalPeriodEnum = z
  .enum(["MONTHLY", "YEARLY"])
  .openapi("RentalPeriod");

// ==============================================================================
// Property Image Schema
// ==============================================================================

export const PropertyImageSchema = z
  .object({
    id: z.string().uuid().openapi({ example: "0191eb45-8f67-73d8-9db8-bc234a9e51c8" }),
    propertyId: z.string().uuid().openapi({ example: "0191eb45-8f67-73d8-9db8-bc234a9e51c9" }),
    cloudinaryPublicId: z.string().openapi({ example: "settly/properties/villa-1" }),
    url: z.string().url().openapi({ example: "https://res.cloudinary.com/dmzcnnxzp/image/upload/v1/settly/properties/villa-1.jpg" }),
    captionEn: z.string().nullable().optional(),
    captionAr: z.string().nullable().optional(),
    isCover: z.boolean().default(false),
    order: z.number().int().default(0),
    createdAt: z.string().datetime(),
  })
  .openapi("PropertyImage");

// ==============================================================================
// Agent Summary Schema
// ==============================================================================

export const PropertyAgentSummarySchema = z
  .object({
    id: z.string().uuid(),
    name: z.string(),
    email: z.string().email(),
    image: z.string().nullable(),
    licenseNumber: z.string().optional(),
    brokerageName: z.string().optional(),
    isVerified: z.boolean().default(false),
  })
  .openapi("PropertyAgentSummary");

// ==============================================================================
// Property Price History Schema
// ==============================================================================

export const PropertyPriceHistorySchema = z
  .object({
    id: z.string().uuid(),
    propertyId: z.string().uuid(),
    price: z.string().openapi({ description: "Price in EGP piastres as a numeric string", example: "1500000000" }),
    changedAt: z.string().datetime(),
    changedById: z.string().nullable(),
  })
  .openapi("PropertyPriceHistory");

// ==============================================================================
// Property Response Schema
// ==============================================================================

export const PropertyResponseSchema = z
  .object({
    id: z.string().uuid().openapi({ example: "0191eb45-8f67-73d8-9db8-bc234a9e51c8" }),
    agentId: z.string().openapi({ example: "0191eb45-8f67-73d8-9db8-bc234a9e51c0" }),
    areaId: z.string().uuid().openapi({ example: "0191eb45-8f67-73d8-9db8-bc234a9e51c1" }),
    slug: z.string().openapi({ example: "signature-lake-view-villa-0191eb45" }),
    titleEn: z.string().nullable(),
    titleAr: z.string().nullable(),
    descriptionEn: z.string().nullable(),
    descriptionAr: z.string().nullable(),
    propertyType: PropertyTypeEnum,
    listingIntent: ListingIntentEnum,
    price: z.string().openapi({ description: "Price in EGP piastres (stringified BigInt)", example: "1500000000" }),
    rentalPeriod: RentalPeriodEnum.nullable(),
    bedrooms: z.number().int(),
    bathrooms: z.number().int(),
    areaSqm: z.number(),
    status: PropertyStatusEnum,
    featured: z.boolean(),
    latitude: z.number(),
    longitude: z.number(),
    publishedAt: z.string().datetime().nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    images: z.array(PropertyImageSchema).default([]),
    amenities: z.array(AmenityItemSchema).default([]),
    area: AreaItemSchema.optional(),
    agent: PropertyAgentSummarySchema.optional(),
    priceHistories: z.array(PropertyPriceHistorySchema).optional(),
  })
  .openapi("PropertyResponse");

export const PropertyListResponseSchema = z
  .object({
    items: z.array(PropertyResponseSchema),
    nextCursor: z.string().nullable().optional(),
    totalCount: z.number().int().optional(),
  })
  .openapi("PropertyListResponse");

// ==============================================================================
// Input Schemas
// ==============================================================================

export const CreatePropertySchema = z
  .object({
    titleEn: z.string().min(3).max(200).optional(),
    titleAr: z.string().min(3).max(200).optional(),
    descriptionEn: z.string().min(10).optional(),
    descriptionAr: z.string().min(10).optional(),
    propertyType: PropertyTypeEnum,
    listingIntent: ListingIntentEnum,
    price: z.union([z.string(), z.number()]).transform((val) => String(val)),
    rentalPeriod: RentalPeriodEnum.optional(),
    bedrooms: z.number().int().min(0).max(50),
    bathrooms: z.number().int().min(0).max(50),
    areaSqm: z.number().positive().max(100000),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    areaId: z.string().uuid(),
    amenityIds: z.array(z.string().uuid()).optional(),
  })
  .refine((data) => data.titleEn || data.titleAr, {
    message: "At least one title (English or Arabic) is required",
    path: ["titleEn"],
  })
  .refine((data) => data.descriptionEn || data.descriptionAr, {
    message: "At least one description (English or Arabic) is required",
    path: ["descriptionEn"],
  })
  .openapi("CreateProperty");

export const UpdatePropertySchema = z
  .object({
    titleEn: z.string().min(3).max(200).optional(),
    titleAr: z.string().min(3).max(200).optional(),
    descriptionEn: z.string().min(10).optional(),
    descriptionAr: z.string().min(10).optional(),
    propertyType: PropertyTypeEnum.optional(),
    listingIntent: ListingIntentEnum.optional(),
    price: z.union([z.string(), z.number()]).transform((val) => String(val)).optional(),
    rentalPeriod: RentalPeriodEnum.nullable().optional(),
    bedrooms: z.number().int().min(0).max(50).optional(),
    bathrooms: z.number().int().min(0).max(50).optional(),
    areaSqm: z.number().positive().max(100000).optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    areaId: z.string().uuid().optional(),
    amenityIds: z.array(z.string().uuid()).optional(),
  })
  .openapi("UpdateProperty");

export const ActionReasonSchema = z
  .object({
    reason: z.string().min(3).max(1000).openapi({ example: "Photos do not meet quality guidelines" }),
  })
  .openapi("ActionReason");

// Types
export type PropertyType = z.infer<typeof PropertyTypeEnum>;
export type ListingIntent = z.infer<typeof ListingIntentEnum>;
export type PropertyStatus = z.infer<typeof PropertyStatusEnum>;
export type RentalPeriod = z.infer<typeof RentalPeriodEnum>;
export type PropertyImage = z.infer<typeof PropertyImageSchema>;
export type PropertyResponse = z.infer<typeof PropertyResponseSchema>;
export type PropertyListResponse = z.infer<typeof PropertyListResponseSchema>;
export type CreatePropertyInput = z.infer<typeof CreatePropertySchema>;
export type UpdatePropertyInput = z.infer<typeof UpdatePropertySchema>;
export type ActionReasonInput = z.infer<typeof ActionReasonSchema>;
