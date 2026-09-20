"use client";

import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchMyProfile,
  fetchMyAgentProfile,
  updateMyProfile,
  saveMyAgentProfile,
  type UpdateUserProfile,
  type CreateOrUpdateAgentProfile,
} from "@/api/identity";

export const identityKeys = {
  all: ["identity"] as const,
  me: () => [...identityKeys.all, "me"] as const,
  agentProfile: () => [...identityKeys.all, "agent-profile"] as const,
};

export const myProfileQuery = () =>
  queryOptions({
    queryKey: identityKeys.me(),
    queryFn: ({ signal }) => fetchMyProfile(signal),
    staleTime: 60_000,
  });

export const myAgentProfileQuery = () =>
  queryOptions({
    queryKey: identityKeys.agentProfile(),
    queryFn: ({ signal }) => fetchMyAgentProfile(signal),
    staleTime: 60_000,
  });

export function useUpdateProfileMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateUserProfile) => updateMyProfile(body),
    onSuccess: (updated) => {
      qc.setQueryData(identityKeys.me(), updated);
    },
  });
}

export function useSaveAgentProfileMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateOrUpdateAgentProfile) => saveMyAgentProfile(body),
    onSuccess: (updated) => {
      qc.setQueryData(identityKeys.agentProfile(), updated);
    },
  });
}
