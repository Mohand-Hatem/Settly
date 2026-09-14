import type { MessageDto } from "../types/index.js";

export class MessagingRepository {
  async findById(id: string): Promise<MessageDto | null> {
    return { id, createdAt: new Date().toISOString() };
  }
}

export const messagingRepository = new MessagingRepository();
