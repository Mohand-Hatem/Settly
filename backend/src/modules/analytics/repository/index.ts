import type { AuditLogDto } from "../types/index.js";

export class AnalyticsRepository {
  async findById(id: string): Promise<AuditLogDto | null> {
    return { id, createdAt: new Date().toISOString() };
  }
}

export const analyticsRepository = new AnalyticsRepository();
