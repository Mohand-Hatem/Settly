import type { NotificationDto } from "../types/index.js";

export class NotificationRepository {
  async findById(id: string): Promise<NotificationDto | null> {
    return { id, createdAt: new Date().toISOString() };
  }
}

export const notificationRepository = new NotificationRepository();
