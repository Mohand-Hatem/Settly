import { areaRepository, AreaRepository, type AreaRecord } from "../repository/area.repository.js";
import type { AreaItem, AreaListResponse, AreaQuery } from "../schema/area.schema.js";
import { notFoundError } from "../../../shared/errors/problem-details.js";

function mapAreaToItem(area: AreaRecord): AreaItem {
  return {
    id: area.id,
    slug: area.slug,
    nameEn: area.nameEn,
    nameAr: area.nameAr,
    aliases: area.aliases,
    parentId: area.parentId,
    level: area.level,
    boundaryGeoJson: area.boundaryGeoJson,
    centerLat: area.centerLat,
    centerLng: area.centerLng,
    createdAt: area.createdAt.toISOString(),
    updatedAt: area.updatedAt.toISOString(),
  };
}

export class AreaService {
  constructor(private readonly repo: AreaRepository = areaRepository) {}

  async listAreas(query: AreaQuery): Promise<AreaListResponse> {
    const areas = await this.repo.findMany(query);
    return {
      items: areas.map(mapAreaToItem),
    };
  }

  async getAreaById(id: string): Promise<AreaItem> {
    const area = await this.repo.findById(id);
    if (!area) {
      throw notFoundError("Area", id);
    }
    return mapAreaToItem(area);
  }

  async getAreaBySlug(slug: string): Promise<AreaItem> {
    const area = await this.repo.findBySlug(slug);
    if (!area) {
      throw notFoundError("Area", slug);
    }
    return mapAreaToItem(area);
  }
}

export const areaService = new AreaService();
