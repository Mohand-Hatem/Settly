import { uuidv7 } from "uuidv7";

/**
 * Factory utilities for creating valid domain entities in tests.
 * Never uses or mutates the demo seed corpus (TESTING.md Section 6).
 */

export function buildUserData(overrides = {}) {
  const id = overrides.id ?? uuidv7();
  return {
    id,
    name: overrides.name ?? `Test User ${id.slice(-6)}`,
    email: overrides.email ?? `user_${id.slice(-8)}@test.settly.estate`,
    emailVerified: overrides.emailVerified ?? true,
    role: overrides.role ?? "USER",
    banned: overrides.banned ?? false,
    preferredLocale: overrides.preferredLocale ?? "en",
    ...overrides,
  };
}

export function buildAreaData(overrides = {}) {
  const id = overrides.id ?? uuidv7();
  return {
    id,
    slug: overrides.slug ?? `area-${id.slice(-8)}`,
    nameEn: overrides.nameEn ?? `Area ${id.slice(-6)}`,
    nameAr: overrides.nameAr ?? `منطقة ${id.slice(-6)}`,
    aliases: overrides.aliases ?? [],
    level: overrides.level ?? "DISTRICT",
    boundaryGeoJson: overrides.boundaryGeoJson ?? null,
    centerLat: overrides.centerLat ?? 30.0444,
    centerLng: overrides.centerLng ?? 31.2357,
    ...overrides,
  };
}

export function buildPropertyData(agentId, areaId, overrides = {}) {
  const id = overrides.id ?? uuidv7();
  return {
    id,
    agentId,
    areaId,
    slug: overrides.slug ?? `property-${id.slice(-8)}`,
    titleEn: overrides.titleEn ?? "Luxury Penthouse in New Cairo",
    titleAr: overrides.titleAr ?? "شقة فاخرة للبيع في التجمع الخامس",
    descriptionEn: overrides.descriptionEn ?? "Panoramic view with private rooftop and premium finish",
    descriptionAr: overrides.descriptionAr ?? "إطلالة بانورامية مع روف خاص وتشطيبات فاخرة",
    propertyType: overrides.propertyType ?? "PENTHOUSE",
    listingIntent: overrides.listingIntent ?? "SALE",
    price: overrides.price ?? 1500000000n, // 15,000,000 EGP in piastres
    bedrooms: overrides.bedrooms ?? 4,
    bathrooms: overrides.bathrooms ?? 3,
    areaSqm: overrides.areaSqm ?? "280.50",
    status: overrides.status ?? "PUBLISHED",
    featured: overrides.featured ?? false,
    latitude: overrides.latitude ?? 30.0244,
    longitude: overrides.longitude ?? 31.4921,
    publishedAt: overrides.publishedAt ?? new Date(),
    ...overrides,
  };
}

export function buildViewingData(buyerId, agentId, propertyId, overrides = {}) {
  const id = overrides.id ?? uuidv7();
  const startsAt = overrides.startsAt ?? new Date("2026-10-01T10:00:00.000Z");
  const endsAt = overrides.endsAt ?? new Date("2026-10-01T11:00:00.000Z");
  return {
    id,
    buyerId,
    agentId,
    propertyId,
    startsAt,
    endsAt,
    status: overrides.status ?? "CONFIRMED",
    notes: overrides.notes ?? "Client viewing",
    ...overrides,
  };
}

export function buildOfferData(buyerId, agentId, propertyId, overrides = {}) {
  const id = overrides.id ?? uuidv7();
  return {
    id,
    buyerId,
    agentId,
    propertyId,
    status: overrides.status ?? "PENDING_AGENT",
    ...overrides,
  };
}

export function buildPaymentData(offerId, buyerId, overrides = {}) {
  const id = overrides.id ?? uuidv7();
  return {
    id,
    offerId,
    buyerId,
    grossAmount: overrides.grossAmount ?? 25000000n, // 250,000 EGP in piastres
    feeAmount: overrides.feeAmount ?? 500000n,
    netAmount: overrides.netAmount ?? 24500000n,
    currency: overrides.currency ?? "EGP",
    status: overrides.status ?? "PENDING",
    deadlineAt: overrides.deadlineAt ?? new Date(Date.now() + 86400000),
    ...overrides,
  };
}

export function buildPaymentAttemptData(paymentId, overrides = {}) {
  const id = overrides.id ?? uuidv7();
  return {
    id,
    paymentId,
    provider: overrides.provider ?? "PAYMOB",
    status: overrides.status ?? "INITIATED",
    ...overrides,
  };
}

export function buildAuditLogData(overrides = {}) {
  const id = overrides.id ?? uuidv7();
  return {
    id,
    actorType: overrides.actorType ?? "USER",
    actorId: overrides.actorId ?? uuidv7(),
    action: overrides.action ?? "OFFER_SUBMITTED",
    entityType: overrides.entityType ?? "Offer",
    entityId: overrides.entityId ?? uuidv7(),
    metadata: overrides.metadata ?? { reason: "Initial buyer submission" },
    ipAddress: overrides.ipAddress ?? "127.0.0.1",
    ...overrides,
  };
}
