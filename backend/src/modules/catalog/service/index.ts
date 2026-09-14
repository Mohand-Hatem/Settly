import type { PropertyDto } from "../types/index.js";

export interface ICatalogService {
  getById(id: string): Promise<PropertyDto | null>;
}

export class CatalogService implements ICatalogService {
  async getById(id: string): Promise<PropertyDto | null> {
    return { id, createdAt: new Date().toISOString() };
  }
}

export const catalogService = new CatalogService();
export * from "./area.service.js";

