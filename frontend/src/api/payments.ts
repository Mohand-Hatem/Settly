import { api } from "./client";
import { unwrap } from "./errors";
import type { components, paths } from "./v1.d.ts";

export type CheckoutInitiateResponse = components["schemas"]["CheckoutInitiateResponse"];
export type DepositStatusResponse = components["schemas"]["DepositStatusResponse"];
export type AgentSubscriptionStatusResponse =
  paths["/api/v1/agent/subscription"]["get"]["responses"][200]["content"]["application/json"];
export type SubscriptionCheckoutInput =
  NonNullable<paths["/api/v1/agent/subscription/checkout"]["post"]["requestBody"]>["content"]["application/json"];
export type SubscriptionCheckoutResponse =
  paths["/api/v1/agent/subscription/checkout"]["post"]["responses"][200]["content"]["application/json"];
export type SubscriptionCancelResponse =
  paths["/api/v1/agent/subscription/cancel"]["post"]["responses"][200]["content"]["application/json"];

/**
 * Initiates 15-minute checkout hold and Paymob hosted session (Y2, BUY-08)
 */
export async function initiateDepositCheckout(
  offerId: string,
  returnUrl?: string,
  idempotencyKey?: string
): Promise<CheckoutInitiateResponse> {
  const key = idempotencyKey || `chk-${offerId}-${Date.now()}`;
  return unwrap(
    await api.POST("/api/v1/offers/{id}/deposit/checkout", {
      params: {
        path: { id: offerId },
        header: { "Idempotency-Key": key },
      },
      body: { returnUrl },
    })
  );
}

/**
 * Polls real-time deposit payment and hold status (SH-05, BUY-09)
 */
export async function fetchDepositStatus(
  offerId: string,
  signal?: AbortSignal
): Promise<DepositStatusResponse> {
  return unwrap(
    await api.GET("/api/v1/offers/{id}/deposit/status", {
      params: { path: { id: offerId } },
      signal,
    })
  );
}

/**
 * Fetch agent subscription status, quota usage, and billing period (SUB-01, SUB-04, SUB-09)
 */
export async function fetchAgentSubscription(
  signal?: AbortSignal
): Promise<AgentSubscriptionStatusResponse> {
  return unwrap(
    await api.GET("/api/v1/agent/subscription", { signal })
  );
}

/**
 * Initiate Paymob hosted checkout for Pro ($20/980 EGP) or Enterprise ($50/2,449 EGP) tier (SUB-02, #89, #103, #104)
 */
export async function checkoutAgentSubscription(
  body: SubscriptionCheckoutInput,
  idempotencyKey?: string
): Promise<SubscriptionCheckoutResponse> {
  return unwrap(
    await api.POST("/api/v1/agent/subscription/checkout", {
      params: idempotencyKey ? { header: { "Idempotency-Key": idempotencyKey } } : undefined,
      body,
    })
  );
}

/**
 * Cancel subscription renewal; current active period runs until period end without refund (SUB-07, #91)
 */
export async function cancelAgentSubscription(): Promise<SubscriptionCancelResponse> {
  return unwrap(
    await api.POST("/api/v1/agent/subscription/cancel")
  );
}
