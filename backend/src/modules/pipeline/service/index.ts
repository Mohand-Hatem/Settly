import type { ViewingDto } from "../types/index.js";

export interface IPipelineService {
  getById(id: string): Promise<ViewingDto | null>;
}

export class PipelineService implements IPipelineService {
  async getById(id: string): Promise<ViewingDto | null> {
    return { id, createdAt: new Date().toISOString() };
  }
}

export const pipelineService = new PipelineService();
