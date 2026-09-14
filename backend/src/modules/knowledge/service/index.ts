import type { ArticleDto } from "../types/index.js";

export interface IKnowledgeService {
  getById(id: string): Promise<ArticleDto | null>;
}

export class KnowledgeService implements IKnowledgeService {
  async getById(id: string): Promise<ArticleDto | null> {
    return { id, createdAt: new Date().toISOString() };
  }
}

export const knowledgeService = new KnowledgeService();
