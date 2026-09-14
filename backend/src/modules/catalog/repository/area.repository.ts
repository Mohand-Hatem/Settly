import { prisma } from "../../../shared/database/prisma.js";
import type { AreaQuery } from "../schema/area.schema.js";
import type { Area } from "@prisma/client";

export type AreaRecord = Area;

export class AreaRepository {
  async findMany(query: AreaQuery): Promise<Area[]> {
    return prisma.area.findMany({
      where: {
        level: query.level,
        parentId: query.parentId,
      },
      orderBy: [{ level: "asc" }, { nameEn: "asc" }],
    });
  }

  async findById(id: string): Promise<Area | null> {
    return prisma.area.findUnique({
      where: { id },
    });
  }

  async findBySlug(slug: string): Promise<Area | null> {
    return prisma.area.findUnique({
      where: { slug },
    });
  }
}

export const areaRepository = new AreaRepository();
