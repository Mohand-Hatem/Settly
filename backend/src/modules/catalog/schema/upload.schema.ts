import { z } from "../../../shared/openapi/zod.js";
import { PropertyImageSchema } from "./property.schema.js";

export const AuthorizeUploadSchema = z
  .object({
    kind: z.enum(["property_image", "document", "avatar"]).default("property_image"),
    propertyId: z.string().uuid().optional(),
    contentType: z
      .string()
      .regex(/^image\/(jpeg|png|webp|avif)$/, "Supported formats: JPEG, PNG, WebP, AVIF"),
    byteSize: z
      .number()
      .int()
      .positive()
      .max(15 * 1024 * 1024, "Image must not exceed 15MB"),
    filename: z.string().min(1).max(255),
  })
  .openapi("AuthorizeUpload");

export const AuthorizeUploadResponseSchema = z
  .object({
    assetId: z.string().uuid(),
    provider: z.literal("cloudinary"),
    uploadUrl: z.string().url(),
    params: z.record(z.unknown()),
    constraints: z.object({
      maxBytes: z.number().int(),
      allowedTypes: z.array(z.string()),
    }),
  })
  .openapi("AuthorizeUploadResponse");

export const CompleteUploadSchema = z
  .object({
    providerRef: z.string(),
    url: z.string().url(),
    cloudinaryPublicId: z.string(),
    captionEn: z.string().optional(),
    captionAr: z.string().optional(),
    isCover: z.boolean().optional(),
  })
  .openapi("CompleteUpload");

export const CompleteUploadResponseSchema = z
  .object({
    assetId: z.string().uuid(),
    status: z.enum(["READY", "PROCESSING", "FAILED"]),
    image: PropertyImageSchema.optional(),
  })
  .openapi("CompleteUploadResponse");

export const ReorderImagesSchema = z
  .object({
    imageIds: z.array(z.string().uuid()),
  })
  .openapi("ReorderImages");

export type AuthorizeUploadInput = z.infer<typeof AuthorizeUploadSchema>;
export type AuthorizeUploadResponse = z.infer<typeof AuthorizeUploadResponseSchema>;
export type CompleteUploadInput = z.infer<typeof CompleteUploadSchema>;
export type CompleteUploadResponse = z.infer<typeof CompleteUploadResponseSchema>;
export type ReorderImagesInput = z.infer<typeof ReorderImagesSchema>;
