import type { SearchResultDto } from "../types/index.js";

export class SearchRepository {
  async findById(id: string): Promise<SearchResultDto | null> {
    return { id, createdAt: new Date().toISOString() };
  }
}

export const searchRepository = new SearchRepository();
