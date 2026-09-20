import { z } from "../../../shared/openapi/zod.js";
import { registry } from "../../../shared/openapi/registry.js";

export const PaymentStatusEnum = registry.register(
  "PaymentStatus",
  z.enum([
    "PENDING",
    "PROCESSING",
    "SUCCEEDED",
    "CANCELLED",
    "EXPIRED",
    "REFUNDED",
    "PARTIALLY_REFUNDED",
  ])
);

export const AttemptStatusEnum = registry.register(
  "AttemptStatus",
  z.enum([
    "INITIATED",
    "REDIRECTED",
    "SUCCEEDED",
    "FAILED",
    "ABANDONED",
    "EXPIRED",
  ])
);

export const RefundStatusEnum = registry.register(
  "RefundStatus",
  z.enum([
    "REQUESTED",
    "PROCESSING",
    "SUCCEEDED",
    "FAILED",
  ])
);

export const CheckoutInitiateRequestSchema = registry.register(
  "CheckoutInitiateRequest",
  z.object({
    returnUrl: z.string().url().optional(),
  })
);

export const CheckoutInitiateResponseSchema = registry.register(
  "CheckoutInitiateResponse",
  z.object({
    checkoutUrl: z.string(),
    orderReference: z.string(),
    amountEgp: z.number().int().positive(),
    holdExpiresAt: z.string().datetime(),
    isSimulated: z.boolean(),
  })
);

export const DepositStatusResponseSchema = registry.register(
  "DepositStatusResponse",
  z.object({
    offerId: z.string(),
    propertyId: z.string(),
    paymentStatus: PaymentStatusEnum,
    offerStatus: z.string(),
    propertyStatus: z.string(),
    depositAmount: z.number().int().positive(),
    depositDeadlineAt: z.string().datetime().nullable(),
    holdExpiresAt: z.string().datetime().nullable(),
    isHeldByCaller: z.boolean(),
    anotherBuyerHolding: z.boolean(),
    holdRemainingSeconds: z.number().int().nonnegative(),
  })
);

export type CheckoutInitiateRequest = z.infer<typeof CheckoutInitiateRequestSchema>;
export type CheckoutInitiateResponse = z.infer<typeof CheckoutInitiateResponseSchema>;
export type DepositStatusResponse = z.infer<typeof DepositStatusResponseSchema>;

