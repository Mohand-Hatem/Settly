import type { FavoriteDto } from "../types/index.js";

export interface IEngagementService {
  getById(id: string): Promise<FavoriteDto | null>;
}

export class EngagementService implements IEngagementService {
  async getById(id: string): Promise<FavoriteDto | null> {
    return { id, createdAt: new Date().toISOString() };
  }
}

export const engagementService = new EngagementService();
