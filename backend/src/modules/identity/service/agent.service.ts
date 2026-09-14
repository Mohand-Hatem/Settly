import * as agentRepo from "../repository/agent.repository.js";
import type {
  AgentListItem,
  UserDeviceResponse,
  AgentVerificationInput,
  UserDeviceRegistrationInput,
} from "../schema/agent.schema.js";

/**
 * Agent & Device Domain Service
 * Coordinates verification lifecycle and device tokens without Prisma imports.
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
  return await agentRepo.verifyAgentProfile({
    agentProfileId,
    verified: verification.verified,
    adminUserId,
    notes: verification.notes,
  });
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
