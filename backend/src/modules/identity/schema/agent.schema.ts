import { z } from "../../../shared/openapi/zod.js";
import { registry } from "../../../shared/openapi/registry.js";

/**
 * Agent Profile Schema Definitions (Decision #39, DOMAIN_MODEL.md §3)
 */
export const AgentRegistrationSchema = registry.register(
  "AgentRegistrationInput",
  z.object({
    licenseNumber: z.string().min(3).max(100).openapi({
      description: "Official Egyptian Real Estate Regulatory Authority license number",
      example: "EGY-RE-2026-9912",
    }),
    brokerageName: z.string().min(2).max(150).openapi({
      description: "Registered brokerage or agency name",
      example: "Sovereign Cairo Partners",
    }),
    bioEn: z.string().max(2000).optional().openapi({
      description: "English biography and specialties",
      example: "Specialist in New Cairo and Golden Square luxury villas.",
    }),
    bioAr: z.string().max(2000).optional().openapi({
      description: "Arabic biography and specialties",
      example: "متخصص في فلل القاهرة الجديدة والمربع الذهبي.",
    }),
  })
);

export type AgentRegistrationInput = z.infer<typeof AgentRegistrationSchema>;

export const AgentVerificationSchema = registry.register(
  "AgentVerificationInput",
  z.object({
    verified: z.boolean().openapi({
      description: "Verification decision: true to approve, false to revoke/reject",
      example: true,
    }),
    notes: z.string().max(500).optional().openapi({
      description: "Administrative rationale or review notes",
      example: "License verified against Egyptian Real Estate Authority registry.",
    }),
  })
);

export type AgentVerificationInput = z.infer<typeof AgentVerificationSchema>;

export const AgentListItemSchema = registry.register(
  "AgentListItem",
  z.object({
    id: z.string().uuid().openapi({ description: "Agent profile UUIDv7" }),
    userId: z.string().openapi({ description: "User ID FK" }),
    licenseNumber: z.string(),
    brokerageName: z.string(),
    bioEn: z.string().nullable().optional(),
    bioAr: z.string().nullable().optional(),
    isVerified: z.boolean(),
    verifiedAt: z.string().datetime().nullable().optional(),
    createdAt: z.string().datetime(),
    user: z.object({
      id: z.string(),
      name: z.string(),
      email: z.string().email(),
      image: z.string().url().nullable().optional(),
    }),
  })
);

export type AgentListItem = z.infer<typeof AgentListItemSchema>;

export const AgentListResponseSchema = registry.register(
  "AgentListResponse",
  z.object({
    items: z.array(AgentListItemSchema).openapi({ description: "Array of agent profiles" }),
  })
);

export type AgentListResponse = z.infer<typeof AgentListResponseSchema>;

/**
 * User Device Registration Schema (Decision #43, DOMAIN_MODEL.md §3)
 */
export const UserDeviceRegistrationSchema = registry.register(
  "UserDeviceRegistrationInput",
  z.object({
    token: z.string().min(10).max(500).openapi({
      description: "FCM (Firebase Cloud Messaging) device or browser push token",
      example: "fcm_token_sample_abc1234567890",
    }),
    platform: z.enum(["IOS", "ANDROID", "WEB"]).openapi({
      description: "Target platform for push notification dispatch",
      example: "WEB",
    }),
  })
);

export type UserDeviceRegistrationInput = z.infer<typeof UserDeviceRegistrationSchema>;

export const UserDeviceResponseSchema = registry.register(
  "UserDeviceResponse",
  z.object({
    id: z.string().uuid(),
    userId: z.string(),
    token: z.string(),
    platform: z.string(),
    createdAt: z.string().datetime(),
  })
);

export type UserDeviceResponse = z.infer<typeof UserDeviceResponseSchema>;
