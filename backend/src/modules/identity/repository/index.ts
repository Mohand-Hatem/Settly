import type { IdentityUser } from "../types/index.js";

export class IdentityRepository {
  async findById(id: string): Promise<IdentityUser | null> {
    return { id, email: "user@example.com", role: "USER" };
  }
}

export const identityRepository = new IdentityRepository();
