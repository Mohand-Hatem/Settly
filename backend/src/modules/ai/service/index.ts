import type { AiConversationDto } from "../types/index.js";

export interface IAiService {
  getById(id: string): Promise<AiConversationDto | null>;
}

export class AiService implements IAiService {
  async getById(id: string): Promise<AiConversationDto | null> {
    return { id, createdAt: new Date().toISOString() };
  }
}

export const aiService = new AiService();
