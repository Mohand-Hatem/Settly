import { prisma } from "../../../shared/database/prisma.js";
import { uuidv7 } from "uuidv7";
import { Prisma, type PropertyStatus, type PropertyType, type ListingIntent, type RentalPeriod, type ActorType } from "@prisma/client";
import type {
  CreatePropertyInput,
  UpdatePropertyInput,
  PropertyResponse,
  PropertyImage,
} from "../schema/property.schema.js";

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
          email: p.agent.email,
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
          amenities:
            input.amenityIds && input.amenityIds.length > 0
              ? {
                  create: input.amenityIds.map((amenityId) => ({
                    amenity: { connect: { id: amenityId } },
                  })),
                }
              : undefined,
        },
      });

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
    include: propertyInclude,
  });

  return property ? formatProperty(property) : null;
}

export async function getPropertyBySlug(slug: string): Promise<PropertyResponse | null> {
  const property = await prisma.property.findUnique({
    where: { slug },
    include: propertyInclude,
  });

  return property ? formatProperty(property) : null;
}

export async function getRawPropertyById(id: string) {
  return await prisma.property.findUnique({
    where: { id },
    include: {
      images: true,
      amenities: true,
      area: true,
      offers: {
        where: {
          status: { in: ["RESERVED", "ACCEPTED"] },
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
    where: { agentId },
    take: limit + 1,
    cursor: options?.cursor ? { id: options.cursor } : undefined,
    orderBy: { updatedAt: "desc" },
    include: propertyInclude,
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
    where: {
      status: { in: ["PUBLISHED", "RESERVED"] },
    },
    take: limit + 1,
    cursor: options?.cursor ? { id: options.cursor } : undefined,
    orderBy: { publishedAt: "desc" },
    include: propertyInclude,
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

export async function updateProperty(
  propertyId: string,
  actorId: string,
  data: UpdatePropertyInput,
  newStatus?: PropertyStatus
): Promise<PropertyResponse> {
  await prisma.$transaction(async (tx) => {
    const existing = await tx.property.findUnique({
      where: { id: propertyId },
    });

    if (!existing) {
      throw new Error(`Property ${propertyId} not found`);
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
      if (newPriceBigInt !== existing.price) {
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

    await tx.property.update({
      where: { id: propertyId },
      data: updatePayload,
    });

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
          statusTransition: newStatus ? `${existing.status} -> ${newStatus}` : undefined,
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
}: {
  propertyId: string;
  newStatus: PropertyStatus;
  actorId: string;
  actorType: ActorType;
  action: string;
  reason?: string;
}): Promise<PropertyResponse> {
  await prisma.$transaction(async (tx) => {
    const existing = await tx.property.findUnique({
      where: { id: propertyId },
    });

    if (!existing) {
      throw new Error(`Property ${propertyId} not found`);
    }

    const updateData: Prisma.PropertyUpdateInput = {
      status: newStatus,
    };

    // If transitioning to PUBLISHED for the first time, set publishedAt
    if (newStatus === "PUBLISHED" && !existing.publishedAt) {
      updateData.publishedAt = new Date();
    }

    await tx.property.update({
      where: { id: propertyId },
      data: updateData,
    });

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
          previousStatus: existing.status,
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
  const count = await prisma.propertyImage.count({
    where: { propertyId },
  });

  const shouldBeCover = isCover ?? count === 0;

  if (shouldBeCover) {
    await prisma.propertyImage.updateMany({
      where: { propertyId, isCover: true },
      data: { isCover: false },
    });
  }

  const img = await prisma.propertyImage.create({
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
  await prisma.$transaction(
    imageIds.map((id, index) =>
      prisma.propertyImage.updateMany({
        where: { id, propertyId },
        data: { order: index },
      })
    )
  );
}

export async function countPropertyImages(propertyId: string): Promise<number> {
  return await prisma.propertyImage.count({
    where: { propertyId },
  });
}
