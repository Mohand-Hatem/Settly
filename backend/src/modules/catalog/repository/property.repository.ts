import { prisma } from "../../../shared/database/prisma.js";
import { uuidv7 } from "uuidv7";
import { Prisma, type PropertyStatus, type PropertyType, type ListingIntent, type RentalPeriod, type ActorType } from "@prisma/client";
import { conflictError } from "../../../shared/errors/problem-details.js";
import { reorderPropertyImagesSql } from "../sql/index.js";
import type {
  CreatePropertyInput,
  UpdatePropertyInput,
  PropertyResponse,
  PropertyImage,
} from "../schema/property.schema.js";
import type { CompareItem } from "../schema/compare.schema.js";

const propertyInclude = {
  images: {
    orderBy: { order: "asc" as const },
  },
  amenities: {
    include: {
      amenity: true,
    },
  },
  area: true,
  agent: {
    include: {
      agentProfile: true,
    },
  },
  priceHistories: {
    orderBy: { changedAt: "desc" as const },
  },
} as const;

/**
 * Optimized slim projection for multi-item list views (search cards, directory tables).
 * Omits expensive price histories and amenity joins, and caps image count to top 3.
 */
const propertyCardInclude = {
  images: {
    orderBy: { order: "asc" as const },
    take: 3,
  },
  area: true,
  agent: {
    include: {
      agentProfile: true,
    },
  },
} as const;


function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u0621-\u064A-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "") || "property";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function formatProperty(p: any): PropertyResponse {
  return {
    id: p.id,
    agentId: p.agentId,
    areaId: p.areaId,
    slug: p.slug,
    titleEn: p.titleEn,
    titleAr: p.titleAr,
    descriptionEn: p.descriptionEn,
    descriptionAr: p.descriptionAr,
    propertyType: p.propertyType,
    listingIntent: p.listingIntent,
    price: p.price.toString(),
    rentalPeriod: p.rentalPeriod,
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    areaSqm: Number(p.areaSqm),
    status: p.status,
    featured: p.featured,
    latitude: p.latitude,
    longitude: p.longitude,
    publishedAt: p.publishedAt ? p.publishedAt.toISOString() : null,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    images: (p.images || []).map((img: any) => ({
      id: img.id,
      propertyId: img.propertyId,
      cloudinaryPublicId: img.cloudinaryPublicId,
      url: img.url,
      captionEn: img.captionEn,
      captionAr: img.captionAr,
      isCover: img.isCover,
      order: img.order,
      createdAt: img.createdAt.toISOString(),
    })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    amenities: (p.amenities || []).map((pa: any) => ({
      id: pa.amenity.id,
      slug: pa.amenity.slug,
      nameEn: pa.amenity.nameEn,
      nameAr: pa.amenity.nameAr,
      icon: pa.amenity.icon,
      category: pa.amenity.category,
      createdAt: pa.amenity.createdAt.toISOString(),
    })),
    area: p.area
      ? {
          id: p.area.id,
          slug: p.area.slug,
          nameEn: p.area.nameEn,
          nameAr: p.area.nameAr,
          aliases: p.area.aliases,
          parentId: p.area.parentId,
          level: p.area.level,
          boundaryGeoJson: p.area.boundaryGeoJson,
          centerLat: p.area.centerLat,
          centerLng: p.area.centerLng,
          createdAt: p.area.createdAt.toISOString(),
          updatedAt: p.area.updatedAt.toISOString(),
        }
      : undefined,
    agent: p.agent
      ? {
          id: p.agent.id,
          name: p.agent.name,
          image: p.agent.image,
          licenseNumber: p.agent.agentProfile?.licenseNumber,
          brokerageName: p.agent.agentProfile?.brokerageName,
          isVerified: p.agent.agentProfile?.isVerified ?? false,
        }
      : undefined,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    priceHistories: (p.priceHistories || []).map((ph: any) => ({
      id: ph.id,
      propertyId: ph.propertyId,
      price: ph.price.toString(),
      changedAt: ph.changedAt.toISOString(),
      changedById: ph.changedById,
    })),
  };
}

export async function createProperty(
  agentId: string,
  input: CreatePropertyInput
): Promise<PropertyResponse> {
  const propertyId = uuidv7();
  const slugSeed = input.titleEn || input.titleAr || input.propertyType;
  const slug = `${slugify(slugSeed)}-${propertyId.slice(0, 8)}`;

  await prisma.$transaction(
    async (tx) => {
      await tx.property.create({
        data: {
          id: propertyId,
          agentId,
          areaId: input.areaId,
          slug,
          titleEn: input.titleEn || null,
          titleAr: input.titleAr || null,
          descriptionEn: input.descriptionEn || null,
          descriptionAr: input.descriptionAr || null,
          propertyType: input.propertyType as PropertyType,
          listingIntent: input.listingIntent as ListingIntent,
          price: BigInt(input.price),
          rentalPeriod: (input.rentalPeriod as RentalPeriod) || null,
          bedrooms: input.bedrooms,
          bathrooms: input.bathrooms,
          areaSqm: new Prisma.Decimal(input.areaSqm),
          latitude: input.latitude,
          longitude: input.longitude,
          status: "DRAFT",
        },
      });

      if (input.amenityIds && input.amenityIds.length > 0) {
        await tx.propertyAmenity.createMany({
          data: input.amenityIds.map((amenityId) => ({
            propertyId,
            amenityId,
          })),
        });
      }

      // Record AuditLog
      await tx.auditLog.create({
        data: {
          id: uuidv7(),
          actorType: "AGENT",
          actorId: agentId,
          action: "PROPERTY_CREATED",
          entityType: "Property",
          entityId: propertyId,
          metadata: {
            slug,
            propertyType: input.propertyType,
            listingIntent: input.listingIntent,
            price: input.price,
          },
        },
      });
    },
    { timeout: 20000, maxWait: 10000 }
  );

  const created = await getPropertyById(propertyId);
  return created!;
}

export async function getPropertyById(id: string): Promise<PropertyResponse | null> {
  const property = await prisma.property.findUnique({
    where: { id },
    relationLoadStrategy: "join",
    include: propertyInclude,
  });

  return property ? formatProperty(property) : null;
}

export async function getPropertyBySlug(slug: string): Promise<PropertyResponse | null> {
  const property = await prisma.property.findUnique({
    where: { slug },
    relationLoadStrategy: "join",
    include: propertyInclude,
  });

  return property ? formatProperty(property) : null;
}

export async function getPropertyOwner(
  id: string
): Promise<{ id: string; agentId: string; status: PropertyStatus } | null> {
  return await prisma.property.findUnique({
    where: { id },
    select: { id: true, agentId: true, status: true },
  });
}

export async function getRawPropertyById(id: string) {
  return await prisma.property.findUnique({
    where: { id },
    relationLoadStrategy: "join",
    select: {
      id: true,
      agentId: true,
      areaId: true,
      status: true,
      publishedAt: true,
      titleEn: true,
      titleAr: true,
      descriptionEn: true,
      descriptionAr: true,
      price: true,
      offers: {
        where: {
          status: { in: ["RESERVED", "ACCEPTED"] },
        },
        select: {
          status: true,
        },
      },
      _count: {
        select: {
          images: true,
        },
      },
    },
  });
}

export async function listPropertiesByAgent(
  agentId: string,
  options?: { cursor?: string; limit?: number }
): Promise<{ items: PropertyResponse[]; nextCursor: string | null }> {
  const limit = options?.limit ?? 20;
  const properties = await prisma.property.findMany({
    relationLoadStrategy: "join",
    where: { agentId },
    take: limit + 1,
    cursor: options?.cursor ? { id: options.cursor } : undefined,
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    include: propertyCardInclude,
  });

  let nextCursor: string | null = null;
  if (properties.length > limit) {
    const nextItem = properties.pop();
    nextCursor = nextItem ? nextItem.id : null;
  }

  return {
    items: properties.map(formatProperty),
    nextCursor,
  };
}

export async function listPublishedProperties(options?: {
  cursor?: string;
  limit?: number;
}): Promise<{ items: PropertyResponse[]; nextCursor: string | null }> {
  const limit = options?.limit ?? 20;
  const properties = await prisma.property.findMany({
    relationLoadStrategy: "join",
    where: {
      status: { in: ["PUBLISHED", "RESERVED"] },
    },
    take: limit + 1,
    cursor: options?.cursor ? { id: options.cursor } : undefined,
    orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
    include: propertyCardInclude,
  });

  let nextCursor: string | null = null;
  if (properties.length > limit) {
    const nextItem = properties.pop();
    nextCursor = nextItem ? nextItem.id : null;
  }

  return {
    items: properties.map(formatProperty),
    nextCursor,
  };
}

export async function countPendingProperties(): Promise<number> {
  return await prisma.property.count({
    where: { status: "PENDING_REVIEW" },
  });
}

export async function listAdminProperties(options?: {
  status?: PropertyStatus;
  cursor?: string;
  limit?: number;
}): Promise<{ items: PropertyResponse[]; nextCursor: string | null; totalCount: number }> {
  const limit = options?.limit ?? 20;
  const where: Prisma.PropertyWhereInput = options?.status ? { status: options.status } : {};

  const [totalCount, properties] = await Promise.all([
    prisma.property.count({ where }),
    prisma.property.findMany({
      relationLoadStrategy: "join",
      where,
      take: limit + 1,
      cursor: options?.cursor ? { id: options.cursor } : undefined,
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      include: propertyCardInclude,
    }),
  ]);

  let nextCursor: string | null = null;
  if (properties.length > limit) {
    const nextItem = properties.pop();
    nextCursor = nextItem ? nextItem.id : null;
  }

  return {
    items: properties.map(formatProperty),
    nextCursor,
    totalCount,
  };
}

export async function updateProperty(
  propertyId: string,
  actorId: string,
  data: UpdatePropertyInput,
  newStatus?: PropertyStatus,
  existingStatus?: PropertyStatus,
  existingPrice?: bigint
): Promise<PropertyResponse> {
  await prisma.$transaction(async (tx) => {
    let currentStatus = existingStatus;
    let currentPrice = existingPrice;

    if (!currentStatus || currentPrice === undefined) {
      const existing = await tx.property.findUnique({
        where: { id: propertyId },
        select: { status: true, price: true },
      });

      if (!existing) {
        throw new Error(`Property ${propertyId} not found`);
      }
      currentStatus = existing.status;
      currentPrice = existing.price;
    }

    const updatePayload: Prisma.PropertyUpdateInput = {};

    if (data.titleEn !== undefined) updatePayload.titleEn = data.titleEn;
    if (data.titleAr !== undefined) updatePayload.titleAr = data.titleAr;
    if (data.descriptionEn !== undefined) updatePayload.descriptionEn = data.descriptionEn;
    if (data.descriptionAr !== undefined) updatePayload.descriptionAr = data.descriptionAr;
    if (data.propertyType !== undefined) updatePayload.propertyType = data.propertyType as PropertyType;
    if (data.listingIntent !== undefined) updatePayload.listingIntent = data.listingIntent as ListingIntent;
    if (data.rentalPeriod !== undefined) updatePayload.rentalPeriod = data.rentalPeriod as RentalPeriod | null;
    if (data.bedrooms !== undefined) updatePayload.bedrooms = data.bedrooms;
    if (data.bathrooms !== undefined) updatePayload.bathrooms = data.bathrooms;
    if (data.areaSqm !== undefined) updatePayload.areaSqm = new Prisma.Decimal(data.areaSqm);
    if (data.latitude !== undefined) updatePayload.latitude = data.latitude;
    if (data.longitude !== undefined) updatePayload.longitude = data.longitude;
    if (data.areaId !== undefined) updatePayload.area = { connect: { id: data.areaId } };
    if (newStatus !== undefined) updatePayload.status = newStatus;

    // Track price change in PropertyPriceHistory (P6)
    if (data.price !== undefined) {
      const newPriceBigInt = BigInt(data.price);
      if (newPriceBigInt !== currentPrice) {
        updatePayload.price = newPriceBigInt;
        await tx.propertyPriceHistory.create({
          data: {
            id: uuidv7(),
            propertyId,
            price: newPriceBigInt,
            changedById: actorId,
          },
        });
      }
    }

    // Sync amenities if provided
    if (data.amenityIds !== undefined) {
      await tx.propertyAmenity.deleteMany({
        where: { propertyId },
      });
      if (data.amenityIds.length > 0) {
        await tx.propertyAmenity.createMany({
          data: data.amenityIds.map((amenityId) => ({
            propertyId,
            amenityId,
          })),
        });
      }
    }

    // Conditional CAS update
    if (currentStatus) {
      const updateResult = await tx.property.updateMany({
        where: { id: propertyId, status: currentStatus },
        data: updatePayload,
      });
      if (updateResult.count === 0) {
        throw conflictError(
          "/errors/invalid-lifecycle-transition",
          "Invalid Property Transition",
          `Property ${propertyId} update failed: status changed concurrently.`
        );
      }
    } else {
      await tx.property.update({
        where: { id: propertyId },
        data: updatePayload,
      });
    }

    // Record AuditLog
    await tx.auditLog.create({
      data: {
        id: uuidv7(),
        actorType: "AGENT",
        actorId,
        action: "PROPERTY_UPDATED",
        entityType: "Property",
        entityId: propertyId,
        metadata: {
          updatedFields: Object.keys(data),
          statusTransition: newStatus ? `${currentStatus} -> ${newStatus}` : undefined,
        },
      },
    });
  }, { timeout: 20000, maxWait: 10000 });

  const updated = await getPropertyById(propertyId);
  return updated!;
}

export async function transitionPropertyStatus({
  propertyId,
  newStatus,
  actorId,
  actorType,
  action,
  reason,
  expectedStatus,
  previousStatus,
  setPublishedAt,
}: {
  propertyId: string;
  newStatus: PropertyStatus;
  actorId: string;
  actorType: ActorType;
  action: string;
  reason?: string;
  expectedStatus?: PropertyStatus | PropertyStatus[];
  previousStatus?: PropertyStatus;
  setPublishedAt?: boolean;
}): Promise<PropertyResponse> {
  await prisma.$transaction(async (tx) => {
    let resolvedPrevStatus = previousStatus;

    if (!expectedStatus || !resolvedPrevStatus) {
      const existing = await tx.property.findUnique({
        where: { id: propertyId },
        select: { status: true, publishedAt: true },
      });

      if (!existing) {
        throw new Error(`Property ${propertyId} not found`);
      }

      resolvedPrevStatus = existing.status;
      if (setPublishedAt === undefined && newStatus === "PUBLISHED" && !existing.publishedAt) {
        setPublishedAt = true;
      }
    }

    const updateData: Prisma.PropertyUpdateInput = {
      status: newStatus,
    };

    if (setPublishedAt) {
      updateData.publishedAt = new Date();
    }

    if (expectedStatus) {
      const expectedArr = Array.isArray(expectedStatus) ? expectedStatus : [expectedStatus];
      const result = await tx.property.updateMany({
        where: {
          id: propertyId,
          status: { in: expectedArr },
        },
        data: updateData,
      });

      if (result.count === 0) {
        throw conflictError(
          "/errors/invalid-lifecycle-transition",
          "Invalid Property Transition",
          `Property ${propertyId} transition failed: status changed concurrently.`
        );
      }
    } else {
      await tx.property.update({
        where: { id: propertyId },
        data: updateData,
      });
    }

    // Record AuditLog
    await tx.auditLog.create({
      data: {
        id: uuidv7(),
        actorType,
        actorId,
        action,
        entityType: "Property",
        entityId: propertyId,
        metadata: {
          previousStatus: resolvedPrevStatus,
          newStatus,
          reason: reason || null,
        },
      },
    });
  }, { timeout: 20000, maxWait: 10000 });

  const updated = await getPropertyById(propertyId);
  return updated!;
}

export async function deleteProperty(propertyId: string, actorId: string): Promise<boolean> {
  return await prisma.$transaction(async (tx) => {
    const existing = await tx.property.findUnique({
      where: { id: propertyId },
    });

    if (!existing) return false;

    // Decision #42: Hard delete allowed ONLY if never left DRAFT
    if (existing.status !== "DRAFT" || existing.publishedAt !== null) {
      throw new Error("CANNOT_HARD_DELETE_PUBLISHED_PROPERTY");
    }

    // Delete property (cascades related join rows)
    await tx.property.delete({
      where: { id: propertyId },
    });

    // Record AuditLog
    await tx.auditLog.create({
      data: {
        id: uuidv7(),
        actorType: "AGENT",
        actorId,
        action: "PROPERTY_HARD_DELETED",
        entityType: "Property",
        entityId: propertyId,
        metadata: {
          slug: existing.slug,
          status: existing.status,
        },
      },
    });

    return true;
  }, { timeout: 20000, maxWait: 10000 });
}

export async function addPropertyImage({
  propertyId,
  cloudinaryPublicId,
  url,
  captionEn,
  captionAr,
  isCover,
}: {
  propertyId: string;
  cloudinaryPublicId: string;
  url: string;
  captionEn?: string;
  captionAr?: string;
  isCover?: boolean;
}): Promise<PropertyImage> {
  return await prisma.$transaction(
    async (tx) => {
      const count = await tx.propertyImage.count({
        where: { propertyId },
      });

      const shouldBeCover = isCover ?? count === 0;

      if (shouldBeCover) {
        await tx.propertyImage.updateMany({
          where: { propertyId, isCover: true },
          data: { isCover: false },
        });
      }

      const img = await tx.propertyImage.create({
        data: {
          id: uuidv7(),
          propertyId,
          cloudinaryPublicId,
          url,
          captionEn: captionEn || null,
          captionAr: captionAr || null,
          isCover: shouldBeCover,
          order: count,
        },
      });

      return {
        id: img.id,
        propertyId: img.propertyId,
        cloudinaryPublicId: img.cloudinaryPublicId,
        url: img.url,
        captionEn: img.captionEn,
        captionAr: img.captionAr,
        isCover: img.isCover,
        order: img.order,
        createdAt: img.createdAt.toISOString(),
      };
    },
    { timeout: 10000, maxWait: 5000 }
  );
}

export async function deletePropertyImage(propertyId: string, imageId: string): Promise<boolean> {
  const result = await prisma.propertyImage.deleteMany({
    where: { id: imageId, propertyId },
  });
  return result.count > 0;
}

export async function reorderPropertyImages(
  propertyId: string,
  imageIds: string[]
): Promise<void> {
  if (imageIds.length === 0) return;
  await reorderPropertyImagesSql(prisma, propertyId, imageIds);
}

export async function countPropertyImages(propertyId: string): Promise<number> {
  return await prisma.propertyImage.count({
    where: { propertyId },
  });
}

// ==============================================================================
// Compare
// ==============================================================================

const propertyCompareInclude = {
  area: true,
  images: {
    orderBy: { order: "asc" as const },
  },
  amenities: {
    include: {
      amenity: true,
    },
  },
} as const;

/**
 * Published properties matching any of the given ids or slugs, in database order.
 * Prices stay in piastres; pricePerSqm is piastres per m².
 */
export async function findPublishedForCompare(refs: string[]): Promise<CompareItem[]> {
  const properties = await prisma.property.findMany({
    relationLoadStrategy: "join",
    where: {
      OR: [{ id: { in: refs } }, { slug: { in: refs } }],
      status: "PUBLISHED",
    },
    include: propertyCompareInclude,
  });

  return properties.map((p) => {
    const areaSqm = Number(p.areaSqm);
    const cover = p.images.find((img) => img.isCover) ?? p.images[0];
    return {
      id: p.id,
      slug: p.slug,
      titleEn: p.titleEn,
      titleAr: p.titleAr,
      propertyType: p.propertyType,
      listingIntent: p.listingIntent,
      price: p.price.toString(),
      rentalPeriod: p.rentalPeriod,
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms,
      areaSqm,
      pricePerSqm: areaSqm > 0 ? Math.round(Number(p.price) / areaSqm) : 0,
      latitude: p.latitude,
      longitude: p.longitude,
      coverImage: cover?.url ?? null,
      images: p.images.map((img) => img.url),
      area: {
        id: p.area.id,
        slug: p.area.slug,
        nameEn: p.area.nameEn,
        nameAr: p.area.nameAr,
      },
      amenities: p.amenities.map((pa) => ({
        id: pa.amenity.id,
        slug: pa.amenity.slug,
        nameEn: pa.amenity.nameEn,
        nameAr: pa.amenity.nameAr,
        category: pa.amenity.category,
      })),
    };
  });
}
