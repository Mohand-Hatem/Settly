import * as propertyRepo from "../repository/property.repository.js";
import { areaService } from "./area.service.js";
import { getAgentByUserId } from "../../identity/service/agent.service.js";
import {
  conflictError,
  forbiddenError,
  notFoundError,
  ProblemError,
} from "../../../shared/errors/problem-details.js";
import type {
  CreatePropertyInput,
  UpdatePropertyInput,
  PropertyResponse,
  PropertyListResponse,
} from "../schema/property.schema.js";

/**
 * Structural field list governed by BUSINESS_RULES.md Section 2.1 (Two-Tier Edit Moderation)
 * Editing any structural field demotes a PUBLISHED listing to PENDING_REVIEW.
 */
const STRUCTURAL_FIELDS: (keyof UpdatePropertyInput)[] = [
  "titleEn",
  "titleAr",
  "propertyType",
  "listingIntent",
  "areaId",
  "latitude",
  "longitude",
];

// ==============================================================================
// 1. P1: Create Draft Listing
// ==============================================================================

export async function createDraft(
  agentId: string,
  input: CreatePropertyInput
): Promise<PropertyResponse> {
  // Verify area exists
  const area = await areaService.getAreaById(input.areaId);
  if (!area) {
    throw notFoundError("Area", input.areaId);
  }

  return await propertyRepo.createProperty(agentId, input);
}

// ==============================================================================
// 2. Read Operations
// ==============================================================================

export async function getPropertyById(id: string): Promise<PropertyResponse> {
  const prop = await propertyRepo.getPropertyById(id);
  if (!prop) {
    throw notFoundError("Property", id);
  }
  return prop;
}

export async function getPropertyOwnerOrThrow(id: string) {
  const prop = await propertyRepo.getPropertyOwner(id);
  if (!prop) {
    throw notFoundError("Property", id);
  }
  return prop;
}

export async function getPropertyBySlug(slug: string): Promise<PropertyResponse> {
  const prop = await propertyRepo.getPropertyBySlug(slug);
  if (!prop) {
    throw notFoundError("Property", slug);
  }
  return prop;
}

export async function listAgentProperties(
  agentId: string,
  options?: { cursor?: string; limit?: number }
): Promise<PropertyListResponse> {
  return await propertyRepo.listPropertiesByAgent(agentId, options);
}

export async function listPublicProperties(options?: {
  cursor?: string;
  limit?: number;
}): Promise<PropertyListResponse> {
  return await propertyRepo.listPublishedProperties(options);
}

// ==============================================================================
// 3. P2 & P5: Submit / Resubmit for Review
// ==============================================================================

export async function submitForReview(
  agentId: string,
  propertyId: string
): Promise<PropertyResponse> {
  const raw = await propertyRepo.getRawPropertyById(propertyId);
  if (!raw) {
    throw notFoundError("Property", propertyId);
  }

  if (raw.agentId !== agentId) {
    throw forbiddenError("You do not own this property listing.");
  }

  if (raw.status !== "DRAFT" && raw.status !== "REJECTED") {
    throw conflictError(
      "/errors/invalid-lifecycle-transition",
      "Invalid Property Transition",
      `Cannot submit property in '${raw.status}' state for review. Expected 'DRAFT' or 'REJECTED'.`
    );
  }

  // Guard 1: Agent must be verified per BUSINESS_RULES.md P2
  const agentProfile = await getAgentByUserId(agentId);
  if (!agentProfile || !agentProfile.isVerified) {
    throw new ProblemError({
      type: "/errors/agent-not-verified",
      title: "Agent Not Verified",
      status: 403,
      detail: "Only verified real estate agents may submit properties for publication review.",
      params: {
        isVerified: false,
      },
    });
  }

  // Guard 2: Required fields complete
  if (!raw.titleEn && !raw.titleAr) {
    throw new ProblemError({
      type: "/errors/incomplete-listing",
      title: "Incomplete Listing",
      status: 422,
      detail: "Property must have at least an English or Arabic title.",
    });
  }
  if (!raw.descriptionEn && !raw.descriptionAr) {
    throw new ProblemError({
      type: "/errors/incomplete-listing",
      title: "Incomplete Listing",
      status: 422,
      detail: "Property must have at least an English or Arabic description.",
    });
  }

  // Guard 3: Minimum 3 images required per BUSINESS_RULES.md P2
  const imageCount = raw._count?.images ?? 0;
  if (imageCount < 3) {
    throw new ProblemError({
      type: "/errors/insufficient-images",
      title: "Insufficient Images",
      status: 422,
      detail: `Property submission requires at least 3 images. Current count: ${imageCount}.`,
      params: {
        required: 3,
        current: imageCount,
      },
    });
  }

  const action = raw.status === "REJECTED" ? "PROPERTY_RESUBMITTED" : "PROPERTY_SUBMITTED";

  return await propertyRepo.transitionPropertyStatus({
    propertyId,
    newStatus: "PENDING_REVIEW",
    actorId: agentId,
    actorType: "AGENT",
    action,
    expectedStatus: ["DRAFT", "REJECTED"],
    previousStatus: raw.status,
  });
}

// ==============================================================================
// 4. P3 & P4: Admin Moderation (Approve / Reject)
// ==============================================================================

export async function approveProperty(
  adminId: string,
  propertyId: string
): Promise<PropertyResponse> {
  const raw = await propertyRepo.getRawPropertyById(propertyId);
  if (!raw) {
    throw notFoundError("Property", propertyId);
  }

  if (raw.status !== "PENDING_REVIEW") {
    throw conflictError(
      "/errors/invalid-lifecycle-transition",
      "Invalid Property Transition",
      `Cannot approve property in '${raw.status}' state. Expected 'PENDING_REVIEW'.`
    );
  }

  return await propertyRepo.transitionPropertyStatus({
    propertyId,
    newStatus: "PUBLISHED",
    actorId: adminId,
    actorType: "ADMIN",
    action: "PROPERTY_APPROVED",
    expectedStatus: "PENDING_REVIEW",
    previousStatus: "PENDING_REVIEW",
    setPublishedAt: !raw.publishedAt,
  });
}

export async function rejectProperty(
  adminId: string,
  propertyId: string,
  reason: string
): Promise<PropertyResponse> {
  const raw = await propertyRepo.getRawPropertyById(propertyId);
  if (!raw) {
    throw notFoundError("Property", propertyId);
  }

  if (raw.status !== "PENDING_REVIEW") {
    throw conflictError(
      "/errors/invalid-lifecycle-transition",
      "Invalid Property Transition",
      `Cannot reject property in '${raw.status}' state. Expected 'PENDING_REVIEW'.`
    );
  }

  return await propertyRepo.transitionPropertyStatus({
    propertyId,
    newStatus: "REJECTED",
    actorId: adminId,
    actorType: "ADMIN",
    action: "PROPERTY_REJECTED",
    reason,
    expectedStatus: "PENDING_REVIEW",
    previousStatus: "PENDING_REVIEW",
  });
}

// ==============================================================================
// 5. P6: Two-Tier Edit Moderation
// ==============================================================================

export async function editProperty(
  agentId: string,
  propertyId: string,
  data: UpdatePropertyInput
): Promise<PropertyResponse> {
  const raw = await propertyRepo.getRawPropertyById(propertyId);
  if (!raw) {
    throw notFoundError("Property", propertyId);
  }

  if (raw.agentId !== agentId) {
    throw forbiddenError("You do not own this property listing.");
  }

  if (raw.status === "SOLD" || raw.status === "RENTED") {
    throw conflictError(
      "/errors/terminal-state",
      "Terminal Listing State",
      "Properties marked as SOLD or RENTED cannot be modified."
    );
  }

  if (raw.status === "SUSPENDED") {
    throw forbiddenError("Agent modifications are blocked while property is SUSPENDED.");
  }

  // Validate area if changing areaId
  if (data.areaId && data.areaId !== raw.areaId) {
    const area = await areaService.getAreaById(data.areaId);
    if (!area) {
      throw notFoundError("Area", data.areaId);
    }
  }

  // Two-tier check if currently PUBLISHED
  let newStatus: "PENDING_REVIEW" | undefined = undefined;

  if (raw.status === "PUBLISHED") {
    const hasStructuralChange = STRUCTURAL_FIELDS.some(
      (field) => data[field] !== undefined
    );

    if (hasStructuralChange) {
      // Demote to PENDING_REVIEW per BUSINESS_RULES.md Section 2.1
      newStatus = "PENDING_REVIEW";
    }
  }

  return await propertyRepo.updateProperty(
    propertyId,
    agentId,
    data,
    newStatus,
    raw.status,
    raw.price
  );
}

// ==============================================================================
// 6. P7: Archive Listing
// ==============================================================================

export async function archiveProperty(
  agentId: string,
  propertyId: string
): Promise<PropertyResponse> {
  const raw = await propertyRepo.getRawPropertyById(propertyId);
  if (!raw) {
    throw notFoundError("Property", propertyId);
  }

  if (raw.agentId !== agentId) {
    throw forbiddenError("You do not own this property listing.");
  }

  if (raw.status !== "PUBLISHED") {
    throw conflictError(
      "/errors/invalid-lifecycle-transition",
      "Invalid Property Transition",
      `Cannot archive property in '${raw.status}' state. Expected 'PUBLISHED'.`
    );
  }

  // Guard: No RESERVED offer outstanding per BUSINESS_RULES.md P7
  const hasReservedOffer = raw.offers.some((o) => o.status === "RESERVED");
  if (hasReservedOffer) {
    throw conflictError(
      "/errors/active-reservation",
      "Active Reservation Outstanding",
      "Cannot archive a listing with an active reservation hold or offer."
    );
  }

  return await propertyRepo.transitionPropertyStatus({
    propertyId,
    newStatus: "ARCHIVED",
    actorId: agentId,
    actorType: "AGENT",
    action: "PROPERTY_ARCHIVED",
    expectedStatus: "PUBLISHED",
    previousStatus: "PUBLISHED",
  });
}

// ==============================================================================
// 7. P9 & P11: Mark Sold / Offline Sale
// ==============================================================================

export async function markSold(
  agentId: string,
  propertyId: string
): Promise<PropertyResponse> {
  const raw = await propertyRepo.getRawPropertyById(propertyId);
  if (!raw) {
    throw notFoundError("Property", propertyId);
  }

  if (raw.agentId !== agentId) {
    throw forbiddenError("You do not own this property listing.");
  }

  if (raw.status !== "RESERVED") {
    throw conflictError(
      "/errors/invalid-lifecycle-transition",
      "Invalid Property Transition",
      `Agent can only confirm sale from 'RESERVED' state. Current: '${raw.status}'. For offline sale from PUBLISHED, use /sell.`
    );
  }

  return await propertyRepo.transitionPropertyStatus({
    propertyId,
    newStatus: "SOLD",
    actorId: agentId,
    actorType: "AGENT",
    action: "PROPERTY_SOLD_CONFIRMED",
    expectedStatus: "RESERVED",
    previousStatus: "RESERVED",
  });
}

export async function offlineSale(
  agentId: string,
  propertyId: string,
  reason: string
): Promise<PropertyResponse> {
  const raw = await propertyRepo.getRawPropertyById(propertyId);
  if (!raw) {
    throw notFoundError("Property", propertyId);
  }

  if (raw.agentId !== agentId) {
    throw forbiddenError("You do not own this property listing.");
  }

  if (raw.status !== "PUBLISHED") {
    throw conflictError(
      "/errors/invalid-lifecycle-transition",
      "Invalid Property Transition",
      `Offline sale escape hatch applies only to 'PUBLISHED' properties. Current: '${raw.status}'.`
    );
  }

  return await propertyRepo.transitionPropertyStatus({
    propertyId,
    newStatus: "SOLD",
    actorId: agentId,
    actorType: "AGENT",
    action: "PROPERTY_OFFLINE_SALE",
    reason,
    expectedStatus: "PUBLISHED",
    previousStatus: "PUBLISHED",
  });
}

// ==============================================================================
// 8. P10: Fall Through (RESERVED -> PUBLISHED)
// ==============================================================================

export async function fallThrough(
  actorId: string,
  actorType: "AGENT" | "ADMIN",
  propertyId: string,
  reason: string
): Promise<PropertyResponse> {
  const raw = await propertyRepo.getRawPropertyById(propertyId);
  if (!raw) {
    throw notFoundError("Property", propertyId);
  }

  if (actorType === "AGENT" && raw.agentId !== actorId) {
    throw forbiddenError("You do not own this property listing.");
  }

  if (raw.status !== "RESERVED") {
    throw conflictError(
      "/errors/invalid-lifecycle-transition",
      "Invalid Property Transition",
      `Fall-through can only be executed on 'RESERVED' listings. Current: '${raw.status}'.`
    );
  }

  return await propertyRepo.transitionPropertyStatus({
    propertyId,
    newStatus: "PUBLISHED",
    actorId,
    actorType,
    action: "PROPERTY_FELL_THROUGH",
    reason,
    expectedStatus: "RESERVED",
    previousStatus: "RESERVED",
  });
}

// ==============================================================================
// 9. P12 & P13: Admin Suspension / Unsuspension
// ==============================================================================

export async function suspendProperty(
  adminId: string,
  propertyId: string,
  reason: string
): Promise<PropertyResponse> {
  const raw = await propertyRepo.getRawPropertyById(propertyId);
  if (!raw) {
    throw notFoundError("Property", propertyId);
  }

  if (raw.status === "SOLD") {
    throw conflictError(
      "/errors/terminal-state",
      "Terminal Listing State",
      "Cannot suspend a property that is already SOLD."
    );
  }

  return await propertyRepo.transitionPropertyStatus({
    propertyId,
    newStatus: "SUSPENDED",
    actorId: adminId,
    actorType: "ADMIN",
    action: "PROPERTY_SUSPENDED",
    reason,
    expectedStatus: [
      "DRAFT",
      "PENDING_REVIEW",
      "REJECTED",
      "PUBLISHED",
      "RESERVED",
      "RENTED",
      "ARCHIVED",
    ],
    previousStatus: raw.status,
  });
}

export async function unsuspendProperty(
  adminId: string,
  propertyId: string,
  targetStatus: "PUBLISHED" | "ARCHIVED" = "PUBLISHED"
): Promise<PropertyResponse> {
  const raw = await propertyRepo.getRawPropertyById(propertyId);
  if (!raw) {
    throw notFoundError("Property", propertyId);
  }

  if (raw.status !== "SUSPENDED") {
    throw conflictError(
      "/errors/invalid-lifecycle-transition",
      "Invalid Property Transition",
      `Only 'SUSPENDED' properties can be unsuspended. Current: '${raw.status}'.`
    );
  }

  return await propertyRepo.transitionPropertyStatus({
    propertyId,
    newStatus: targetStatus,
    actorId: adminId,
    actorType: "ADMIN",
    action: "PROPERTY_UNSUSPENDED",
    expectedStatus: "SUSPENDED",
    previousStatus: "SUSPENDED",
  });
}

// ==============================================================================
// 10. P14: Relist (ARCHIVED -> DRAFT)
// ==============================================================================

export async function relistProperty(
  agentId: string,
  propertyId: string
): Promise<PropertyResponse> {
  const raw = await propertyRepo.getRawPropertyById(propertyId);
  if (!raw) {
    throw notFoundError("Property", propertyId);
  }

  if (raw.agentId !== agentId) {
    throw forbiddenError("You do not own this property listing.");
  }

  if (raw.status !== "ARCHIVED") {
    throw conflictError(
      "/errors/invalid-lifecycle-transition",
      "Invalid Property Transition",
      `Only 'ARCHIVED' listings may be relisted. Current: '${raw.status}'.`
    );
  }

  return await propertyRepo.transitionPropertyStatus({
    propertyId,
    newStatus: "DRAFT",
    actorId: agentId,
    actorType: "AGENT",
    action: "PROPERTY_RELISTED",
    expectedStatus: "ARCHIVED",
    previousStatus: "ARCHIVED",
  });
}

// ==============================================================================
// 11. Hard Delete (DRAFT only per Decision #42)
// ==============================================================================

export async function deleteProperty(
  agentId: string,
  propertyId: string
): Promise<void> {
  const raw = await propertyRepo.getRawPropertyById(propertyId);
  if (!raw) {
    throw notFoundError("Property", propertyId);
  }

  if (raw.agentId !== agentId) {
    throw forbiddenError("You do not own this property listing.");
  }

  if (raw.status !== "DRAFT" || raw.publishedAt !== null) {
    throw conflictError(
      "/errors/deletion-forbidden",
      "Deletion Forbidden",
      "A Property may be hard-deleted only if it has never left DRAFT. Once published, it must be ARCHIVED."
    );
  }

  await propertyRepo.deleteProperty(propertyId, agentId);
}
