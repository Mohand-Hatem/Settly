import {
  identityRepository,
  IdentityRepository,
  type UserRecord,
  type AgentProfileRecord,
} from "../repository/identity.repository.js";
import type {
  UserProfileResponse,
  UpdateUserProfile,
  AgentProfileResponse,
  CreateOrUpdateAgentProfile,
} from "../schema/profile.schema.js";
import { notFoundError } from "../../../shared/errors/problem-details.js";

function mapUserToProfile(user: UserRecord): UserProfileResponse {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    emailVerified: user.emailVerified,
    image: user.image,
    role: user.role as "USER" | "AGENT" | "ADMIN",
    preferredLocale: (user.preferredLocale as "en" | "ar") ?? null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

function mapAgentProfileToResponse(profile: AgentProfileRecord): AgentProfileResponse {
  return {
    id: profile.id,
    userId: profile.userId,
    licenseNumber: profile.licenseNumber,
    brokerageName: profile.brokerageName,
    bioEn: profile.bioEn,
    bioAr: profile.bioAr,
    isVerified: profile.isVerified,
    verifiedAt: profile.verifiedAt?.toISOString() ?? null,
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
  };
}

export class IdentityService {
  constructor(private readonly repo: IdentityRepository = identityRepository) {}

  async getUserProfile(userId: string): Promise<UserProfileResponse> {
    const user = await this.repo.findUserById(userId);
    if (!user) {
      throw notFoundError("User", userId);
    }
    return mapUserToProfile(user);
  }

  async updateUserProfile(
    userId: string,
    data: UpdateUserProfile
  ): Promise<UserProfileResponse> {
    const user = await this.repo.findUserById(userId);
    if (!user) {
      throw notFoundError("User", userId);
    }
    const updated = await this.repo.updateUser(userId, data);
    return mapUserToProfile(updated);
  }

  /**
   * Consumes a 6-digit email verification OTP. Returns false when no unexpired
   * matching verification row exists; there is no bypass code.
   */
  async verifyEmailOtp(email: string, code: string): Promise<boolean> {
    const record = await this.repo.findUnexpiredVerification(email, code, new Date());
    if (!record) {
      return false;
    }

    await this.repo.markEmailVerified(email);
    await this.repo.deleteVerification(record.id);
    return true;
  }

  async getAgentProfile(userId: string): Promise<AgentProfileResponse> {
    const profile = await this.repo.findAgentProfileByUserId(userId);
    if (!profile) {
      throw notFoundError("AgentProfile", userId);
    }
    return mapAgentProfileToResponse(profile);
  }

  async upsertAgentProfile(
    userId: string,
    data: CreateOrUpdateAgentProfile
  ): Promise<AgentProfileResponse> {
    const profile = await this.repo.upsertAgentProfile(userId, data);
    return mapAgentProfileToResponse(profile);
  }
}

export const identityService = new IdentityService();
