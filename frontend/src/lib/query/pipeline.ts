"use client";

import { infiniteQueryOptions, queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchAgentViewings,
  fetchAvailability,
  fetchMyViewings,
  fetchViewingSlots,
  saveAvailability,
  viewingAction,
  type UpdateAvailability,
  type ViewingScope,
} from "@/api/pipeline";
import { ApiError } from "@/api/errors";

export const pipelineKeys = {
  all: ["pipeline"] as const,
  slots: (propertyId: string) => [...pipelineKeys.all, "slots", propertyId] as const,
  myViewings: (scope: ViewingScope) => [...pipelineKeys.all, "me", scope] as const,
  agentViewings: (scope: ViewingScope, range?: { from?: string; to?: string }) =>
    [...pipelineKeys.all, "agent", scope, range ?? {}] as const,
  availability: () => [...pipelineKeys.all, "availability"] as const,
};

export const viewingSlotsQuery = (propertyId: string) =>
  queryOptions({
    queryKey: pipelineKeys.slots(propertyId),
    queryFn: ({ signal }) => fetchViewingSlots(propertyId, signal),
    staleTime: 30_000,
  });

export const myViewingsQuery = (scope: ViewingScope) =>
  infiniteQueryOptions({
    queryKey: pipelineKeys.myViewings(scope),
    queryFn: ({ signal, pageParam }) => fetchMyViewings({ scope, cursor: pageParam }, signal),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.pageInfo.nextCursor ?? undefined,
  });

export const agentViewingsQuery = (scope: ViewingScope, range?: { from?: string; to?: string }) =>
  infiniteQueryOptions({
    queryKey: pipelineKeys.agentViewings(scope, range),
    queryFn: ({ signal, pageParam }) => fetchAgentViewings({ scope, cursor: pageParam, ...range }, signal),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.pageInfo.nextCursor ?? undefined,
  });

export const availabilityQuery = () =>
  queryOptions({ queryKey: pipelineKeys.availability(), queryFn: ({ signal }) => fetchAvailability(signal) });

/**
 * Every viewing action refetches all viewing lists and slots afterwards. On a 409 (state conflict)
 * the refetch is what shows the new state (UX_PATTERNS §5).
 */
export function useViewingAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; action: Parameters<typeof viewingAction>[1]; reason?: string; startsAt?: string }) =>
      viewingAction(v.id, v.action, { reason: v.reason, startsAt: v.startsAt }),
    onSettled: () => qc.invalidateQueries({ queryKey: pipelineKeys.all }),
  });
}

export function useSaveAvailability() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateAvailability) => saveAvailability(body),
    onSuccess: (data) => qc.setQueryData(pipelineKeys.availability(), data),
  });
}

export function isConflict(error: unknown): boolean {
  return error instanceof ApiError && error.status === 409;
}
