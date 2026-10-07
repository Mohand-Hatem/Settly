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

/**
 * Agent KYC Application Schemas (Decisions #49, #55, #56, #57, #74)
 */
export const AgentProofTypeEnum = z.enum([
  "BROKER_LICENSE",
  "BROKERAGE_AUTHORIZATION",
  "COMMERCIAL_REGISTRATION",
  "OTHER",
]);
export type AgentProofType = z.infer<typeof AgentProofTypeEnum>;

export const AgentApplicationStatusEnum = z.enum(["PENDING", "APPROVED", "REJECTED"]);
export type AgentApplicationStatus = z.infer<typeof AgentApplicationStatusEnum>;

export const AgentApplicationSubmitSchema = registry.register(
  "AgentApplicationSubmitInput",
  z
    .object({
      nationalIdUrl: z.string().min(5).max(1000).openapi({
        description: "Private storage URL for Egyptian National ID document (#49)",
        example: "https://storage.settly.estate/kyc/national-id.pdf",
      }),
      selfieUrl: z.string().min(5).max(1000).openapi({
        description: "Private storage URL for live verification selfie (#49, #56)",
        example: "https://storage.settly.estate/kyc/selfie.jpg",
      }),
      proofType: AgentProofTypeEnum.openapi({
        description: "Type of professional verification proof (#55)",
        example: "BROKER_LICENSE",
      }),
      proofDocumentUrl: z.string().min(5).max(1000).openapi({
        description: "Private storage URL for professional proof document",
        example: "https://storage.settly.estate/kyc/broker-license.pdf",
      }),
      proofDescription: z.string().max(500).optional().openapi({
        description: "Mandatory description if proofType is OTHER (#55)",
        example: "Syndicate member registration card",
      }),
      licenseNumber: z.string().min(3).max(100).openapi({
        description: "Official Egyptian Real Estate Regulatory Authority license number",
        example: "EGY-RE-2026-9912",
      }),
      brokerageName: z.string().min(2).max(150).optional().openapi({
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
    .refine(
      (data) => {
        if (data.proofType === "OTHER") {
          return Boolean(data.proofDescription && data.proofDescription.trim().length > 0);
        }
        return true;
      },
      {
        message: "proofDescription is required when proofType is OTHER (Decision #55)",
        path: ["proofDescription"],
      }
    )
);
export type AgentApplicationSubmitInput = z.infer<typeof AgentApplicationSubmitSchema>;

export const AgentApplicationReviewSchema = registry.register(
  "AgentApplicationReviewInput",
  z
    .object({
      decision: z.enum(["APPROVED", "REJECTED"]).openapi({
        description: "Review decision: APPROVED or REJECTED",
        example: "APPROVED",
      }),
      rejectionReason: z.string().min(5).max(1000).optional().openapi({
        description: "Mandatory rejection reason shown to applicant (Decision #57)",
        example: "National ID scan was unreadable. Please provide a clear photograph.",
      }),
      notes: z.string().max(500).optional().openapi({
        description: "Internal administrative review notes",
        example: "Visual verification completed against national register.",
      }),
    })
    .refine(
      (data) => {
        if (data.decision === "REJECTED") {
          return Boolean(data.rejectionReason && data.rejectionReason.trim().length >= 5);
        }
        return true;
      },
      {
        message: "rejectionReason with at least 5 characters is required when rejecting (Decision #57)",
        path: ["rejectionReason"],
      }
    )
);
export type AgentApplicationReviewInput = z.infer<typeof AgentApplicationReviewSchema>;

export const AgentRevocationSchema = registry.register(
  "AgentRevocationInput",
  z.object({
    notes: z.string().min(5).max(500).openapi({
      description: "Administrative rationale for revoking agent status (Decisions #52, #58)",
      example: "License expired or disciplinary suspension.",
    }),
  })
);
export type AgentRevocationInput = z.infer<typeof AgentRevocationSchema>;

export const AgentApplicationItemSchema = registry.register(
  "AgentApplicationItem",
  z.object({
    id: z.string().uuid().openapi({ description: "Application UUIDv7" }),
    userId: z.string(),
    proofType: AgentProofTypeEnum,
    proofDescription: z.string().nullable().optional(),
    licenseNumber: z.string(),
    brokerageName: z.string().nullable().optional(),
    bioEn: z.string().nullable().optional(),
    bioAr: z.string().nullable().optional(),
    status: AgentApplicationStatusEnum,
    rejectionReason: z.string().nullable().optional(),
    reviewedByUserId: z.string().nullable().optional(),
    reviewedAt: z.string().datetime().nullable().optional(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    user: z.object({
      id: z.string(),
      name: z.string(),
      email: z.string(),
      phone: z.string().nullable().optional(),
      image: z.string().nullable().optional(),
    }),
  })
);
export type AgentApplicationItem = z.infer<typeof AgentApplicationItemSchema>;

export const AgentApplicationDetailSchema = registry.register(
  "AgentApplicationDetail",
  AgentApplicationItemSchema.extend({
    nationalIdUrl: z.string().openapi({ description: "Private URL/path for National ID" }),
    selfieUrl: z.string().openapi({ description: "Private URL/path for live selfie" }),
    proofDocumentUrl: z.string().openapi({ description: "Private URL/path for proof document" }),
  })
);
export type AgentApplicationDetail = z.infer<typeof AgentApplicationDetailSchema>;

export const AgentApplicationListResponseSchema = registry.register(
  "AgentApplicationListResponse",
  z.object({
    items: z.array(AgentApplicationItemSchema),
  })
);
export type AgentApplicationListResponse = z.infer<typeof AgentApplicationListResponseSchema>;

