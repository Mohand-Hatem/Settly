import { z } from "../../../shared/openapi/zod.js";
import { registry } from "../../../shared/openapi/registry.js";

/**
 * Offer Status Enum — Authoritative 10-State Machine
 * Governed by docs/product/BUSINESS_RULES.md §4 and Decision #45, #105
 */
export const OfferStatusEnum = registry.register(
  "OfferStatus",
  z.enum([
    "PENDING_AGENT",
    "PENDING_BUYER",
    "ACCEPTED",
    "RESERVED",
    "REJECTED",
    "WITHDRAWN",
    "EXPIRED",
    "SUPERSEDED",
    "COMPLETED",
    "FELL_THROUGH",
  ])
);

export type OfferStatusType = z.infer<typeof OfferStatusEnum>;

export const LIVE_OFFER_STATUSES: OfferStatusType[] = [
  "PENDING_AGENT",
  "PENDING_BUYER",
  "ACCEPTED",
  "RESERVED",
];

export const TERMINAL_OFFER_STATUSES: OfferStatusType[] = [
  "REJECTED",
  "WITHDRAWN",
  "EXPIRED",
  "SUPERSEDED",
  "COMPLETED",
  "FELL_THROUGH",
];

/**
 * Offer Revision Schema
 */
export const OfferRevisionSchema = registry.register(
  "OfferRevision",
  z.object({
    id: z.string(),
    revisionNumber: z.number().int().min(1),
    actorId: z.string(),
    actorRole: z.enum(["BUYER", "AGENT"]),
    amount: z.coerce.number().int().positive().openapi({
      description: "Offer amount in EGP (canonical whole amount)",
      example: 7500000,
    }),
    earnestMoney: z.coerce.number().int().positive().nullable().optional().openapi({
      description: "Optional earnest money / down payment component in EGP",
    }),
    conditions: z.string().trim().max(1000).nullable().optional(),
    proposedClosingDate: z.string().datetime().nullable().optional(),
    createdAt: z.string().datetime(),
  })
);

/**
 * Create Initial Offer (Buyer -> PENDING_AGENT)
 */
export const CreateOfferSchema = registry.register(
  "CreateOffer",
  z.object({
    propertyId: z.string().uuid(),
    amount: z.coerce.number().int().min(100_000, "Minimum offer is 100,000 EGP").openapi({
      description: "Purchase price in EGP offered by the buyer",
      example: 8200000,
    }),
    earnestMoney: z.coerce.number().int().positive().optional().openapi({
      description: "Optional earnest money / upfront component",
    }),
    conditions: z.string().trim().max(1000).optional().openapi({
      description: "Contingencies or special terms (e.g. financed, delivery timeline)",
    }),
    proposedClosingDate: z.string().datetime().optional().openapi({
      description: "Target closing date in ISO 8601",
    }),
  })
);

/**
 * Counter-Offer Schema (Buyer or Agent)
 */
export const CounterOfferSchema = registry.register(
  "CounterOffer",
  z.object({
    amount: z.coerce.number().int().min(100_000, "Minimum offer is 100,000 EGP").openapi({
      description: "New purchase price in EGP",
      example: 8500000,
    }),
    earnestMoney: z.coerce.number().int().positive().optional(),
    conditions: z.string().trim().max(1000).optional(),
    proposedClosingDate: z.string().datetime().optional(),
  })
);

export const OptionalOfferReasonSchema = registry.register(
  "OptionalOfferReason",
  z.object({
    reason: z.string().trim().max(500).optional(),
  })
);

export const RequiredOfferReasonSchema = registry.register(
  "RequiredOfferReason",
  z.object({
    reason: z.string().trim().min(3, "Reason must be at least 3 characters").max(500),
  })
);

const PartySummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  phone: z.string().nullable().optional().openapi({
    description: "Buyer phone visible to agent only while an active offer exists (#60, #66, #72). Agent phone is never public.",
  }),
});

/**
 * Offer Detail Response Schema
 */
export const OfferResponseSchema = registry.register(
  "Offer",
  z.object({
    id: z.string(),
    propertyId: z.string(),
    status: OfferStatusEnum,
    currentAmount: z.coerce.number().int().positive().openapi({
      description: "Amount from the latest revision in EGP",
    }),
    acceptedAt: z.string().datetime().nullable(),
    expiresAt: z.string().datetime().nullable(),
    rejectionReason: z.string().nullable().optional(),
    withdrawalReason: z.string().nullable().optional(),
    depositAmount: z.coerce.number().int().positive().openapi({
      description: "5% deposit capped at 50,000 EGP",
    }),
    depositDeadlineAt: z.string().datetime().nullable().optional(),
    buyerConfirmedAt: z.string().datetime().nullable().optional(),
    agentConfirmedAt: z.string().datetime().nullable().optional(),
    disputedAt: z.string().datetime().nullable().optional(),
    disputedById: z.string().nullable().optional(),
    disputeReason: z.string().nullable().optional(),
    adminReviewedAt: z.string().datetime().nullable().optional(),
    adminReviewedById: z.string().nullable().optional(),
    adminReviewDecision: z.string().nullable().optional(),
    adminReviewNotes: z.string().nullable().optional(),
    adminReviewDeadline: z.string().datetime().nullable().optional(),
    property: z.object({
      id: z.string(),
      slug: z.string(),
      title: z.string().nullable(),
      price: z.coerce.number().int().positive(),
      imageUrl: z.string().nullable(),
      locationName: z.string().nullable().optional(),
      intent: z.enum(["SALE", "RENT"]),
      status: z.string(),
    }),
    buyer: PartySummarySchema,
    agent: PartySummarySchema,
    latestRevision: OfferRevisionSchema,
    revisions: z.array(OfferRevisionSchema),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
);

export type OfferResponse = z.infer<typeof OfferResponseSchema>;

export const OfferScopeEnum = z.enum(["live", "terminal", "all"]).default("all");

export const OfferListQuerySchema = z.object({
  scope: OfferScopeEnum.optional(),
  propertyId: z.string().uuid().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const OfferListResponseSchema = registry.register(
  "OfferList",
  z.object({
    items: z.array(OfferResponseSchema),
    pageInfo: z.object({
      nextCursor: z.string().nullable(),
      hasNextPage: z.boolean(),
    }),
  })
);

export const DisputeSaleSchema = registry.register(
  "DisputeSale",
  z.object({
    reason: z.string().trim().min(10, "Dispute reason must be at least 10 characters").max(1000),
  })
);

export const AdminConfirmSaleSchema = registry.register(
  "AdminConfirmSale",
  z.object({
    notes: z.string().trim().min(5, "Notes must be at least 5 characters").max(1000),
  })
);

export const AdminFellThroughSaleSchema = registry.register(
  "AdminFellThroughSale",
  z.object({
    cause: z.enum([
      "SELLER_AGENT_WITHDRAWN",
      "BUYER_WITHDRAWN_WITHIN_48H",
      "BUYER_WITHDRAWN_AFTER_48H",
      "EXTERNAL_COLLAPSE",
      "ADMIN_DETERMINATION",
    ]),
    reason: z.string().trim().min(5).max(1000),
    notes: z.string().trim().max(1000).optional(),
  })
);

export const AdminExtendSaleReviewSchema = registry.register(
  "AdminExtendSaleReview",
  z.object({
    extensionDays: z.coerce.number().int().min(1).max(60).default(14),
    notes: z.string().trim().min(5).max(1000),
  })
);

export const AdminSalesQuerySchema = z.object({
  tab: z.enum(["ACTION_REQUIRED", "ACTIVE", "RESOLVED"]).optional().default("ACTION_REQUIRED"),
  search: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const AdminSaleItemSchema = registry.register(
  "AdminSaleItem",
  z.object({
    id: z.string(),
    propertyId: z.string(),
    status: OfferStatusEnum,
    agreedPrice: z.coerce.number().int().positive(),
    depositAmount: z.coerce.number().int().positive(),
    property: z.object({
      id: z.string(),
      title: z.string(),
      slug: z.string(),
      imageUrl: z.string().nullable(),
      price: z.coerce.number().int().positive(),
      status: z.string(),
    }),
    buyer: z.object({
      id: z.string(),
      name: z.string(),
      email: z.string().optional(),
    }),
    agent: z.object({
      id: z.string(),
      name: z.string(),
      email: z.string().optional(),
    }),
    buyerConfirmedAt: z.string().datetime().nullable(),
    agentConfirmedAt: z.string().datetime().nullable(),
    disputedAt: z.string().datetime().nullable(),
    disputeReason: z.string().nullable(),
    adminReviewedAt: z.string().datetime().nullable(),
    adminReviewDecision: z.string().nullable(),
    adminReviewNotes: z.string().nullable(),
    adminReviewDeadline: z.string().datetime().nullable(),
    reservationDate: z.string().datetime().nullable(),
    daysElapsed: z.number().int(),
    isDisputed: z.boolean(),
    isDeadlinePassed: z.boolean(),
    requiresAction: z.boolean(),
  })
);

export const AdminSalesListResponseSchema = registry.register(
  "AdminSalesListResponse",
  z.object({
    items: z.array(AdminSaleItemSchema),
    counts: z.object({
      actionRequired: z.number().int(),
      active: z.number().int(),
      resolved: z.number().int(),
    }),
    pageInfo: z.object({
      nextCursor: z.string().nullable(),
      hasNextPage: z.boolean(),
    }),
  })
);

