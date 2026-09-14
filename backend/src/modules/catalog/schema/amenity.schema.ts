import { z } from "../../../shared/openapi/zod.js";

export const AmenityCategoryEnum = z.enum([
  "INTERIOR",
  "EXTERIOR",
  "FACILITY",
  "SECURITY",
  "LOCATION",
]);

export const AmenityItemSchema = z
  .object({
    id: z.string().uuid().openapi({ example: "0191eb45-8f67-73d8-9db8-bc234a9e51c8" }),
    slug: z.string().openapi({ example: "private-pool" }),
    nameEn: z.string().openapi({ example: "Private Pool" }),
    nameAr: z.string().openapi({ example: "حمام سباحة خاص" }),
    icon: z.string().nullable().openapi({ example: "pool" }),
    category: AmenityCategoryEnum.openapi({ example: "EXTERIOR" }),
    createdAt: z.string().datetime().openapi({ example: "2026-09-05T12:00:00Z" }),
  })
  .openapi("AmenityItem");

export const AmenityListResponseSchema = z
  .object({
    items: z.array(AmenityItemSchema),
  })
  .openapi("AmenityListResponse");

export const CreateAmenitySchema = z
  .object({
    slug: z.string().min(2).max(100),
    nameEn: z.string().min(2).max(100),
    nameAr: z.string().min(2).max(100),
    icon: z.string().optional(),
    category: AmenityCategoryEnum.default("INTERIOR"),
  })
  .openapi("CreateAmenity");

export type AmenityCategory = z.infer<typeof AmenityCategoryEnum>;
export type AmenityItem = z.infer<typeof AmenityItemSchema>;
export type CreateAmenityInput = z.infer<typeof CreateAmenitySchema>;
