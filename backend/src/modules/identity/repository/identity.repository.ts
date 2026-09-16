import { uuidv7 } from "uuidv7";
import { prisma } from "../../../shared/database/prisma.js";
import type { User, AgentProfile, Verification } from "@prisma/client";
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
      },
    });
  }

  async findUnexpiredVerification(
    identifier: string,
    value: string,
    now: Date
  ): Promise<Verification | null> {
    return prisma.verification.findFirst({
      where: {
        identifier,
        value,
        expiresAt: { gt: now },
      },
    });
  }

  async markEmailVerified(email: string): Promise<void> {
    await prisma.user.updateMany({
      where: { email },
      data: { emailVerified: true },
    });
  }

  async deleteVerification(id: string): Promise<void> {
    await prisma.verification.delete({
      where: { id },
    });
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
