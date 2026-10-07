"use client";

import {
  infiniteQueryOptions,
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  fetchAdminStats,
  fetchAdminProperties,
  approveProperty,
  rejectProperty,
  suspendProperty,
  unsuspendProperty,
  fetchAdminAgents,
  fetchAdminAgentDetail,
  verifyAgent,
  fetchAdminAgentApplications,
  fetchAdminAgentApplication,
  reviewAdminAgentApplication,
  revokeAdminAgent,
  type PropertyStatus,
  type AgentVerificationInput,
  type AgentApplicationStatus,
  type AgentApplicationReviewInput,
  type AgentRevocationInput,
} from "@/api/admin";

export const adminKeys = {
  all: ["admin"] as const,
  stats: () => [...adminKeys.all, "stats"] as const,
  properties: (status?: string) =>
    [...adminKeys.all, "properties", status ?? "all"] as const,
  agents: (verified?: string) =>
    [...adminKeys.all, "agents", verified ?? "all"] as const,
  agentDetail: (id: string) =>
    [...adminKeys.all, "agents", "detail", id] as const,
  agentApplications: (status?: string) =>
    [...adminKeys.all, "agent-applications", status ?? "all"] as const,
  agentApplicationDetail: (id: string) =>
    [...adminKeys.all, "agent-applications", "detail", id] as const,
};

/**
 * Operational dashboard counts (ADM-01)
 */
export const adminStatsQuery = () =>
  queryOptions({
    queryKey: adminKeys.stats(),
    queryFn: () => fetchAdminStats(),
    refetchInterval: 30000,
  });

/**
 * Moderation queue list (ADM-02)
 */
export const adminPropertiesInfiniteQuery = (status?: PropertyStatus) =>
  infiniteQueryOptions({
    queryKey: adminKeys.properties(status),
    queryFn: ({ pageParam }) =>
      fetchAdminProperties({
        status,
        cursor: pageParam as string | undefined,
        limit: 20,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });

/**
 * Agent verification queue (ADM-04)
 */
export const adminAgentsQuery = (verified?: "true" | "false") =>
  queryOptions({
    queryKey: adminKeys.agents(verified),
    queryFn: () => fetchAdminAgents({ verified }),
  });

/**
 * Single agent review details (ADM-04)
 */
export const adminAgentDetailQuery = (id: string) =>
  queryOptions({
    queryKey: adminKeys.agentDetail(id),
    queryFn: () => fetchAdminAgentDetail(id),
    enabled: Boolean(id),
  });

/**
 * Approve listing mutation
 */
export function useApprovePropertyMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => approveProperty(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.all });
    },
  });
}

/**
 * Reject listing mutation
 */
export function useRejectPropertyMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      rejectProperty(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.all });
    },
  });
}

/**
 * Suspend listing mutation
 */
export function useSuspendPropertyMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      suspendProperty(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.all });
    },
  });
}

/**
 * Unsuspend listing mutation
 */
export function useUnsuspendPropertyMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      target,
    }: {
      id: string;
      target?: "PUBLISHED" | "ARCHIVED";
    }) => unsuspendProperty(id, target),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.all });
    },
  });
}

/**
 * Verify or revoke agent mutation
 */
export function useVerifyAgentMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: AgentVerificationInput;
    }) => verifyAgent(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.all });
    },
  });
}

/**
 * Agent application review queue (ADM-04)
 */
export const adminAgentApplicationsQuery = (status?: AgentApplicationStatus) =>
  queryOptions({
    queryKey: adminKeys.agentApplications(status),
    queryFn: ({ signal }) => fetchAdminAgentApplications(status ? { status } : undefined, signal),
  });

/**
 * Single agent application detail with KYC documents (ADM-04, Decision #56)
 */
export const adminAgentApplicationDetailQuery = (id: string) =>
  queryOptions({
    queryKey: adminKeys.agentApplicationDetail(id),
    queryFn: ({ signal }) => fetchAdminAgentApplication(id, signal),
    enabled: Boolean(id),
  });

/**
 * Review agent application mutation (APPROVE or REJECT) (ADM-05, Decision #57)
 */
export function useReviewAgentApplicationMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: AgentApplicationReviewInput;
    }) => reviewAdminAgentApplication(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.all });
    },
  });
}

/**
 * Revoke agent verification mutation (Decisions #52, #58)
 */
export function useRevokeAgentMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: AgentRevocationInput;
    }) => revokeAdminAgent(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.all });
    },
  });
}
