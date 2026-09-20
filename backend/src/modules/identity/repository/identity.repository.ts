import { uuidv7 } from "uuidv7";
import { prisma } from "../../../shared/database/prisma.js";
import type { User, AgentProfile } from "@prisma/client";
import type { CreateOrUpdateAgentProfile, UpdateUserProfile } from "../schema/profile.schema.js";

export type UserRecord = User;
export type AgentProfileRecord = AgentProfile;

export class IdentityRepository {
  async findUserById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  async updateUser(id: string, data: UpdateUserProfile): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.preferredLocale !== undefined && { preferredLocale: data.preferredLocale }),
        ...(data.phone !== undefined && { phone: data.phone }),
      },
    });
  }

  async updateUserRole(id: string, role: "USER" | "AGENT" | "ADMIN"): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: { role },
    });
  }

  async deleteSession(sessionId: string): Promise<void> {
    await prisma.session.deleteMany({ where: { id: sessionId } });
  }

  async findAgentProfileByUserId(userId: string): Promise<AgentProfile | null> {
    return prisma.agentProfile.findUnique({
      where: { userId },
    });
  }

  async upsertAgentProfile(
    userId: string,
    data: CreateOrUpdateAgentProfile
  ): Promise<AgentProfile> {
    const existing = await this.findAgentProfileByUserId(userId);
    if (existing) {
      return prisma.agentProfile.update({
        where: { userId },
        data: {
          licenseNumber: data.licenseNumber,
          brokerageName: data.brokerageName,
          bioEn: data.bioEn,
          bioAr: data.bioAr,
        },
      });
    }

    return prisma.agentProfile.create({
      data: {
        id: uuidv7(),
        userId,
        licenseNumber: data.licenseNumber,
        brokerageName: data.brokerageName,
        bioEn: data.bioEn,
        bioAr: data.bioAr,
        isVerified: false,
      },
    });
  }
}

export const identityRepository = new IdentityRepository();
