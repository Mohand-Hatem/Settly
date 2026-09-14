import type { ArticleDto } from "../types/index.js";

export class KnowledgeRepository {
  async findById(id: string): Promise<ArticleDto | null> {
    return { id, createdAt: new Date().toISOString() };
  }
}

export const knowledgeRepository = new KnowledgeRepository();
