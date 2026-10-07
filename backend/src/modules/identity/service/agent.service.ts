import * as agentRepo from "../repository/agent.repository.js";
import { notificationService } from "../../notifications/service/index.js";
import { forbiddenError, notFoundError } from "../../../shared/errors/problem-details.js";
import type {
  AgentListItem,
  UserDeviceResponse,
  AgentVerificationInput,
  UserDeviceRegistrationInput,
  AgentApplicationItem,
  AgentApplicationDetail,
  AgentApplicationSubmitInput,
  AgentApplicationReviewInput,
  AgentApplicationStatus,
} from "../schema/agent.schema.js";

/**
 * Agent & Device Domain Service
 * Coordinates verification lifecycle, self-service applications, and notifications.
 */

export async function getAgentsList(filters?: { isVerified?: boolean }): Promise<AgentListItem[]> {
  return await agentRepo.listAgents(filters);
}

export async function getAgentDetails(id: string): Promise<AgentListItem | null> {
  return await agentRepo.getAgentProfileById(id);
}

export async function getAgentByUserId(userId: string): Promise<AgentListItem | null> {
  return await agentRepo.getAgentProfileByUserId(userId);
}

export async function processAgentVerification({
  agentProfileId,
  verification,
  adminUserId,
}: {
  agentProfileId: string;
  verification: AgentVerificationInput;
  adminUserId: string;
}): Promise<AgentListItem | null> {
  if (verification.verified) {
    return await agentRepo.verifyAgentProfile({
      agentProfileId,
      verified: true,
      adminUserId,
      notes: verification.notes,
    });
  } else {
    return await revokeAgentVerification({
      agentProfileId,
      adminUserId,
      notes: verification.notes,
    });
  }
}

export async function revokeAgentVerification({
  agentProfileId,
  adminUserId,
  notes,
}: {
  agentProfileId: string;
  adminUserId: string;
  notes?: string;
}): Promise<AgentListItem | null> {
  const profile = await agentRepo.getAgentProfileById(agentProfileId);
  if (!profile) return null;

  // Conflict of Interest check (#67, #71)
  const isConflict = await agentRepo.hasConflictOfInterest(adminUserId, profile.userId);
  if (isConflict) {
    throw forbiddenError(
      "Admin is personally involved with this agent (Decision #67, #71). Another administrator must handle revocation.",
      `/api/v1/admin/agents/${agentProfileId}/verify`
    );
  }

  const result = await agentRepo.revokeAgentStatus({
    agentProfileId,
    adminUserId,
    notes,
  });

  if (result) {
    void notificationService.notifyUser({
      userId: profile.userId,
      type: "AGENT_VERIFICATION_REVOKED",
      params: {
        title: "Agent Verification Revoked",
        body: `Your agent verification status has been revoked. Reason: ${notes || "Administrative decision"}. Active listings have been suspended (Decisions #52, #58).`,
        actionUrl: "/buyer",
        notes,
      },
      sendEmail: true,
    }).catch(() => {});
  }

  return result;
}

export async function submitAgentApplication(
  userId: string,
  input: AgentApplicationSubmitInput
): Promise<AgentApplicationItem> {
  return await agentRepo.submitAgentApplication({ userId, input });
}

export async function getMyAgentApplication(
  userId: string
): Promise<AgentApplicationItem | null> {
  return await agentRepo.getLatestApplicationByUserId(userId);
}

export async function listAgentApplications(filters?: {
  status?: AgentApplicationStatus;
}): Promise<AgentApplicationItem[]> {
  return await agentRepo.listAgentApplications(filters);
}

export async function getAgentApplicationDetails(
  id: string,
  adminUserId: string
): Promise<AgentApplicationDetail | null> {
  const app = await agentRepo.getApplicationById(id);
  if (!app) return null;

  return app;
}

export async function reviewAgentApplication({
  id,
  input,
  adminUserId,
}: {
  id: string;
  input: AgentApplicationReviewInput;
  adminUserId: string;
}): Promise<AgentApplicationItem> {
  const app = await agentRepo.getApplicationById(id);
  if (!app) {
    throw notFoundError("AgentApplication", id);
  }

  // Conflict of Interest check (#67, #71)
  const isConflict = await agentRepo.hasConflictOfInterest(adminUserId, app.userId);
  if (isConflict) {
    throw forbiddenError(
      "Admin is personally involved with this applicant (Decision #67, #71). Another administrator must handle this review.",
      `/api/v1/admin/agent-applications/${id}/review`
    );
  }

  const updated = await agentRepo.reviewAgentApplication({
    id,
    decision: input.decision,
    rejectionReason: input.rejectionReason,
    notes: input.notes,
    adminUserId,
  });

  // Dispatch real-time and email notification
  if (input.decision === "APPROVED") {
    void notificationService.notifyUser({
      userId: updated.userId,
      type: "AGENT_APPLICATION_APPROVED",
      params: {
        title: "Agent Application Approved! 🎉",
        body: "Congratulations! Your agent verification application has been approved. You now have full access to the Agent Portal.",
        actionUrl: "/agent",
      },
      sendEmail: true,
    }).catch(() => {});
  } else {
    void notificationService.notifyUser({
      userId: updated.userId,
      type: "AGENT_APPLICATION_REJECTED",
      params: {
        title: "Agent Application Update",
        body: `Your agent application was not approved. Reason: ${input.rejectionReason}`,
        rejectionReason: input.rejectionReason,
        actionUrl: "/buyer/become-agent",
      },
      sendEmail: true,
    }).catch(() => {});
  }

  return updated;
}

export async function registerDeviceToken({
  userId,
  input,
}: {
  userId: string;
  input: UserDeviceRegistrationInput;
}): Promise<UserDeviceResponse> {
  return await agentRepo.upsertUserDevice({
    userId,
    token: input.token,
    platform: input.platform,
  });
}

export async function removeDeviceToken(userId: string, token: string): Promise<boolean> {
  return await agentRepo.deleteUserDevice(userId, token);
}

export async function countPendingAgentVerifications(): Promise<number> {
  return await agentRepo.countPendingAgentVerifications();
}

