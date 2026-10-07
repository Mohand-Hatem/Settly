import { uuidv7 } from "uuidv7";
import { prisma } from "../../../shared/database/prisma.js";
import { notFoundError } from "../../../shared/errors/problem-details.js";
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

  async pruneExpiredSessions(now = new Date()): Promise<number> {
    const result = await prisma.session.deleteMany({
      where: { expiresAt: { lte: now } },
    });
    return result.count;
  }

  /**
   * Anonymizes user account per BUSINESS_RULES §11 and SECURITY.md §13 (GDPR erasure).
   * Overwrites PII in place, strips credentials and personal engagement data,
   * sets banned=true and anonymizedAt=now(), preserving transactional audit history.
   */
  async anonymizeUser(userId: string): Promise<User> {
    return prisma.$transaction(
      async (tx) => {
        const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw notFoundError("User", userId);
      }
      if (user.anonymizedAt) {
        return user; // Already anonymized (idempotent)
      }

      // 1. Delete credentials & sessions (Better Auth)
      await tx.account.deleteMany({ where: { userId } });
      await tx.session.deleteMany({ where: { userId } });

      // 2. Delete user devices & push tokens
      await tx.userDevice.deleteMany({ where: { userId } });

      // 3. Delete AI conversations & messages, agent runs
      await tx.aiConversation.deleteMany({ where: { userId } });
      await tx.agentRun.deleteMany({ where: { userId } });

      // 4. Delete saved searches and collections
      await tx.savedSearch.deleteMany({ where: { userId } });
      await tx.collection.deleteMany({ where: { userId } });

      // 5. Delete notifications
      await tx.notification.deleteMany({ where: { userId } });

      // 6. Wipe agent profile details if an agent
      await tx.agentProfile.updateMany({
        where: { userId },
        data: {
          licenseNumber: "ANONYMIZED",
          brokerageName: "Former Agent",
          bioEn: null,
          bioAr: null,
          isVerified: false,
        },
      });

      // 7. Clear any active checkout holds on properties
      await tx.property.updateMany({
        where: { checkoutHoldUserId: userId },
        data: {
          checkoutHoldExpiresAt: null,
          checkoutHoldUserId: null,
        },
      });

      // 8. Overwrite User row PII in place
      const anonymizedEmail = `anonymized_${userId}@deleted.settly.estate`;
      const updated = await tx.user.update({
        where: { id: userId },
        data: {
          name: "Former User",
          email: anonymizedEmail,
          phone: null,
          image: null,
          banned: true,
          banReason: "Account deleted and anonymized per user request",
          anonymizedAt: new Date(),
        },
      });

      return updated;
      },
      { maxWait: 10000, timeout: 25000 }
    );
  }
}

export const identityRepository = new IdentityRepository();
