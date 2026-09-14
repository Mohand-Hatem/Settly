import type { AiConversationDto } from "../types/index.js";

export class AiRepository {
  async findById(id: string): Promise<AiConversationDto | null> {
    return { id, createdAt: new Date().toISOString() };
  }
}

export const aiRepository = new AiRepository();
