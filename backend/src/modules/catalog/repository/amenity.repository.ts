import { prisma } from "../../../shared/database/prisma.js";
import { uuidv7 } from "uuidv7";
import type { AmenityCategory, AmenityItem, CreateAmenityInput } from "../schema/amenity.schema.js";

export async function listAmenities(category?: AmenityCategory): Promise<AmenityItem[]> {
  const amenities = await prisma.amenity.findMany({
    where: category ? { category } : undefined,
    orderBy: [{ category: "asc" }, { nameEn: "asc" }],
  });

  return amenities.map((a) => ({
    id: a.id,
    slug: a.slug,
    nameEn: a.nameEn,
    nameAr: a.nameAr,
    icon: a.icon,
    category: a.category,
    createdAt: a.createdAt.toISOString(),
  }));
}

export async function getAmenityById(id: string): Promise<AmenityItem | null> {
  const a = await prisma.amenity.findUnique({
    where: { id },
  });
  if (!a) return null;
  return {
    id: a.id,
    slug: a.slug,
    nameEn: a.nameEn,
    nameAr: a.nameAr,
    icon: a.icon,
    category: a.category,
    createdAt: a.createdAt.toISOString(),
  };
}

export async function createAmenity(input: CreateAmenityInput): Promise<AmenityItem> {
  const a = await prisma.amenity.create({
    data: {
      id: uuidv7(),
      slug: input.slug,
      nameEn: input.nameEn,
      nameAr: input.nameAr,
      icon: input.icon || null,
      category: input.category,
    },
  });

  return {
    id: a.id,
    slug: a.slug,
    nameEn: a.nameEn,
    nameAr: a.nameAr,
    icon: a.icon,
    category: a.category,
    createdAt: a.createdAt.toISOString(),
  };
}
