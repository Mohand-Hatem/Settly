"use client";

import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchMyProfile,
  fetchMyAgentProfile,
  fetchMyAgentApplication,
  submitAgentApplication,
  deleteMyAccount,
  updateMyProfile,
  saveMyAgentProfile,
  type UpdateUserProfile,
  type CreateOrUpdateAgentProfile,
  type AgentApplicationSubmitInput,
} from "@/api/identity";

export const identityKeys = {
  all: ["identity"] as const,
  me: () => [...identityKeys.all, "me"] as const,
  agentProfile: () => [...identityKeys.all, "agent-profile"] as const,
  agentApplication: () => [...identityKeys.all, "agent-application"] as const,
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

export const myAgentApplicationQuery = () =>
  queryOptions({
    queryKey: identityKeys.agentApplication(),
    queryFn: ({ signal }) => fetchMyAgentApplication(signal),
    staleTime: 30_000,
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

export function useSubmitAgentApplicationMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: AgentApplicationSubmitInput) => submitAgentApplication(body),
    onSuccess: (created) => {
      qc.setQueryData(identityKeys.agentApplication(), created);
      qc.invalidateQueries({ queryKey: identityKeys.all });
    },
  });
}

export function useDeleteAccountMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => deleteMyAccount(),
    onSuccess: () => {
      qc.clear();
    },
  });
}
