import type { MessageDto } from "../types/index.js";

export interface IMessagingService {
  getById(id: string): Promise<MessageDto | null>;
}

export class MessagingService implements IMessagingService {
  async getById(id: string): Promise<MessageDto | null> {
    return { id, createdAt: new Date().toISOString() };
  }
}

export const messagingService = new MessagingService();
