import { prisma } from "../../../shared/database/prisma.js";
import { uuidv7 } from "uuidv7";
import type { AgentListItem, UserDeviceResponse } from "../schema/agent.schema.js";
import type { DeviceType } from "@prisma/client";

/**
 * Agent & Device Repository
 * Strictly isolates database access per BACKEND.md Section 4.
 */

export async function listAgents(filters?: { isVerified?: boolean }): Promise<AgentListItem[]> {
  const whereClause: { isVerified?: boolean } = {};
  if (typeof filters?.isVerified === "boolean") {
    whereClause.isVerified = filters.isVerified;
  }

  const profiles = await prisma.agentProfile.findMany({
    relationLoadStrategy: "join",
    where: whereClause,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return profiles.map((p) => ({
    id: p.id,
    userId: p.userId,
    licenseNumber: p.licenseNumber,
    brokerageName: p.brokerageName || "",
    bioEn: p.bioEn,
    bioAr: p.bioAr,
    isVerified: p.isVerified,
    verifiedAt: p.verifiedAt ? p.verifiedAt.toISOString() : null,
    createdAt: p.createdAt.toISOString(),
    user: {
      id: p.user.id,
      name: p.user.name,
      email: p.user.email,
      image: p.user.image,
    },
  }));
}

export async function getAgentProfileById(id: string): Promise<AgentListItem | null> {
  const profile = await prisma.agentProfile.findUnique({
    relationLoadStrategy: "join",
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
  });

  if (!profile) return null;

  return {
    id: profile.id,
    userId: profile.userId,
    licenseNumber: profile.licenseNumber,
    brokerageName: profile.brokerageName || "",
    bioEn: profile.bioEn,
    bioAr: profile.bioAr,
    isVerified: profile.isVerified,
    verifiedAt: profile.verifiedAt ? profile.verifiedAt.toISOString() : null,
    createdAt: profile.createdAt.toISOString(),
    user: {
      id: profile.user.id,
      name: profile.user.name,
      email: profile.user.email,
      image: profile.user.image,
    },
  };
}

export async function getAgentProfileByUserId(userId: string): Promise<AgentListItem | null> {
  const profile = await prisma.agentProfile.findUnique({
    relationLoadStrategy: "join",
    where: { userId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
  });

  if (!profile) return null;

  return {
    id: profile.id,
    userId: profile.userId,
    licenseNumber: profile.licenseNumber,
    brokerageName: profile.brokerageName || "",
    bioEn: profile.bioEn,
    bioAr: profile.bioAr,
    isVerified: profile.isVerified,
    verifiedAt: profile.verifiedAt ? profile.verifiedAt.toISOString() : null,
    createdAt: profile.createdAt.toISOString(),
    user: {
      id: profile.user.id,
      name: profile.user.name,
      email: profile.user.email,
      image: profile.user.image,
    },
  };
}

export async function verifyAgentProfile({
  agentProfileId,
  verified,
  adminUserId,
  notes,
}: {
  agentProfileId: string;
  verified: boolean;
  adminUserId: string;
  notes?: string;
}): Promise<AgentListItem | null> {
  return await prisma.$transaction(async (tx) => {
    const existing = await tx.agentProfile.findUnique({
      where: { id: agentProfileId },
      include: {
        user: true,
      },
    });

    if (!existing) return null;

    const now = new Date();
    const updated = await tx.agentProfile.update({
      where: { id: agentProfileId },
      data: {
        isVerified: verified,
        verifiedAt: verified ? now : null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    // Write immutable AuditLog entry (Decision #42)
    await tx.auditLog.create({
      data: {
        id: uuidv7(),
        actorType: "ADMIN",
        actorId: adminUserId,
        action: verified ? "AGENT_VERIFIED" : "AGENT_REVOKED",
        entityType: "AgentProfile",
        entityId: agentProfileId,
        metadata: {
          notes: notes || null,
          targetUserId: existing.userId,
          licenseNumber: existing.licenseNumber,
          isVerified: verified,
        },
      },
    });

    return {
      id: updated.id,
      userId: updated.userId,
      licenseNumber: updated.licenseNumber,
      brokerageName: updated.brokerageName || "",
      bioEn: updated.bioEn,
      bioAr: updated.bioAr,
      isVerified: updated.isVerified,
      verifiedAt: updated.verifiedAt ? updated.verifiedAt.toISOString() : null,
      createdAt: updated.createdAt.toISOString(),
      user: {
        id: updated.user.id,
        name: updated.user.name,
        email: updated.user.email,
        image: updated.user.image,
      },
    };
  });
}

export async function upsertUserDevice({
  userId,
  token,
  platform,
}: {
  userId: string;
  token: string;
  platform: "IOS" | "ANDROID" | "WEB";
}): Promise<UserDeviceResponse> {
  const deviceType = platform as DeviceType;

  const device = await prisma.userDevice.upsert({
    where: { fcmToken: token },
    update: {
      userId,
      deviceType,
      updatedAt: new Date(),
    },
    create: {
      id: uuidv7(),
      userId,
      fcmToken: token,
      deviceType,
    },
  });

  return {
    id: device.id,
    userId: device.userId,
    token: device.fcmToken,
    platform: device.deviceType,
    createdAt: device.createdAt.toISOString(),
  };
}

export async function deleteUserDevice(userId: string, token: string): Promise<boolean> {
  const result = await prisma.userDevice.deleteMany({
    where: {
      userId,
      fcmToken: token,
    },
  });
  return result.count > 0;
}
