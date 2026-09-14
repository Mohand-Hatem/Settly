import type { ViewingDto } from "../types/index.js";

export class PipelineRepository {
  async findById(id: string): Promise<ViewingDto | null> {
    return { id, createdAt: new Date().toISOString() };
  }
}

export const pipelineRepository = new PipelineRepository();
