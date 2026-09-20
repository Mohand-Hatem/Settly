import { api } from "./client";
import { unwrap } from "./errors";
import type { components } from "./v1.d.ts";

export type Offer = components["schemas"]["Offer"];
export type AdminSaleItem = components["schemas"]["AdminSaleItem"];
export type AdminSalesListResponse = components["schemas"]["AdminSalesListResponse"];
export type AdminConfirmSaleInput = components["schemas"]["AdminConfirmSale"];
export type AdminFellThroughSaleInput = components["schemas"]["AdminFellThroughSale"];
export type AdminExtendSaleReviewInput = components["schemas"]["AdminExtendSaleReview"];
export type DisputeSaleInput = components["schemas"]["DisputeSale"];

export type AdminSaleTab = "ACTION_REQUIRED" | "ACTIVE" | "RESOLVED";

/**
 * Confirm Property Sale Completion (BUY-10 for Buyer, AGT-07 for Agent)
 * When both parties confirm, transition to SOLD (#77, #102).
 */
export async function confirmSale(offerId: string): Promise<Offer> {
  return unwrap(
    await api.POST("/api/v1/offers/{id}/confirm-sale", {
      params: { path: { id: offerId } },
    })
  );
}

/**
 * Report a Dispute on Conveyance Progress (P9a)
 * Immediately escalates case to Admin Review queue.
 */
export async function disputeSale(
  offerId: string,
  input: DisputeSaleInput
): Promise<Offer> {
  return unwrap(
    await api.POST("/api/v1/offers/{id}/dispute-sale", {
      params: { path: { id: offerId } },
      body: input,
    })
  );
}

/**
 * List Sales for Admin Review Queue (ADM-07)
 */
export async function fetchAdminSales(params?: {
  tab?: AdminSaleTab;
  search?: string;
  cursor?: string;
  limit?: number;
}): Promise<AdminSalesListResponse> {
  return unwrap(
    await api.GET("/api/v1/admin/sales", {
      params: {
        query: {
          tab: params?.tab ?? "ACTION_REQUIRED",
          search: params?.search,
          cursor: params?.cursor,
          limit: params?.limit ?? 20,
        },
      },
    })
  );
}

/**
 * Get Specific Admin Sale Case Detail
 */
export async function fetchAdminSaleDetail(
  offerId: string
): Promise<AdminSaleItem> {
  return unwrap(
    await api.GET("/api/v1/admin/sales/{id}", {
      params: { path: { id: offerId } },
    })
  );
}

/**
 * Admin Confirms Sale Completion (P9, O13)
 * Property becomes SOLD.
 */
export async function adminConfirmSale(
  offerId: string,
  input: AdminConfirmSaleInput
): Promise<Offer> {
  return unwrap(
    await api.POST("/api/v1/admin/sales/{id}/confirm", {
      params: { path: { id: offerId } },
      body: input,
    })
  );
}

/**
 * Admin Declares Sale Fell Through (P10, O14)
 * Property returned to PUBLISHED; deposit refund rules evaluated.
 */
export async function adminFellThroughSale(
  offerId: string,
  input: AdminFellThroughSaleInput
): Promise<Offer> {
  return unwrap(
    await api.POST("/api/v1/admin/sales/{id}/fell-through", {
      params: { path: { id: offerId } },
      body: input,
    })
  );
}

/**
 * Admin Extends Review Period
 */
export async function adminExtendSaleReview(
  offerId: string,
  input: AdminExtendSaleReviewInput
): Promise<Offer> {
  return unwrap(
    await api.POST("/api/v1/admin/sales/{id}/extend", {
      params: { path: { id: offerId } },
      body: input,
    })
  );
}
