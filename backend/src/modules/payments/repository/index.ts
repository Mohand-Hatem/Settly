import type { DepositDto } from "../types/index.js";

export class PaymentRepository {
  async findById(id: string): Promise<DepositDto | null> {
    return { id, createdAt: new Date().toISOString() };
  }
}

export const paymentRepository = new PaymentRepository();
