import type { FavoriteDto } from "../types/index.js";

export class EngagementRepository {
  async findById(id: string): Promise<FavoriteDto | null> {
    return { id, createdAt: new Date().toISOString() };
  }
}

export const engagementRepository = new EngagementRepository();
