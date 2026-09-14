import { z } from "../../../shared/openapi/zod.js";

export const UserRoleEnumSchema = z.enum(["USER", "AGENT", "ADMIN"]).openapi({
  description: "User role within Settly authorization matrix (AUTH.md §7)",
  example: "USER",
});

export const UserProfileResponseSchema = z
  .object({
    id: z.string().openapi({
      description: "Unique user identifier (canonical Better Auth user id)",
      example: "0191eb45-8f67-73d8-9db8-bc234a9e51c8",
    }),
    name: z.string().openapi({
      description: "Full user display name",
      example: "Tarek Mansour",
    }),
    email: z.string().email().openapi({
      description: "Primary registered user email address",
      example: "tarek.mansour@example.com",
    }),
    emailVerified: z.boolean().openapi({
      description: "Whether the email address has passed verification (Decision #38)",
      example: true,
    }),
    image: z.string().nullable().openapi({
      description: "Optional profile avatar URL",
      example: null,
    }),
    role: UserRoleEnumSchema,
    preferredLocale: z.enum(["en", "ar"]).nullable().openapi({
      description: "Preferred UI/notification locale (en or ar) per Decision #39",
      example: "en",
    }),
    createdAt: z.string().datetime().openapi({
      description: "Account creation ISO 8601 timestamp",
    }),
    updatedAt: z.string().datetime().openapi({
      description: "Account modification ISO 8601 timestamp",
    }),
  })
  .openapi("UserProfileResponse");

export const UpdateUserProfileSchema = z
  .object({
    name: z.string().min(2).max(100).optional().openapi({
      description: "Updated user display name",
      example: "Tarek H. Mansour",
    }),
    preferredLocale: z.enum(["en", "ar"]).optional().openapi({
      description: "Updated language preference",
      example: "ar",
    }),
  })
  .openapi("UpdateUserProfile");

export const AgentProfileResponseSchema = z
  .object({
    id: z.string().openapi({
      description: "Agent profile record identifier",
      example: "0191eb45-8f67-73d8-9db8-bc234a9e51c8",
    }),
    userId: z.string().openapi({
      description: "Foreign key reference to Better Auth User",
      example: "0191eb45-8f67-73d8-9db8-bc234a9e51c8",
    }),
    licenseNumber: z.string().openapi({
      description: "Official Egyptian real estate brokerage license number",
      example: "EGY-RE-2026-9042",
    }),
    brokerageName: z.string().nullable().openapi({
      description: "Optional brokerage or agency commercial name",
      example: "Sotheby's International Realty Cairo",
    }),
    bioEn: z.string().nullable().openapi({
      description: "English biographical overview and specialties",
      example: "Specialist in luxury residential properties across New Cairo and Golden Square.",
    }),
    bioAr: z.string().nullable().openapi({
      description: "Arabic biographical overview and specialties",
      example: "خبير في العقارات الفاخرة بالقاهرة الجديدة والمربع الذهبي.",
    }),
    isVerified: z.boolean().openapi({
      description: "Whether the agent's credentials have been verified by Settly compliance",
      example: true,
    }),
    verifiedAt: z.string().datetime().nullable().openapi({
      description: "Timestamp when verification was approved",
    }),
    createdAt: z.string().datetime().openapi({
      description: "Agent profile creation ISO 8601 timestamp",
    }),
    updatedAt: z.string().datetime().openapi({
      description: "Agent profile update ISO 8601 timestamp",
    }),
  })
  .openapi("AgentProfileResponse");

export const CreateOrUpdateAgentProfileSchema = z
  .object({
    licenseNumber: z.string().min(3).max(50).openapi({
      description: "Official real estate brokerage license ID",
      example: "EGY-RE-2026-9042",
    }),
    brokerageName: z.string().max(100).optional().nullable().openapi({
      description: "Commercial brokerage or agency name if affiliated",
      example: "Sotheby's International Realty Cairo",
    }),
    bioEn: z.string().max(1000).optional().nullable().openapi({
      description: "English biography",
    }),
    bioAr: z.string().max(1000).optional().nullable().openapi({
      description: "Arabic biography",
    }),
  })
  .openapi("CreateOrUpdateAgentProfile");

export type UserProfileResponse = z.infer<typeof UserProfileResponseSchema>;
export type UpdateUserProfile = z.infer<typeof UpdateUserProfileSchema>;
export type AgentProfileResponse = z.infer<typeof AgentProfileResponseSchema>;
export type CreateOrUpdateAgentProfile = z.infer<typeof CreateOrUpdateAgentProfileSchema>;
