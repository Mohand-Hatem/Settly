import { z } from "../../../shared/openapi/zod.js";

export const SubscriptionPlanEnum = z.enum(["FREE", "PRO", "ENTERPRISE"]);
export const PaidSubscriptionPlanEnum = z.enum(["PRO", "ENTERPRISE"]);
export const SubscriptionPeriodKindEnum = z.enum(["NEW", "RENEWAL", "UPGRADE", "DOWNGRADE"]);
export const SubscriptionPeriodStatusEnum = z.enum(["SCHEDULED", "ACTIVE", "ENDED", "SUPERSEDED"]);
export const SubscriptionPaymentStatusEnum = z.enum(["PENDING", "PROCESSING", "SUCCEEDED", "EXPIRED", "CANCELLED"]);

export const SubscriptionPeriodSchema = z.object({
  id: z.string(),
  plan: SubscriptionPlanEnum,
  kind: SubscriptionPeriodKindEnum,
  startsAt: z.string(),
  endsAt: z.string(),
  status: SubscriptionPeriodStatusEnum,
});

export const SubscriptionReceiptSchema = z.object({
  id: z.string(),
  receiptNumber: z.string().nullable(),
  plan: SubscriptionPlanEnum,
  kind: SubscriptionPeriodKindEnum,
  amountEgp: z.number(),
  amountUsd: z.number(),
  fxRate: z.number(),
  paidAt: z.string().nullable(),
  status: SubscriptionPaymentStatusEnum,
});

export const SubscriptionQuotaSchema = z.object({
  used: z.number(),
  total: z.number(),
  remaining: z.number(),
  resetDate: z.string(),
  waitingCount: z.number(),
});

export const SubscriptionStatusResponseSchema = z.object({
  plan: SubscriptionPlanEnum,
  isVerified: z.boolean(),
  quota: SubscriptionQuotaSchema,
  currentPeriod: SubscriptionPeriodSchema.nullable(),
  queuedPeriod: SubscriptionPeriodSchema.nullable(),
  canRenew: z.boolean(),
  canUpgrade: z.boolean(),
  renewalBlockedReason: z.string().nullable(),
  upgradeBlockedReason: z.string().nullable(),
  cancelledAt: z.string().nullable(),
  receipts: z.array(SubscriptionReceiptSchema),
});

export const SubscriptionCheckoutRequestSchema = z.object({
  plan: PaidSubscriptionPlanEnum,
  returnUrl: z.string().url().optional(),
});

export const SubscriptionCheckoutResponseSchema = z.object({
  checkoutUrl: z.string(),
  orderReference: z.string(),
  amountEgp: z.number(),
  amountUsd: z.number(),
  plan: PaidSubscriptionPlanEnum,
  kind: SubscriptionPeriodKindEnum,
  expiresAt: z.string(),
  isSimulated: z.boolean(),
});

export const SubscriptionCancelResponseSchema = z.object({
  success: z.boolean(),
  cancelledAt: z.string(),
  message: z.string(),
});

export type SubscriptionStatusResponse = z.infer<typeof SubscriptionStatusResponseSchema>;
export type SubscriptionCheckoutRequest = z.infer<typeof SubscriptionCheckoutRequestSchema>;
export type SubscriptionCheckoutResponse = z.infer<typeof SubscriptionCheckoutResponseSchema>;
export type SubscriptionCancelResponse = z.infer<typeof SubscriptionCancelResponseSchema>;
