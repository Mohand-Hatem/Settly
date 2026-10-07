import { ProblemError } from "../../../shared/errors/problem-details.js";
import { subscriptionRepository } from "../repository/subscription.repository.js";
import { paymobAdapter } from "../adapter/paymob.adapter.js";
import { notificationService } from "../../notifications/service/index.js";
import {
  CHECKOUT_LIFETIME_MS,
  RENEWAL_WINDOW_MS,
  SUBSCRIPTION_PLANS,
  getCairoMonthRange,
  type SubscriptionPeriodKindName,
  type SubscriptionPlanName,
} from "../types/subscription.types.js";
import type {
  SubscriptionCheckoutRequest,
  SubscriptionCheckoutResponse,
  SubscriptionStatusResponse,
  SubscriptionCancelResponse,
} from "../schema/subscription.schema.js";

function problem(status: number, title: string, detail: string, type: string, params?: Record<string, unknown>) {
  return new ProblemError({ status, title, detail, type, params });
}

export class SubscriptionService {
  /**
   * Retrieves agent subscription status, current active/queued periods,
   * quota telemetry for Cairo calendar month, and renewal eligibility (SUB-01, SUB-04, SUB-09).
   */
  async getSubscriptionStatus(agentId: string): Promise<SubscriptionStatusResponse> {
    const user = await subscriptionRepository.findAgent(agentId);
    if (!user) {
      throw problem(404, "Not Found", "User not found", "/errors/user-not-found");
    }

    const isVerified = Boolean(user.agentProfile?.isVerified);
    const sub = await subscriptionRepository.getAgentSubscription(agentId);
    const now = new Date();

    const activePeriod = sub?.periods.find(
      (p) =>
        p.status === "ACTIVE" &&
        p.startsAt <= now &&
        (p.endedEarlyAt ? p.endedEarlyAt > now : p.endsAt > now)
    );

    const queuedPeriod = sub?.periods.find((p) => p.status === "SCHEDULED");

    const effectivePlan: SubscriptionPlanName = (activePeriod?.plan as SubscriptionPlanName) || "FREE";
    const planConfig = SUBSCRIPTION_PLANS[effectivePlan];

    // Cairo month quota
    const { start, end, resetDate } = getCairoMonthRange(now);
    const used = await subscriptionRepository.countPublicationsInCairoMonth(agentId, start, end);
    const waitingCount = await subscriptionRepository.countWaitingListings(agentId);
    const total = planConfig.quota;
    const remaining = Math.max(0, total - used);

    // Renewal & Upgrade eligibility (#104)
    let canRenew = false;
    let renewalBlockedReason: string | null = null;

    if (effectivePlan === "FREE") {
      canRenew = false;
      renewalBlockedReason = "Free plan does not require renewal. Select a plan to upgrade.";
    } else if (queuedPeriod) {
      canRenew = false;
      renewalBlockedReason = "A renewal period is already queued (#104). At most one queued period is allowed.";
    } else if (activePeriod) {
      const renewalWindowStartsAt = new Date(activePeriod.endsAt.getTime() - RENEWAL_WINDOW_MS);
      if (now >= renewalWindowStartsAt) {
        canRenew = true;
      } else {
        canRenew = false;
        const daysLeft = Math.ceil((renewalWindowStartsAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
        renewalBlockedReason = `Renewal is only available in the last 7 days of your active period (available in ${daysLeft} days).`;
      }
    }

    let canUpgrade = false;
    let upgradeBlockedReason: string | null = null;

    if (effectivePlan === "ENTERPRISE") {
      canUpgrade = false;
      upgradeBlockedReason = "Already on the highest plan (Enterprise).";
    } else if (queuedPeriod) {
      canUpgrade = false;
      upgradeBlockedReason = "Upgrades are blocked while a renewal is queued until that period starts (#104).";
    } else {
      canUpgrade = true;
    }

    // Receipts
    const receiptsRaw = await subscriptionRepository.getReceipts(agentId);
    const receipts = receiptsRaw.map((r) => ({
      id: r.id,
      receiptNumber: r.receiptNumber,
      plan: r.plan as SubscriptionPlanName,
      kind: r.kind as SubscriptionPeriodKindName,
      amountEgp: Number(r.chargedAmountMinor) / 100,
      amountUsd: Number(r.baseAmountMinor) / 100,
      fxRate: Number(r.fxRate),
      paidAt: r.paidAt ? r.paidAt.toISOString() : null,
      status: r.status,
    }));

    return {
      plan: effectivePlan,
      isVerified,
      quota: {
        used,
        total,
        remaining,
        resetDate: resetDate.toISOString(),
        waitingCount,
      },
      currentPeriod: activePeriod
        ? {
            id: activePeriod.id,
            plan: activePeriod.plan as SubscriptionPlanName,
            kind: activePeriod.kind as SubscriptionPeriodKindName,
            startsAt: activePeriod.startsAt.toISOString(),
            endsAt: activePeriod.endsAt.toISOString(),
            status: activePeriod.status,
          }
        : null,
      queuedPeriod: queuedPeriod
        ? {
            id: queuedPeriod.id,
            plan: queuedPeriod.plan as SubscriptionPlanName,
            kind: queuedPeriod.kind as SubscriptionPeriodKindName,
            startsAt: queuedPeriod.startsAt.toISOString(),
            endsAt: queuedPeriod.endsAt.toISOString(),
            status: queuedPeriod.status,
          }
        : null,
      canRenew,
      canUpgrade,
      renewalBlockedReason,
      upgradeBlockedReason,
      cancelledAt: sub?.cancelledAt ? sub.cancelledAt.toISOString() : null,
      receipts,
    };
  }

  /**
   * Initiates Paymob hosted checkout for Agent Subscription (SUB-02, Decisions #89, #103, #104, #105)
   */
  async initiateCheckout(
    agentId: string,
    input: SubscriptionCheckoutRequest
  ): Promise<SubscriptionCheckoutResponse> {
    const user = await subscriptionRepository.findAgent(agentId);
    if (!user) {
      throw problem(404, "Not Found", "User not found", "/errors/user-not-found");
    }

    if (!user.agentProfile?.isVerified) {
      throw problem(
        403,
        "Agent Unverified",
        "Only verified agents can subscribe to paid listing tiers (#51, #93).",
        "/errors/unverified-agent"
      );
    }

    const currentStatus = await this.getSubscriptionStatus(agentId);
    const now = new Date();

    let kind: SubscriptionPeriodKindName = "NEW";

    if (currentStatus.plan === "FREE") {
      kind = "NEW";
    } else if (currentStatus.plan === "PRO") {
      if (input.plan === "ENTERPRISE") {
        if (currentStatus.queuedPeriod) {
          throw problem(
            409,
            "Upgrade Blocked",
            "Upgrades are blocked while a renewal is queued (#104).",
            "/errors/renewal-queued-upgrade-blocked"
          );
        }
        kind = "UPGRADE";
      } else {
        // Renewing PRO
        if (!currentStatus.canRenew) {
          throw problem(
            409,
            "Renewal Not Allowed",
            currentStatus.renewalBlockedReason || "Renewal is only allowed in the last 7 days of an active period.",
            "/errors/renewal-blocked"
          );
        }
        kind = "RENEWAL";
      }
    } else if (currentStatus.plan === "ENTERPRISE") {
      if (input.plan === "ENTERPRISE") {
        // Renewing ENTERPRISE
        if (!currentStatus.canRenew) {
          throw problem(
            409,
            "Renewal Not Allowed",
            currentStatus.renewalBlockedReason || "Renewal is only allowed in the last 7 days of an active period.",
            "/errors/renewal-blocked"
          );
        }
        kind = "RENEWAL";
      } else {
        // Downgrading to PRO
        if (currentStatus.queuedPeriod) {
          throw problem(
            409,
            "Downgrade Blocked",
            "A renewal or scheduled period is already queued.",
            "/errors/downgrade-blocked"
          );
        }
        if (!currentStatus.canRenew) {
          throw problem(
            409,
            "Downgrade Not Allowed",
            "Downgrading to a lower paid plan can only be scheduled in the last 7 days of the active period (#105).",
            "/errors/downgrade-too-early"
          );
        }
        kind = "DOWNGRADE";
      }
    }

    const planConfig = SUBSCRIPTION_PLANS[input.plan];
    const baseAmountMinor = BigInt(planConfig.baseAmountCents);
    const chargedAmountMinor = BigInt(planConfig.chargedAmountPiastres);
    const expiresAt = new Date(now.getTime() + CHECKOUT_LIFETIME_MS);

    // Cancel any previous open checkouts for this agent (#105)
    await subscriptionRepository.cancelOpenCheckouts(agentId);

    // Create Payment & Attempt
    const { payment, attempt } = await subscriptionRepository.createCheckoutRecord({
      agentId,
      plan: input.plan,
      kind,
      baseAmountMinor,
      fxRate: planConfig.fxRate,
      chargedAmountMinor,
      expiresAt,
      provider: "PAYMOB",
    });

    const orderReference = `sub_${payment.id}`;
    const defaultReturnUrl =
      input.returnUrl ||
      `${process.env.FRONTEND_URL || "http://localhost:3000"}/agent/subscription/callback`;

    // Paymob Hosted Checkout
    const checkoutResult = await paymobAdapter.createCheckout({
      amountPiastres: planConfig.chargedAmountPiastres,
      currency: "EGP",
      orderReference,
      buyer: {
        name: user.name || "Agent",
        email: user.email,
        phone: user.phone || "01000000000",
      },
      returnUrl: defaultReturnUrl,
    });

    // Advance attempt to REDIRECTED & payment to PROCESSING
    await subscriptionRepository.updateAttempt(attempt.id, {
      status: "REDIRECTED",
      providerTransactionId: checkoutResult.providerOrderId,
    });

    await subscriptionRepository.updatePayment(payment.id, {
      status: "PROCESSING",
    });

    return {
      checkoutUrl: checkoutResult.redirectUrl,
      orderReference,
      amountEgp: planConfig.chargedPriceEgp,
      amountUsd: planConfig.basePriceUsd,
      plan: input.plan,
      kind,
      expiresAt: expiresAt.toISOString(),
      isSimulated: checkoutResult.isSimulated,
    };
  }

  /**
   * Cancels subscription renewal (#91, #105, SUB-07).
   * Active and queued periods continue running until their end date (no refund).
   */
  async cancelSubscription(agentId: string): Promise<SubscriptionCancelResponse> {
    const sub = await subscriptionRepository.getAgentSubscription(agentId);
    if (!sub) {
      throw problem(404, "Not Found", "No subscription found to cancel", "/errors/subscription-not-found");
    }

    const cancelledAt = await subscriptionRepository.cancelSubscription(agentId);

    return {
      success: true,
      cancelledAt: cancelledAt.toISOString(),
      message: "Subscription cancelled. Your paid plan remains active until the end of the paid period (#91).",
    };
  }

  /**
   * Processes Paymob Webhook for Subscription payments (Y4 / sub_*)
   */
  async handleSubscriptionWebhook(
    payload: Record<string, any>,
    signature: string
  ): Promise<{ success: boolean; reason?: string }> {
    const isValid = paymobAdapter.verifyWebhook(payload, signature);
    if (!isValid) {
      throw problem(401, "Unauthorized", "Invalid Paymob webhook signature", "/errors/invalid-signature");
    }

    const obj = payload.obj || payload;
    const eventId = String(obj.id || payload.id);
    const orderReference = String(obj.order?.merchant_order_id || obj.merchant_order_id || "");

    const payment = await subscriptionRepository.findPaymentByOrderReference(orderReference);
    if (!payment) {
      return { success: false, reason: "subscription_payment_not_found" };
    }

    // Exact amount & currency check (#105)
    const receivedCents = Number(obj.amount_cents);
    const expectedCents = Number(payment.chargedAmountMinor);
    const receivedCurrency = String(obj.currency || "EGP").toUpperCase();

    if (receivedCents !== expectedCents || receivedCurrency !== "EGP") {
      throw problem(
        400,
        "Amount Mismatch",
        `Subscription payment mismatch: expected ${expectedCents} EGP piastres, received ${receivedCents} ${receivedCurrency}`,
        "/errors/amount-currency-mismatch"
      );
    }

    const isSuccess = Boolean(obj.success === true && obj.pending === false);

    if (isSuccess) {
      const result = await subscriptionRepository.executeSubscriptionWebhookSuccess({
        paymentId: payment.id,
        attemptId: payment.attempts[0]?.id,
        agentId: payment.agentId,
        providerTransactionId: String(obj.id),
        grossAmount: payment.chargedAmountMinor,
      });

      // Release waiting listings FIFO up to newly available quota (#94)
      await this.releaseWaitingListings(payment.agentId);

      // Notify Agent
      void notificationService
        .notifyUser({
          userId: payment.agentId,
          type: "SUBSCRIPTION_ACTIVATED",
          params: {
            plan: payment.plan,
            kind: payment.kind,
            amountEgp: Number(payment.chargedAmountMinor) / 100,
            recipientRole: "agent",
          },
          sendEmail: true,
        })
        .catch(() => {});

      return { success: true, reason: result.status };
    } else {
      if (payment.attempts[0]) {
        await subscriptionRepository.updateAttempt(payment.attempts[0].id, {
          status: "FAILED",
          errorMessage: obj.data?.message || "Payment declined by provider",
        });
      }

      await subscriptionRepository.updatePayment(payment.id, {
        status: "PENDING",
      });

      return { success: false, reason: "transaction_declined" };
    }
  }

  /**
   * Releases waiting listings FIFO up to available quota for an agent (#94)
   */
  async releaseWaitingListings(agentId: string): Promise<number> {
    const now = new Date();
    const status = await this.getSubscriptionStatus(agentId);
    const available = status.quota.remaining;

    if (available <= 0) return 0;

    const waiting = await subscriptionRepository.getWaitingListingsFIFO(agentId, available);
    let publishedCount = 0;

    for (const property of waiting) {
      await subscriptionRepository.publishWaitingProperty(property.id, now);
      publishedCount++;

      void notificationService
        .notifyUser({
          userId: agentId,
          type: "LISTING_PUBLISHED_FROM_QUOTA",
          params: {
            propertyId: property.id,
            propertyTitle: property.titleEn || "Listing",
            recipientRole: "agent",
          },
          sendEmail: true,
        })
        .catch(() => {});
    }

    return publishedCount;
  }

  /**
   * Exported helper for Catalog module to inspect quota availability during admin listing approval (Invariant I13)
   */
  async getQuotaUsage(agentId: string): Promise<{
    plan: SubscriptionPlanName;
    used: number;
    total: number;
    remaining: number;
    hasQuota: boolean;
  }> {
    const status = await this.getSubscriptionStatus(agentId);
    return {
      plan: status.plan,
      used: status.quota.used,
      total: status.quota.total,
      remaining: status.quota.remaining,
      hasQuota: status.quota.remaining > 0,
    };
  }

  /**
   * Sweepers for worker: period activation and expiry
   */
  async advanceScheduledPeriods(now = new Date()): Promise<number> {
    return subscriptionRepository.advanceScheduledPeriods(now);
  }

  async expireEndedPeriods(now = new Date()): Promise<number> {
    return subscriptionRepository.expireEndedPeriods(now);
  }
}

export const subscriptionService = new SubscriptionService();
