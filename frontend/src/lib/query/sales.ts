"use client";

import {
  infiniteQueryOptions,
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  confirmSale,
  disputeSale,
  fetchAdminSales,
  fetchAdminSaleDetail,
  adminConfirmSale,
  adminFellThroughSale,
  adminExtendSaleReview,
  type AdminSaleTab,
  type AdminConfirmSaleInput,
  type AdminFellThroughSaleInput,
  type AdminExtendSaleReviewInput,
  type DisputeSaleInput,
} from "@/api/sales";
import { offerKeys } from "./offers";

export const salesKeys = {
  all: ["admin-sales"] as const,
  list: (tab?: string, search?: string) =>
    [...salesKeys.all, "list", tab ?? "all", search ?? ""] as const,
  detail: (id: string) => [...salesKeys.all, "detail", id] as const,
};

export const adminSalesListQuery = (tab?: AdminSaleTab, search?: string) =>
  infiniteQueryOptions({
    queryKey: salesKeys.list(tab, search),
    queryFn: ({ pageParam }) =>
      fetchAdminSales({
        tab,
        search,
        cursor: pageParam as string | undefined,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.pageInfo.nextCursor ?? undefined,
  });

export const adminSaleDetailQuery = (id: string) =>
  queryOptions({
    queryKey: salesKeys.detail(id),
    queryFn: () => fetchAdminSaleDetail(id),
    enabled: Boolean(id),
  });

/**
 * Hook for buyer/agent to confirm sale completion (BUY-10, AGT-07)
 */
export function useConfirmSaleMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ offerId }: { offerId: string }) => confirmSale(offerId),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: offerKeys.all });
      qc.invalidateQueries({ queryKey: offerKeys.detail(vars.offerId) });
      qc.invalidateQueries({ queryKey: salesKeys.all });
    },
  });
}

/**
 * Hook for buyer/agent to report a dispute (P9a)
 */
export function useDisputeSaleMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      offerId,
      input,
    }: {
      offerId: string;
      input: DisputeSaleInput;
    }) => disputeSale(offerId, input),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: offerKeys.all });
      qc.invalidateQueries({ queryKey: offerKeys.detail(vars.offerId) });
      qc.invalidateQueries({ queryKey: salesKeys.all });
    },
  });
}

/**
 * Hook for admin to confirm sale completion directly (P9, O13)
 */
export function useAdminConfirmSaleMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      offerId,
      input,
    }: {
      offerId: string;
      input: AdminConfirmSaleInput;
    }) => adminConfirmSale(offerId, input),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: salesKeys.all });
      qc.invalidateQueries({ queryKey: salesKeys.detail(vars.offerId) });
      qc.invalidateQueries({ queryKey: offerKeys.all });
    },
  });
}

/**
 * Hook for admin to declare sale fell through (P10, O14)
 */
export function useAdminFellThroughSaleMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      offerId,
      input,
    }: {
      offerId: string;
      input: AdminFellThroughSaleInput;
    }) => adminFellThroughSale(offerId, input),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: salesKeys.all });
      qc.invalidateQueries({ queryKey: salesKeys.detail(vars.offerId) });
      qc.invalidateQueries({ queryKey: offerKeys.all });
    },
  });
}

/**
 * Hook for admin to extend review period
 */
export function useAdminExtendSaleReviewMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      offerId,
      input,
    }: {
      offerId: string;
      input: AdminExtendSaleReviewInput;
    }) => adminExtendSaleReview(offerId, input),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: salesKeys.all });
      qc.invalidateQueries({ queryKey: salesKeys.detail(vars.offerId) });
      qc.invalidateQueries({ queryKey: offerKeys.all });
    },
  });
}
