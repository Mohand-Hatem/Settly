import { api } from "./client";
import { unwrap } from "./errors";
import type { components } from "./v1.d.ts";

export type UserProfileResponse = components["schemas"]["UserProfileResponse"];
export type UpdateUserProfile = components["schemas"]["UpdateUserProfile"];
export type AgentProfileResponse = components["schemas"]["AgentProfileResponse"];
export type CreateOrUpdateAgentProfile = components["schemas"]["CreateOrUpdateAgentProfile"];
export type AgentApplicationSubmitInput = components["schemas"]["AgentApplicationSubmitInput"];
export type AgentApplicationItem = components["schemas"]["AgentApplicationItem"];
export type AccountDeletedResponse = components["schemas"]["AccountDeletedResponse"];

/**
 * Fetch authenticated user profile details from /api/v1/me.
 */
export async function fetchMyProfile(signal?: AbortSignal): Promise<UserProfileResponse> {
  return unwrap(await api.GET("/api/v1/me", { signal }));
}

/**
 * Update authenticated user profile attributes (name, phone, preferredLocale) on /api/v1/me.
 */
export async function updateMyProfile(
  body: UpdateUserProfile,
  signal?: AbortSignal
): Promise<UserProfileResponse> {
  return unwrap(await api.PATCH("/api/v1/me", { body, signal }));
}

/**
 * Delete and anonymize current account credentials and PII.
 */
export async function deleteMyAccount(signal?: AbortSignal): Promise<AccountDeletedResponse> {
  return unwrap(await api.DELETE("/api/v1/me", { signal }));
}

/**
 * Fetch agent credentials and brokerage details for AGENT/ADMIN users from /api/v1/me/agent-profile.
 */
export async function fetchMyAgentProfile(
  signal?: AbortSignal
): Promise<AgentProfileResponse | null> {
  try {
    return unwrap(await api.GET("/api/v1/me/agent-profile", { signal }));
  } catch {
    return null;
  }
}

/**
 * Create or update agent credentials and brokerage details on /api/v1/me/agent-profile.
 */
export async function saveMyAgentProfile(
  body: CreateOrUpdateAgentProfile,
  signal?: AbortSignal
): Promise<AgentProfileResponse> {
  return unwrap(await api.POST("/api/v1/me/agent-profile", { body, signal }));
}

/**
 * Fetch current user's latest agent accreditation application status (APP-03).
 * Returns null if 404 (no application submitted yet).
 */
export async function fetchMyAgentApplication(
  signal?: AbortSignal
): Promise<AgentApplicationItem | null> {
  try {
    return unwrap(await api.GET("/api/v1/me/agent-profile/application", { signal }));
  } catch (err: unknown) {
    if (err && typeof err === "object" && "status" in err && (err as { status: number }).status === 404) {
      return null;
    }
    throw err;
  }
}

/**
 * Submit self-service agent verification application with KYC credentials (APP-02, Decisions #49, #55, #56).
 */
export async function submitAgentApplication(
  body: AgentApplicationSubmitInput,
  signal?: AbortSignal
): Promise<AgentApplicationItem> {
  return unwrap(await api.POST("/api/v1/me/agent-profile/apply", { body, signal }));
}

/**
 * Switch the active user role between USER and AGENT for portfolio and testing perspective.
 */
export async function switchMyRole(
  role: "USER" | "AGENT",
  signal?: AbortSignal
): Promise<UserProfileResponse> {
  const res = await fetch("/api/v1/me/switch-role", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role }),
    signal,
  });
  if (!res.ok) {
    throw new Error("Failed to switch role");
  }
  return res.json();
}

