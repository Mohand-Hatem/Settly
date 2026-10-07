import { prisma } from "../../../shared/database/prisma.js";
import { uuidv7 } from "uuidv7";
import { lockUser } from "../sql/index.js";
import {
  SUBSCRIPTION_PERIOD_MS,
  type SubscriptionPeriodKindName,
  type SubscriptionPlanName,
} from "../types/subscription.types.js";
import type { Prisma, SubscriptionPlan, SubscriptionPeriodKind } from "@prisma/client";

export class SubscriptionRepository {
  async findAgent(agentId: string) {
    return prisma.user.findUnique({
      where: { id: agentId },
      include: {
        agentProfile: true,
      },
    });
  }

  async getAgentSubscription(agentId: string) {
    return prisma.agentSubscription.findUnique({
      where: { agentId },
      include: {
        periods: {
          orderBy: { startsAt: "asc" },
        },
      },
    });
  }

  async getReceipts(agentId: string) {
    return prisma.subscriptionPayment.findMany({
      where: { agentId, status: "SUCCEEDED" },
      orderBy: { paidAt: "desc" },
      take: 20,
    });
  }

  async cancelOpenCheckouts(agentId: string): Promise<number> {
    const res = await prisma.subscriptionPayment.updateMany({
      where: {
        agentId,
        status: { in: ["PENDING", "PROCESSING"] },
      },
      data: {
        status: "CANCELLED",
      },
    });
    return res.count;
  }

  async createCheckoutRecord(params: {
    agentId: string;
    plan: SubscriptionPlan;
    kind: SubscriptionPeriodKind;
    baseAmountMinor: bigint;
    fxRate: number;
    chargedAmountMinor: bigint;
    expiresAt: Date;
    provider: string;
  }) {
    const paymentId = uuidv7();
    const attemptId = uuidv7();

    return prisma.$transaction(async (tx) => {
      // 1. Create Payment record
      const payment = await tx.subscriptionPayment.create({
        data: {
          id: paymentId,
          agentId: params.agentId,
          plan: params.plan,
          kind: params.kind,
          baseAmountMinor: params.baseAmountMinor,
          baseCurrency: "USD",
          fxRate: params.fxRate,
          chargedAmountMinor: params.chargedAmountMinor,
          chargedCurrency: "EGP",
          status: "PENDING",
          expiresAt: params.expiresAt,
        },
      });

      // 2. Create Payment Attempt
      const attempt = await tx.subscriptionPaymentAttempt.create({
        data: {
          id: attemptId,
          subscriptionPaymentId: paymentId,
          provider: params.provider,
          status: "INITIATED",
        },
      });

      return { payment, attempt };
    });
  }

  async updateAttempt(
    attemptId: string,
    data: Prisma.SubscriptionPaymentAttemptUpdateInput
  ) {
    return prisma.subscriptionPaymentAttempt.update({
      where: { id: attemptId },
      data,
    });
  }

  async updatePayment(
    paymentId: string,
    data: Prisma.SubscriptionPaymentUpdateInput
  ) {
    return prisma.subscriptionPayment.update({
      where: { id: paymentId },
      data,
    });
  }

  async findPaymentByOrderReference(orderReference: string) {
    const paymentId = orderReference.replace(/^sub_/, "");
    return prisma.subscriptionPayment.findUnique({
      where: { id: paymentId },
      include: {
        attempts: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        agent: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async executeSubscriptionWebhookSuccess(params: {
    paymentId: string;
    attemptId?: string;
    agentId: string;
    providerTransactionId: string;
    grossAmount: bigint;
    now?: Date;
  }) {
    const now = params.now ?? new Date();

    return prisma.$transaction(async (tx) => {
      // Advisory lock on agent to serialize period changes (I13 & Concurrency R12)
      await lockUser(tx, params.agentId);

      const payment = await tx.subscriptionPayment.findUnique({
        where: { id: params.paymentId },
      });

      if (!payment) {
        throw new Error("Payment not found");
      }

      if (payment.status === "SUCCEEDED") {
        return { status: "already_processed", payment };
      }

      const receiptNumber = `REC-SUB-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

      // 1. Advance Payment to SUCCEEDED
      const updatedPayment = await tx.subscriptionPayment.update({
        where: { id: params.paymentId },
        data: {
          status: "SUCCEEDED",
          paidAt: now,
          receiptNumber,
        },
      });

      // 2. Update Attempt
      if (params.attemptId) {
        await tx.subscriptionPaymentAttempt.update({
          where: { id: params.attemptId },
          data: {
            status: "SUCCEEDED",
            providerTransactionId: params.providerTransactionId,
          },
        });
      }

      // 3. Upsert AgentSubscription
      let sub = await tx.agentSubscription.findUnique({
        where: { agentId: params.agentId },
      });

      if (!sub) {
        sub = await tx.agentSubscription.create({
          data: {
            id: uuidv7(),
            agentId: params.agentId,
          },
        });
      }

      // 4. Handle Period according to Payment Kind (#104, #105)
      const currentActive = await tx.subscriptionPeriod.findFirst({
        where: {
          subscriptionId: sub.id,
          status: "ACTIVE",
          startsAt: { lte: now },
          endsAt: { gt: now },
        },
      });

      const periodEndsAt = new Date(now.getTime() + SUBSCRIPTION_PERIOD_MS);

      if (payment.kind === "UPGRADE") {
        // Supersede current period immediately (#92, #104)
        if (currentActive) {
          await tx.subscriptionPeriod.update({
            where: { id: currentActive.id },
            data: {
              status: "SUPERSEDED",
              endedEarlyAt: now,
            },
          });
        }

        // Start new 30-day period immediately
        await tx.subscriptionPeriod.create({
          data: {
            id: uuidv7(),
            subscriptionId: sub.id,
            plan: payment.plan,
            kind: "UPGRADE",
            startsAt: now,
            endsAt: periodEndsAt,
            status: "ACTIVE",
            paymentId: payment.id,
          },
        });
      } else if (payment.kind === "RENEWAL" || payment.kind === "DOWNGRADE") {
        if (currentActive && currentActive.endsAt > now) {
          // Queued period starting at currentPeriod.endsAt (#104)
          const queuedStartsAt = currentActive.endsAt;
          const queuedEndsAt = new Date(queuedStartsAt.getTime() + SUBSCRIPTION_PERIOD_MS);

          await tx.subscriptionPeriod.create({
            data: {
              id: uuidv7(),
              subscriptionId: sub.id,
              plan: payment.plan,
              kind: payment.kind,
              startsAt: queuedStartsAt,
              endsAt: queuedEndsAt,
              status: "SCHEDULED",
              paymentId: payment.id,
            },
          });
        } else {
          // Active period if previous expired
          await tx.subscriptionPeriod.create({
            data: {
              id: uuidv7(),
              subscriptionId: sub.id,
              plan: payment.plan,
              kind: payment.kind,
              startsAt: now,
              endsAt: periodEndsAt,
              status: "ACTIVE",
              paymentId: payment.id,
            },
          });
        }
      } else {
        // NEW subscription (#104)
        await tx.subscriptionPeriod.create({
          data: {
            id: uuidv7(),
            subscriptionId: sub.id,
            plan: payment.plan,
            kind: "NEW",
            startsAt: now,
            endsAt: periodEndsAt,
            status: "ACTIVE",
            paymentId: payment.id,
          },
        });
      }

      // 5. Audit Log
      await tx.auditLog.create({
        data: {
          id: uuidv7(),
          actorType: "AGENT",
          actorId: params.agentId,
          action: "AGENT_SUBSCRIPTION_ACTIVATED",
          entityType: "SubscriptionPayment",
          entityId: payment.id,
          metadata: {
            plan: payment.plan,
            kind: payment.kind,
            receiptNumber,
            amountMinor: params.grossAmount.toString(),
          },
        },
      });

      return { status: "succeeded", payment: updatedPayment };
    });
  }

  async cancelSubscription(agentId: string): Promise<Date> {
    const now = new Date();
    await prisma.agentSubscription.update({
      where: { agentId },
      data: {
        cancelledAt: now,
      },
    });
    return now;
  }

  async countPublicationsInCairoMonth(agentId: string, start: Date, end: Date): Promise<number> {
    return prisma.property.count({
      where: {
        agentId,
        publishedAt: {
          gte: start,
          lte: end,
        },
      },
    });
  }

  async countWaitingListings(agentId: string): Promise<number> {
    return prisma.property.count({
      where: {
        agentId,
        status: "PENDING_REVIEW",
        approvedWaitingForQuotaAt: { not: null },
      },
    });
  }

  async getWaitingListingsFIFO(agentId: string, limit: number) {
    return prisma.property.findMany({
      where: {
        agentId,
        status: "PENDING_REVIEW",
        approvedWaitingForQuotaAt: { not: null },
      },
      orderBy: {
        approvedWaitingForQuotaAt: "asc",
      },
      take: limit,
    });
  }

  async publishWaitingProperty(propertyId: string, publishedAt = new Date()) {
    return prisma.property.update({
      where: { id: propertyId },
      data: {
        status: "PUBLISHED",
        publishedAt,
        approvedWaitingForQuotaAt: null,
      },
    });
  }

  async advanceScheduledPeriods(now = new Date()): Promise<number> {
    // Scheduled periods whose startsAt has arrived transition to ACTIVE
    const duePeriods = await prisma.subscriptionPeriod.findMany({
      where: {
        status: "SCHEDULED",
        startsAt: { lte: now },
      },
    });

    for (const period of duePeriods) {
      await prisma.$transaction(async (tx) => {
        // supersede any expired active period for the subscription
        await tx.subscriptionPeriod.updateMany({
          where: {
            subscriptionId: period.subscriptionId,
            status: "ACTIVE",
            endsAt: { lte: now },
          },
          data: { status: "ENDED" },
        });

        await tx.subscriptionPeriod.update({
          where: { id: period.id },
          data: { status: "ACTIVE" },
        });
      });
    }

    return duePeriods.length;
  }

  async expireEndedPeriods(now = new Date()): Promise<number> {
    const expired = await prisma.subscriptionPeriod.updateMany({
      where: {
        status: "ACTIVE",
        endsAt: { lte: now },
      },
      data: {
        status: "ENDED",
      },
    });
    return expired.count;
  }
}

export const subscriptionRepository = new SubscriptionRepository();
