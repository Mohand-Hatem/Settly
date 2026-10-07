import { api } from "./client";
import { unwrap } from "./errors";
import type { components } from "./v1.d.ts";

export type AdminStatsResponse = components["schemas"]["AdminStatsResponse"];
export type PropertyResponse = components["schemas"]["PropertyResponse"];
export type PropertyListResponse = components["schemas"]["PropertyListResponse"];
export type PropertyStatus = components["schemas"]["PropertyStatus"];
export type AgentListItem = components["schemas"]["AgentListItem"];
export type AgentListResponse = components["schemas"]["AgentListResponse"];
export type AgentVerificationInput = components["schemas"]["AgentVerificationInput"];
export type ActionReasonInput = components["schemas"]["ActionReason"];
export type AgentApplicationItem = components["schemas"]["AgentApplicationItem"];
export type AgentApplicationStatus = AgentApplicationItem["status"];
export type AgentApplicationDetail = components["schemas"]["AgentApplicationDetail"];
export type AgentApplicationListResponse = components["schemas"]["AgentApplicationListResponse"];
export type AgentApplicationReviewInput = components["schemas"]["AgentApplicationReviewInput"];
export type AgentRevocationInput = components["schemas"]["AgentRevocationInput"];

/**
 * Fetch operational dashboard stats (ADM-01, Decision #28)
 */
export async function fetchAdminStats(): Promise<AdminStatsResponse> {
  return unwrap(await api.GET("/api/v1/admin/stats"));
}

/**
 * List moderation queue properties (ADM-02)
 */
export async function fetchAdminProperties(params?: {
  status?: PropertyStatus;
  cursor?: string;
  limit?: number;
}): Promise<PropertyListResponse> {
  return unwrap(
    await api.GET("/api/v1/admin/properties", {
      params: {
        query: {
          status: params?.status,
          cursor: params?.cursor,
          limit: params?.limit,
        },
      },
    })
  );
}

/**
 * Approve a listing for publication (P3, Decision #94)
 */
export async function approveProperty(id: string): Promise<PropertyResponse> {
  return unwrap(
    await api.POST("/api/v1/admin/properties/{id}/approve", {
      params: { path: { id } },
    })
  );
}

/**
 * Reject a listing with required reason (P4)
 */
export async function rejectProperty(id: string, reason: string): Promise<PropertyResponse> {
  return unwrap(
    await api.POST("/api/v1/admin/properties/{id}/reject", {
      params: { path: { id } },
      body: { reason },
    })
  );
}

/**
 * Suspend a listing (P12)
 */
export async function suspendProperty(id: string, reason: string): Promise<PropertyResponse> {
  return unwrap(
    await api.POST("/api/v1/admin/properties/{id}/suspend", {
      params: { path: { id } },
      body: { reason },
    })
  );
}

/**
 * Reinstate a suspended listing (P13)
 */
export async function unsuspendProperty(
  id: string,
  target: "PUBLISHED" | "ARCHIVED" = "PUBLISHED"
): Promise<PropertyResponse> {
  return unwrap(
    await api.POST("/api/v1/admin/properties/{id}/unsuspend", {
      params: { path: { id }, query: { target } },
    })
  );
}

/**
 * List agent verification applications (ADM-04)
 */
export async function fetchAdminAgents(params?: {
  verified?: "true" | "false";
}): Promise<AgentListResponse> {
  return unwrap(
    await api.GET("/api/v1/admin/agents", {
      params: {
        query: {
          verified: params?.verified,
        },
      },
    })
  );
}

/**
 * Get single agent profile detail for review (ADM-04)
 */
export async function fetchAdminAgentDetail(id: string): Promise<AgentListItem> {
  return unwrap(
    await api.GET("/api/v1/admin/agents/{id}", {
      params: { path: { id } },
    })
  );
}

/**
 * Approve or revoke agent verification (ADM-04, ADM-05)
 */
export async function verifyAgent(
  id: string,
  input: AgentVerificationInput
): Promise<AgentListItem> {
  return unwrap(
    await api.POST("/api/v1/admin/agents/{id}/verify", {
      params: { path: { id } },
      body: input,
    })
  );
}

/**
 * List agent verification applications with optional status filter (ADM-04)
 */
export async function fetchAdminAgentApplications(
  params?: { status?: AgentApplicationStatus },
  signal?: AbortSignal
): Promise<AgentApplicationListResponse> {
  return unwrap(
    await api.GET("/api/v1/admin/agent-applications", {
      params: { query: params },
      signal,
    })
  );
}

/**
 * Get full agent verification application details including KYC document previews (ADM-04, Decision #56)
 */
export async function fetchAdminAgentApplication(
  id: string,
  signal?: AbortSignal
): Promise<AgentApplicationDetail> {
  return unwrap(
    await api.GET("/api/v1/admin/agent-applications/{id}", {
      params: { path: { id } },
      signal,
    })
  );
}

/**
 * Review agent verification application: APPROVE or REJECT with reason (ADM-05, Decision #57)
 */
export async function reviewAdminAgentApplication(
  id: string,
  body: AgentApplicationReviewInput
): Promise<AgentApplicationItem> {
  return unwrap(
    await api.POST("/api/v1/admin/agent-applications/{id}/review", {
      params: { path: { id } },
      body,
    })
  );
}

/**
 * Revoke verified agent accreditation and cascade suspension (Decisions #52, #58)
 */
export async function revokeAdminAgent(
  id: string,
  body: AgentRevocationInput
): Promise<AgentListItem> {
  return unwrap(
    await api.POST("/api/v1/admin/agents/{id}/revoke", {
      params: { path: { id } },
      body,
    })
  );
}
