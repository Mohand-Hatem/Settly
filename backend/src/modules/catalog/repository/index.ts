import type { PropertyDto } from "../types/index.js";

export class CatalogRepository {
  async findById(id: string): Promise<PropertyDto | null> {
    return { id, createdAt: new Date().toISOString() };
  }
}

export const catalogRepository = new CatalogRepository();
