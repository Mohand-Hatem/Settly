"use client";

import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchAgentSubscription,
  checkoutAgentSubscription,
  cancelAgentSubscription,
  type SubscriptionCheckoutInput,
} from "@/api/payments";
import { subscriptionKeys } from "./keys";

export const agentSubscriptionQuery = () =>
  queryOptions({
    queryKey: subscriptionKeys.status(),
    queryFn: ({ signal }) => fetchAgentSubscription(signal),
    staleTime: 30_000,
  });

export function useSubscriptionCheckoutMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      body,
      idempotencyKey,
    }: {
      body: SubscriptionCheckoutInput;
      idempotencyKey?: string;
    }) => checkoutAgentSubscription(body, idempotencyKey),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: subscriptionKeys.all });
    },
  });
}

export function useCancelSubscriptionMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => cancelAgentSubscription(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: subscriptionKeys.all });
    },
  });
}
