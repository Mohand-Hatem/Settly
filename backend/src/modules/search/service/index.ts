import type { SearchResultDto } from "../types/index.js";

export interface ISearchService {
  getById(id: string): Promise<SearchResultDto | null>;
}

export class SearchService implements ISearchService {
  async getById(id: string): Promise<SearchResultDto | null> {
    return { id, createdAt: new Date().toISOString() };
  }
}

export const searchService = new SearchService();
