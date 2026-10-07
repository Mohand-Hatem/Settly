import { prisma } from "../../../shared/database/prisma.js";
import { uuidv7 } from "uuidv7";
import type {
  AgentListItem,
  UserDeviceResponse,
  AgentApplicationItem,
  AgentApplicationDetail,
  AgentApplicationSubmitInput,
} from "../schema/agent.schema.js";
import type { DeviceType, AgentApplicationStatus, AgentProofType } from "@prisma/client";
import { conflictError, notFoundError } from "../../../shared/errors/problem-details.js";

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

export async function countPendingAgentVerifications(): Promise<number> {
  return await prisma.agentApplication.count({
    where: { status: "PENDING" },
  });
}

/**
 * Checks if an admin is personally involved in an application case (Decisions #67, #71).
 * An admin is personally involved if:
 * 1. Admin is the applicant themselves (self-review ban).
 * 2. Admin has an active offer, viewing, or conversation with the applicant or on applicant listings.
 */
export async function hasConflictOfInterest(
  adminUserId: string,
  applicantUserId: string
): Promise<boolean> {
  if (adminUserId === applicantUserId) return true;

  const [offerCount, viewingCount, conversationCount] = await Promise.all([
    prisma.offer.count({
      where: {
        OR: [
          { buyerId: adminUserId, property: { agentId: applicantUserId } },
          { buyerId: applicantUserId, property: { agentId: adminUserId } },
        ],
      },
    }),
    prisma.viewing.count({
      where: {
        OR: [
          { buyerId: adminUserId, agentId: applicantUserId },
          { buyerId: applicantUserId, agentId: adminUserId },
        ],
      },
    }),
    prisma.conversation.count({
      where: {
        OR: [
          { buyerId: adminUserId, agentId: applicantUserId },
          { buyerId: applicantUserId, agentId: adminUserId },
        ],
      },
    }),
  ]);

  return offerCount > 0 || viewingCount > 0 || conversationCount > 0;
}

function mapApplicationItem(raw: {
  id: string;
  userId: string;
  proofType: AgentProofType;
  proofDescription: string | null;
  licenseNumber: string;
  brokerageName: string | null;
  bioEn: string | null;
  bioAr: string | null;
  status: AgentApplicationStatus;
  rejectionReason: string | null;
  reviewedByUserId: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    image: string | null;
  };
}): AgentApplicationItem {
  return {
    id: raw.id,
    userId: raw.userId,
    proofType: raw.proofType,
    proofDescription: raw.proofDescription,
    licenseNumber: raw.licenseNumber,
    brokerageName: raw.brokerageName,
    bioEn: raw.bioEn,
    bioAr: raw.bioAr,
    status: raw.status,
    rejectionReason: raw.rejectionReason,
    reviewedByUserId: raw.reviewedByUserId,
    reviewedAt: raw.reviewedAt ? raw.reviewedAt.toISOString() : null,
    createdAt: raw.createdAt.toISOString(),
    updatedAt: raw.updatedAt.toISOString(),
    user: {
      id: raw.user.id,
      name: raw.user.name,
      email: raw.user.email,
      phone: raw.user.phone,
      image: raw.user.image,
    },
  };
}

export async function submitAgentApplication({
  userId,
  input,
}: {
  userId: string;
  input: AgentApplicationSubmitInput;
}): Promise<AgentApplicationItem> {
  return await prisma.$transaction(
    async (tx) => {
      // 1. Verify user exists and is not already a verified agent
      const user = await tx.user.findUnique({
        where: { id: userId },
        include: { agentProfile: true },
      });
      if (!user) {
        throw notFoundError("User", userId);
      }
      if (user.agentProfile?.isVerified) {
        throw conflictError(
          "/errors/agent-already-verified",
          "Agent Already Verified",
          "User is already a verified agent."
        );
      }

      // 2. Decision #74: Enforce at most ONE pending application per user
      const existingPending = await tx.agentApplication.findFirst({
        where: {
          userId,
          status: "PENDING",
        },
      });
      if (existingPending) {
        throw conflictError(
          "/errors/pending-application-exists",
          "Pending Application Exists",
          "You already have a pending agent application under review (Decision #74)."
        );
      }

      // 3. Create the application
      const applicationId = uuidv7();
      const created = await tx.agentApplication.create({
        data: {
          id: applicationId,
          userId,
          nationalIdUrl: input.nationalIdUrl,
          selfieUrl: input.selfieUrl,
          proofType: input.proofType,
          proofDocumentUrl: input.proofDocumentUrl,
          proofDescription: input.proofDescription || null,
          licenseNumber: input.licenseNumber,
          brokerageName: input.brokerageName || null,
          bioEn: input.bioEn || null,
          bioAr: input.bioAr || null,
          status: "PENDING",
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              image: true,
            },
          },
        },
      });

      // 4. Audit Log entry (ids and non-PII enums only per Decision #42)
      await tx.auditLog.create({
        data: {
          id: uuidv7(),
          actorType: "USER",
          actorId: userId,
          action: "AGENT_APPLICATION_SUBMITTED",
          entityType: "AgentApplication",
          entityId: applicationId,
          metadata: {
            proofType: input.proofType,
            licenseNumber: input.licenseNumber,
          },
        },
      });

      return mapApplicationItem(created);
    },
    { maxWait: 10000, timeout: 25000 }
  );
}

export async function getLatestApplicationByUserId(
  userId: string
): Promise<AgentApplicationItem | null> {
  const application = await prisma.agentApplication.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          image: true,
        },
      },
    },
  });

  if (!application) return null;
  return mapApplicationItem(application);
}

export async function getApplicationById(
  id: string
): Promise<AgentApplicationDetail | null> {
  const application = await prisma.agentApplication.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          image: true,
        },
      },
    },
  });

  if (!application) return null;

  const item = mapApplicationItem(application);
  return {
    ...item,
    nationalIdUrl: application.nationalIdUrl,
    selfieUrl: application.selfieUrl,
    proofDocumentUrl: application.proofDocumentUrl,
  };
}

export async function listAgentApplications(filters?: {
  status?: AgentApplicationStatus;
}): Promise<AgentApplicationItem[]> {
  const whereClause: { status?: AgentApplicationStatus } = {};
  if (filters?.status) {
    whereClause.status = filters.status;
  }

  const applications = await prisma.agentApplication.findMany({
    relationLoadStrategy: "join",
    where: whereClause,
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          image: true,
        },
      },
    },
  });

  return applications.map(mapApplicationItem);
}

export async function reviewAgentApplication({
  id,
  decision,
  rejectionReason,
  notes,
  adminUserId,
}: {
  id: string;
  decision: "APPROVED" | "REJECTED";
  rejectionReason?: string;
  notes?: string;
  adminUserId: string;
}): Promise<AgentApplicationItem> {
  return await prisma.$transaction(
    async (tx) => {
      const app = await tx.agentApplication.findUnique({
        where: { id },
        include: { user: true },
      });

      if (!app) {
        throw notFoundError("AgentApplication", id);
      }
      if (app.status !== "PENDING") {
        throw conflictError(
          "/errors/invalid-application-state",
          "Invalid Application State",
          "Application is not pending review."
        );
      }

      const now = new Date();

      if (decision === "APPROVED") {
        // 1. Mark application APPROVED
        await tx.agentApplication.update({
          where: { id },
          data: {
            status: "APPROVED",
            rejectionReason: null,
            reviewedByUserId: adminUserId,
            reviewedAt: now,
          },
        });

        // 2. Elevate user role to AGENT if currently USER
        if (app.user.role === "USER") {
          await tx.user.update({
            where: { id: app.userId },
            data: { role: "AGENT" },
          });
        }

        // 3. Upsert verified AgentProfile for user
        await tx.agentProfile.upsert({
          where: { userId: app.userId },
          update: {
            licenseNumber: app.licenseNumber,
            brokerageName: app.brokerageName,
            bioEn: app.bioEn,
            bioAr: app.bioAr,
            isVerified: true,
            verifiedAt: now,
          },
          create: {
            id: uuidv7(),
            userId: app.userId,
            licenseNumber: app.licenseNumber,
            brokerageName: app.brokerageName,
            bioEn: app.bioEn,
            bioAr: app.bioAr,
            isVerified: true,
            verifiedAt: now,
          },
        });

        // 4. Record AuditLog
        await tx.auditLog.create({
          data: {
            id: uuidv7(),
            actorType: "ADMIN",
            actorId: adminUserId,
            action: "AGENT_APPLICATION_APPROVED",
            entityType: "AgentApplication",
            entityId: id,
            metadata: {
              applicantUserId: app.userId,
              licenseNumber: app.licenseNumber,
              notes: notes || null,
            },
          },
        });
      } else {
        // REJECTED
        await tx.agentApplication.update({
          where: { id },
          data: {
            status: "REJECTED",
            rejectionReason: rejectionReason || "Application did not satisfy verification requirements.",
            reviewedByUserId: adminUserId,
            reviewedAt: now,
          },
        });

        await tx.auditLog.create({
          data: {
            id: uuidv7(),
            actorType: "ADMIN",
            actorId: adminUserId,
            action: "AGENT_APPLICATION_REJECTED",
            entityType: "AgentApplication",
            entityId: id,
            metadata: {
              applicantUserId: app.userId,
              reason: rejectionReason,
              notes: notes || null,
            },
          },
        });
      }

      // Re-fetch updated application
      const updated = await tx.agentApplication.findUniqueOrThrow({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              image: true,
            },
          },
        },
      });

      return mapApplicationItem(updated);
    },
    { maxWait: 10000, timeout: 25000 }
  );
}

export async function revokeAgentStatus({
  agentProfileId,
  adminUserId,
  notes,
}: {
  agentProfileId: string;
  adminUserId: string;
  notes?: string;
}): Promise<AgentListItem | null> {
  return await prisma.$transaction(
    async (tx) => {
      const existing = await tx.agentProfile.findUnique({
        where: { id: agentProfileId },
        include: { user: true },
      });

      if (!existing) return null;

      // 1. Revoke verification on profile
      const updated = await tx.agentProfile.update({
        where: { id: agentProfileId },
        data: {
          isVerified: false,
          verifiedAt: null,
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

      // 2. Revocation cascade (Decisions #52, #58):
      // Every listing of that agent except SOLD becomes suspended and hidden.
      const suspended = await tx.property.updateMany({
        where: {
          agentId: existing.userId,
          status: { in: ["PUBLISHED", "PENDING_REVIEW", "DRAFT"] },
        },
        data: {
          status: "SUSPENDED",
        },
      });

      // 3. Record AuditLog entry
      await tx.auditLog.create({
        data: {
          id: uuidv7(),
          actorType: "ADMIN",
          actorId: adminUserId,
          action: "AGENT_REVOKED",
          entityType: "AgentProfile",
          entityId: agentProfileId,
          metadata: {
            targetUserId: existing.userId,
            licenseNumber: existing.licenseNumber,
            suspendedPropertiesCount: suspended.count,
            notes: notes || null,
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
        verifiedAt: null,
        createdAt: updated.createdAt.toISOString(),
        user: {
          id: updated.user.id,
          name: updated.user.name,
          email: updated.user.email,
          image: updated.user.image,
        },
      };
    },
    { maxWait: 10000, timeout: 25000 }
  );
}

