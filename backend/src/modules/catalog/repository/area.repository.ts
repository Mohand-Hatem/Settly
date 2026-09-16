import { prisma } from "../../../shared/database/prisma.js";
import type { AreaQuery } from "../schema/area.schema.js";
import type { Area } from "@prisma/client";
import { getAreaAvgPricePerSqmSql } from "../sql/index.js";

export type AreaRecord = Area;

export interface AreaPropertyMetrics {
  activeCount: number;
  minPrice: bigint;
  maxPrice: bigint;
  avgPricePerSqm: number;
  typeDistribution: Record<string, number>;
}

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

  async getChildAreaHierarchy(areaId: string): Promise<{ id: string; level: Area["level"] }[]> {
    return prisma.area.findMany({
      where: {
        OR: [{ parentId: areaId }, { id: areaId }],
      },
      select: { id: true, level: true },
    });
  }

  async getAreaPropertyMetrics(areaIds: string[]): Promise<AreaPropertyMetrics> {
    if (areaIds.length === 0) {
      return {
        activeCount: 0,
        minPrice: 0n,
        maxPrice: 0n,
        avgPricePerSqm: 62500,
        typeDistribution: {},
      };
    }

    const [agg, groups, avgSqm] = await Promise.all([
      prisma.property.aggregate({
        where: {
          areaId: { in: areaIds },
          status: "PUBLISHED",
        },
        _count: { id: true },
        _min: { price: true },
        _max: { price: true },
      }),
      prisma.property.groupBy({
        by: ["propertyType"],
        where: {
          areaId: { in: areaIds },
          status: "PUBLISHED",
        },
        _count: { id: true },
      }),
      getAreaAvgPricePerSqmSql(prisma, areaIds),
    ]);

    const typeDistribution: Record<string, number> = {};
    for (const g of groups) {
      typeDistribution[g.propertyType] = g._count.id;
    }

    const activeCount = agg._count.id;
    const minPrice = agg._min.price ?? 0n;
    const maxPrice = agg._max.price ?? 0n;
    const avgPricePerSqm = activeCount > 0 && avgSqm > 0 ? avgSqm : 62500;

    return {
      activeCount,
      minPrice,
      maxPrice,
      avgPricePerSqm,
      typeDistribution,
    };
  }
}

export const areaRepository = new AreaRepository();
