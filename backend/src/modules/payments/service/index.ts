import type { DepositDto } from "../types/index.js";

export interface IPaymentService {
  getById(id: string): Promise<DepositDto | null>;
}

export class PaymentService implements IPaymentService {
  async getById(id: string): Promise<DepositDto | null> {
    return { id, createdAt: new Date().toISOString() };
  }
}

export const paymentService = new PaymentService();
