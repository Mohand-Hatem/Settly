import type { AuditLogDto } from "../types/index.js";

export interface IAnalyticsService {
  getById(id: string): Promise<AuditLogDto | null>;
}

export class AnalyticsService implements IAnalyticsService {
  async getById(id: string): Promise<AuditLogDto | null> {
    return { id, createdAt: new Date().toISOString() };
  }
}

export const analyticsService = new AnalyticsService();
