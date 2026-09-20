"use client";

import {
  infiniteQueryOptions,
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  acceptOffer,
  counterOffer,
  createOffer,
  fetchAgentOffers,
  fetchMyOfferForProperty,
  fetchMyOffers,
  fetchOffer,
  rejectOffer,
  withdrawOffer,
  type CounterOfferInput,
  type CreateOfferInput,
  type OfferScope,
} from "@/api/offers";

export const offerKeys = {
  all: ["offers"] as const,
  detail: (id: string) => [...offerKeys.all, "detail", id] as const,
  myOffers: (scope: OfferScope) => [...offerKeys.all, "me", scope] as const,
  agentOffers: (scope: OfferScope, propertyId?: string) =>
    [...offerKeys.all, "agent", scope, propertyId ?? "all"] as const,
  forProperty: (propertyId: string) =>
    [...offerKeys.all, "property", propertyId] as const,
};

export const offerDetailQuery = (id: string) =>
  queryOptions({
    queryKey: offerKeys.detail(id),
    queryFn: ({ signal }) => fetchOffer(id, signal),
    enabled: Boolean(id),
  });

export const myOffersQuery = (scope: OfferScope) =>
  infiniteQueryOptions({
    queryKey: offerKeys.myOffers(scope),
    queryFn: ({ signal, pageParam }) =>
      fetchMyOffers({ scope, cursor: pageParam }, signal),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.pageInfo.nextCursor ?? undefined,
  });

export const agentOffersQuery = (scope: OfferScope, propertyId?: string) =>
  infiniteQueryOptions({
    queryKey: offerKeys.agentOffers(scope, propertyId),
    queryFn: ({ signal, pageParam }) =>
      fetchAgentOffers({ scope, propertyId, cursor: pageParam }, signal),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.pageInfo.nextCursor ?? undefined,
  });

export const myOfferForPropertyQuery = (propertyId: string) =>
  queryOptions({
    queryKey: offerKeys.forProperty(propertyId),
    queryFn: ({ signal }) => fetchMyOfferForProperty(propertyId, signal),
    enabled: Boolean(propertyId),
  });

export function useCreateOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateOfferInput) => {
      const idempotencyKey =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `offer-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      return createOffer(input, idempotencyKey);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: offerKeys.all });
    },
  });
}

export function useCounterOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CounterOfferInput }) =>
      counterOffer(id, input),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: offerKeys.all });
    },
  });
}

export function useAcceptOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => acceptOffer(id),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: offerKeys.all });
    },
  });
}

export function useRejectOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      rejectOffer(id, reason),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: offerKeys.all });
    },
  });
}

export function useWithdrawOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      withdrawOffer(id, reason),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: offerKeys.all });
    },
  });
}
