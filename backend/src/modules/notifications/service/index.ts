import type { NotificationDto } from "../types/index.js";

export interface INotificationService {
  getById(id: string): Promise<NotificationDto | null>;
}

export class NotificationService implements INotificationService {
  async getById(id: string): Promise<NotificationDto | null> {
    return { id, createdAt: new Date().toISOString() };
  }
}

export const notificationService = new NotificationService();
