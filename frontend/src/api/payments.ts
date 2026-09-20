import { api } from "./client";
import { unwrap } from "./errors";
import type { components } from "./v1.d.ts";

export type CheckoutInitiateResponse = components["schemas"]["CheckoutInitiateResponse"];
export type DepositStatusResponse = components["schemas"]["DepositStatusResponse"];

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
