import { prisma } from "../../../shared/database/prisma.js";
import { uuidv7 } from "uuidv7";
import type { Prisma } from "@prisma/client";

export class PaymentRepository {
  /**
   * Finds an offer with buyer, property, active payment, and latest revision for deposit processing
   */
  async findOfferForDeposit(offerId: string) {
    return prisma.offer.findUnique({
      where: { id: offerId },
      include: {
        buyer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            emailVerified: true,
          },
        },
        property: {
          select: {
            id: true,
            slug: true,
            titleEn: true,
            price: true,
            status: true,
            checkoutHoldExpiresAt: true,
            checkoutHoldUserId: true,
            images: {
              take: 1,
              orderBy: { order: "asc" },
              select: { url: true },
            },
          },
        },
        payments: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        revisions: {
          orderBy: { revisionNumber: "desc" },
          take: 1,
        },
      },
    });
  }

  /**
   * Acquires the 15-minute exclusive checkout hold conditionally (Decision #11, Concurrency §5)
   * Prevents payment race before money moves.
   */
  async acquireCheckoutHold(
    propertyId: string,
    buyerId: string,
    holdDurationMinutes: number = 15
  ): Promise<{
    acquired: boolean;
    expiresAt: Date | null;
    heldByOther: boolean;
    remainingSeconds: number;
  }> {
    const expiresAt = new Date(Date.now() + holdDurationMinutes * 60 * 1000);

    // Atomic conditional update
    const updated = await prisma.$executeRaw`
      UPDATE "Property"
      SET "checkoutHoldExpiresAt" = ${expiresAt},
          "checkoutHoldUserId" = ${buyerId},
          "updatedAt" = NOW()
      WHERE "id" = ${propertyId}
        AND (
          "checkoutHoldExpiresAt" IS NULL
          OR "checkoutHoldExpiresAt" < NOW()
          OR "checkoutHoldUserId" = ${buyerId}
        )
    `;

    if (updated > 0) {
      return {
        acquired: true,
        expiresAt,
        heldByOther: false,
        remainingSeconds: holdDurationMinutes * 60,
      };
    }

    // If update failed, another buyer holds an active hold
    const current = await prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        checkoutHoldExpiresAt: true,
        checkoutHoldUserId: true,
      },
    });

    const now = Date.now();
    const currentExpires = current?.checkoutHoldExpiresAt?.getTime() ?? 0;
    const remainingSeconds = Math.max(0, Math.ceil((currentExpires - now) / 1000));

    return {
      acquired: false,
      expiresAt: current?.checkoutHoldExpiresAt ?? null,
      heldByOther: current?.checkoutHoldUserId !== buyerId && remainingSeconds > 0,
      remainingSeconds,
    };
  }

  /**
   * Releases checkout hold when checkout is cancelled or fails
   */
  async releaseCheckoutHold(propertyId: string, buyerId: string): Promise<void> {
    await prisma.$executeRaw`
      UPDATE "Property"
      SET "checkoutHoldExpiresAt" = NULL,
          "checkoutHoldUserId" = NULL,
          "updatedAt" = NOW()
      WHERE "id" = ${propertyId}
        AND "checkoutHoldUserId" = ${buyerId}
    `;
  }

  /**
   * Records a payment attempt
   */
  async createAttempt(
    paymentId: string,
    provider: string,
    providerTransactionId?: string
  ) {
    return prisma.paymentAttempt.create({
      data: {
        id: uuidv7(),
        paymentId,
        provider,
        providerTransactionId: providerTransactionId ?? null,
        status: "INITIATED",
      },
    });
  }

  /**
   * Updates payment attempt status
   */
  async updateAttempt(
    attemptId: string,
    data: {
      status: "INITIATED" | "REDIRECTED" | "SUCCEEDED" | "FAILED" | "ABANDONED" | "EXPIRED";
      providerTransactionId?: string;
      errorMessage?: string;
    }
  ) {
    return prisma.paymentAttempt.update({
      where: { id: attemptId },
      data: {
        status: data.status,
        providerTransactionId: data.providerTransactionId,
        errorMessage: data.errorMessage,
      },
    });
  }

  /**
   * Updates payment record
   */
  async updatePayment(
    paymentId: string,
    data: {
      status?: "PENDING" | "PROCESSING" | "SUCCEEDED" | "CANCELLED" | "EXPIRED" | "REFUNDED" | "PARTIALLY_REFUNDED";
      paidAt?: Date;
      feeAmount?: bigint;
      netAmount?: bigint;
    }
  ) {
    return prisma.payment.update({
      where: { id: paymentId },
      data,
    });
  }

  /**
   * Maps an order reference (`dep_...`) to Payment and its Offer
   */
  async findPaymentByOrderReference(orderReference: string) {
    // Reference format: dep_{offerId}
    const offerId = orderReference.replace(/^dep_/, "");
    return prisma.payment.findFirst({
      where: { offerId },
      include: {
        offer: {
          include: {
            property: true,
            buyer: true,
          },
        },
        attempts: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });
  }

  /**
   * Finds payment by ID
   */
  async findPaymentById(paymentId: string) {
    return prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        offer: {
          include: {
            property: true,
            buyer: true,
          },
        },
        attempts: {
          orderBy: { createdAt: "desc" },
        },
      },
    });
  }

  /**
   * Checks if an incoming webhook event was already processed (Idempotency)
   */
  async isWebhookProcessed(provider: string, eventId: string): Promise<boolean> {
    const existing = await prisma.webhookEvent.findUnique({
      where: {
        provider_eventId: {
          provider,
          eventId,
        },
      },
    });
    return Boolean(existing);
  }

  /**
   * Executes the Atomic Bundle (T1) on verified deposit webhook
   * Per PAYMENTS.md §7 & BUSINESS_RULES.md §6.3:
   * 1. Record WebhookEvent as processed (deduplication)
   * 2. Payment PROCESSING -> SUCCEEDED
   * 3. PaymentAttempt -> SUCCEEDED
   * 4. Offer ACCEPTED -> RESERVED (commitment point)
   * 5. Property PUBLISHED -> RESERVED, clear checkout hold
   * 6. Rival Offers -> SUPERSEDED
   * 7. Rival Payments -> CANCELLED
   * 8. AuditLog entries written
   */
  async executeAtomicBundle(params: {
    paymentId: string;
    attemptId?: string;
    offerId: string;
    propertyId: string;
    buyerId: string;
    provider: string;
    eventId: string;
    providerTransactionId: string;
    grossAmount: bigint;
    payload: any;
  }): Promise<{ status: "ok" | "already_processed" | "residual_race_lost" }> {
    return prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        // 1. Deduplication check
        const existingEvent = await tx.webhookEvent.findUnique({
          where: {
            provider_eventId: {
              provider: params.provider,
              eventId: params.eventId,
            },
          },
        });
        if (existingEvent) {
          return { status: "already_processed" as const };
        }

        // Insert WebhookEvent
        await tx.webhookEvent.create({
          data: {
            id: uuidv7(),
            provider: params.provider,
            eventId: params.eventId,
            eventType: "TRANSACTION",
            payload: params.payload,
            processedAt: new Date(),
          },
        });

        // Check if property is already RESERVED or SOLD to another offer (residual race, §6.2)
        const currentProperty = await tx.property.findUniqueOrThrow({
          where: { id: params.propertyId },
          select: { status: true },
        });

        const currentOffer = await tx.offer.findUniqueOrThrow({
          where: { id: params.offerId },
          select: { status: true },
        });

        // 2. Mark Payment as SUCCEEDED (it did succeed financially)
        await tx.payment.update({
          where: { id: params.paymentId },
          data: {
            status: "SUCCEEDED",
            paidAt: new Date(),
          },
        });

        if (params.attemptId) {
          await tx.paymentAttempt.update({
            where: { id: params.attemptId },
            data: {
              status: "SUCCEEDED",
              providerTransactionId: params.providerTransactionId,
            },
          });
        }

        // Residual race condition: Property was already reserved by a rival while hold expired mid-checkout
        if (currentProperty.status === "RESERVED" || currentProperty.status === "SOLD") {
          // Supersede the loser's offer and mark for full automatic refund per §6.2
          await tx.offer.update({
            where: { id: params.offerId },
            data: {
              status: "SUPERSEDED",
              withdrawalReason: "Property reserved by rival deposit while checkout was in flight; full refund initiated.",
            },
          });

          // Insert AuditLog for race loss
          await tx.auditLog.create({
            data: {
              id: uuidv7(),
              actorType: "SYSTEM",
              actorId: "system",
              action: "RESIDUAL_RACE_LOST",
              entityType: "Offer",
              entityId: params.offerId,
              metadata: {
                propertyId: params.propertyId,
                paymentId: params.paymentId,
                note: "Residual race lost (§6.2). Full automatic refund required.",
              },
            },
          });

          return { status: "residual_race_lost" as const };
        }

        // Normal atomic bundle execution (The winner):
        // 4. Offer ACCEPTED -> RESERVED
        await tx.offer.update({
          where: { id: params.offerId },
          data: {
            status: "RESERVED",
          },
        });

        // 5. Property PUBLISHED -> RESERVED, clear checkout hold
        await tx.property.update({
          where: { id: params.propertyId },
          data: {
            status: "RESERVED",
            checkoutHoldExpiresAt: null,
            checkoutHoldUserId: null,
          },
        });

        // 6. Rival offers -> SUPERSEDED (O12)
        await tx.offer.updateMany({
          where: {
            propertyId: params.propertyId,
            id: { not: params.offerId },
            status: { in: ["PENDING_AGENT", "PENDING_BUYER", "ACCEPTED"] },
          },
          data: {
            status: "SUPERSEDED",
          },
        });

        // 7. Rival pending payments -> CANCELLED
        await tx.payment.updateMany({
          where: {
            offer: {
              propertyId: params.propertyId,
              id: { not: params.offerId },
            },
            status: "PENDING",
          },
          data: {
            status: "CANCELLED",
          },
        });

        // 8. AuditLog entries
        await tx.auditLog.create({
          data: {
            id: uuidv7(),
            actorType: "SYSTEM",
            actorId: "system",
            action: "OFFER_RESERVED",
            entityType: "Offer",
            entityId: params.offerId,
            metadata: {
              paymentId: params.paymentId,
              propertyId: params.propertyId,
              grossAmount: Number(params.grossAmount),
            },
          },
        });

        await tx.auditLog.create({
          data: {
            id: uuidv7(),
            actorType: "SYSTEM",
            actorId: "system",
            action: "PROPERTY_RESERVED",
            entityType: "Property",
            entityId: params.propertyId,
            metadata: {
              reservedByOfferId: params.offerId,
              buyerId: params.buyerId,
            },
          },
        });

        return { status: "ok" as const };
      },
      { maxWait: 15000, timeout: 30000 }
    );
  }
}

export const paymentRepository = new PaymentRepository();
