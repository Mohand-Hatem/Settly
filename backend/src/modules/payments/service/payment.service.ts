import { ProblemError } from "../../../shared/errors/problem-details.js";
import { paymentRepository } from "../repository/payment.repository.js";
import { paymobAdapter } from "../adapter/paymob.adapter.js";
import { notificationService } from "../../notifications/service/index.js";
import type { CheckoutInitiateResponse, DepositStatusResponse } from "../schema/payment.schema.js";

function problem(status: number, title: string, detail: string, type: string, params?: Record<string, unknown>) {
  return new ProblemError({ status, title, detail, type, params });
}

export class PaymentService {
  /**
   * Initiates reservation deposit checkout (Y2)
   * Acquires 15-minute exclusive checkout hold, creates Paymob hosted session,
   * transitions Payment PENDING -> PROCESSING, and records attempt.
   */
  async initiateCheckout(
    offerId: string,
    buyerId: string,
    returnUrl?: string
  ): Promise<CheckoutInitiateResponse> {
    const offer = await paymentRepository.findOfferForDeposit(offerId);

    if (!offer) {
      throw problem(404, "Not Found", "Offer not found", "/errors/offer-not-found");
    }

    if (offer.buyerId !== buyerId) {
      throw problem(403, "Forbidden", "You are not authorized to pay for this offer", "/errors/forbidden");
    }

    if (!offer.buyer.emailVerified) {
      throw problem(
        403,
        "Email Not Verified",
        "Email verification is required before paying reservation deposits (§9.1)",
        "/errors/email-not-verified"
      );
    }

    if (offer.status !== "ACCEPTED") {
      throw problem(
        409,
        "Offer Not Accepted",
        `Offer cannot be paid in current status (${offer.status}). It must be ACCEPTED.`,
        "/errors/offer-not-accepted"
      );
    }

    if (offer.property.status !== "PUBLISHED") {
      throw problem(
        409,
        "Property Unavailable",
        `Property is currently ${offer.property.status} and cannot accept new deposits.`,
        "/errors/property-unavailable"
      );
    }

    const payment = offer.payments[0];
    if (!payment) {
      throw problem(404, "Payment Not Found", "No active deposit payment found for this offer", "/errors/payment-not-found");
    }

    if (new Date() > payment.deadlineAt) {
      throw problem(
        410,
        "Deposit Deadline Expired",
        "The 72-hour deposit deadline has expired for this offer.",
        "/errors/deposit-deadline-expired"
      );
    }

    // Acquire 15-minute exclusive checkout hold on Property (Decision #11)
    const holdResult = await paymentRepository.acquireCheckoutHold(offer.propertyId, buyerId, 15);

    if (!holdResult.acquired && holdResult.heldByOther) {
      throw problem(
        409,
        "Checkout Hold Active",
        `Another buyer is currently completing checkout for this property. The hold expires in ${holdResult.remainingSeconds} seconds.`,
        "/errors/checkout-hold-active",
        { remainingSeconds: holdResult.remainingSeconds }
      );
    }

    const depositEgp = Number(payment.grossAmount);
    const amountPiastres = depositEgp * 100;
    const orderReference = `dep_${offer.id}`;
    const defaultReturnUrl =
      returnUrl ||
      `${process.env.FRONTEND_URL || "http://localhost:3000"}/buyer/offers/${offer.id}/deposit/callback`;

    // Create payment attempt record
    const attempt = await paymentRepository.createAttempt(payment.id, "PAYMOB");

    // Call Paymob adapter
    const checkoutResult = await paymobAdapter.createCheckout({
      amountPiastres,
      currency: "EGP",
      orderReference,
      buyer: {
        name: offer.buyer.name || "Buyer",
        email: offer.buyer.email,
        phone: offer.buyer.phone || "01000000000",
      },
      returnUrl: defaultReturnUrl,
    });

    // Update attempt to REDIRECTED
    await paymentRepository.updateAttempt(attempt.id, {
      status: "REDIRECTED",
      providerTransactionId: checkoutResult.providerOrderId,
    });

    // Advance Payment to PROCESSING
    await paymentRepository.updatePayment(payment.id, {
      status: "PROCESSING",
    });

    return {
      checkoutUrl: checkoutResult.redirectUrl,
      orderReference,
      amountEgp: depositEgp,
      holdExpiresAt: holdResult.expiresAt ? holdResult.expiresAt.toISOString() : new Date().toISOString(),
      isSimulated: checkoutResult.isSimulated,
    };
  }

  /**
   * Status polling endpoint for deposit checkout and return verification (SH-05)
   */
  async getDepositStatus(offerId: string, userId: string): Promise<DepositStatusResponse> {
    const offer = await paymentRepository.findOfferForDeposit(offerId);

    if (!offer) {
      throw problem(404, "Not Found", "Offer not found", "/errors/offer-not-found");
    }

    const payment = offer.payments[0];
    if (!payment) {
      throw problem(404, "Payment Not Found", "Payment record not found", "/errors/payment-not-found");
    }

    const now = Date.now();
    const holdExpiresAt = offer.property.checkoutHoldExpiresAt;
    const holdExpiryMs = holdExpiresAt?.getTime() ?? 0;
    const remainingSeconds = Math.max(0, Math.ceil((holdExpiryMs - now) / 1000));
    const isHeldByCaller = offer.property.checkoutHoldUserId === userId && remainingSeconds > 0;
    const anotherBuyerHolding =
      offer.property.checkoutHoldUserId !== null &&
      offer.property.checkoutHoldUserId !== userId &&
      remainingSeconds > 0;

    return {
      offerId: offer.id,
      propertyId: offer.property.id,
      paymentStatus: payment.status as DepositStatusResponse["paymentStatus"],
      offerStatus: offer.status,
      propertyStatus: offer.property.status,
      depositAmount: Number(payment.grossAmount),
      depositDeadlineAt: payment.deadlineAt ? payment.deadlineAt.toISOString() : null,
      holdExpiresAt: holdExpiresAt ? holdExpiresAt.toISOString() : null,
      isHeldByCaller,
      anotherBuyerHolding,
      holdRemainingSeconds: remainingSeconds,
    };
  }

  /**
   * Processes Paymob Webhook (Y4)
   * 1. Verifies HMAC
   * 2. Checks amount and currency
   * 3. Executes Atomic Bundle T1
   */
  async handleWebhook(payload: Record<string, any>, signature: string): Promise<{ success: boolean; reason?: string }> {
    // 1. Verify HMAC
    const isValid = paymobAdapter.verifyWebhook(payload, signature);
    if (!isValid) {
      throw problem(401, "Unauthorized", "Invalid Paymob webhook signature", "/errors/invalid-signature");
    }

    const obj = payload.obj || payload;
    const eventId = String(obj.id || payload.id);
    const orderReference = String(obj.order?.merchant_order_id || obj.merchant_order_id || "");

    if (!orderReference.startsWith("dep_")) {
      return { success: true, reason: "ignored_non_deposit_event" };
    }

    const payment = await paymentRepository.findPaymentByOrderReference(orderReference);
    if (!payment) {
      return { success: false, reason: "payment_not_found" };
    }

    // 2. Exact amount & currency check (Fraud check, PAYMENTS.md §6 step 5)
    const receivedCents = Number(obj.amount_cents);
    const expectedCents = Number(payment.grossAmount) * 100;
    const receivedCurrency = String(obj.currency || "EGP").toUpperCase();

    if (receivedCents !== expectedCents || receivedCurrency !== "EGP") {
      throw problem(
        400,
        "Amount Mismatch",
        `Amount or currency mismatch: expected ${expectedCents} EGP piastres, received ${receivedCents} ${receivedCurrency}`,
        "/errors/amount-currency-mismatch"
      );
    }

    const isSuccess = Boolean(obj.success === true && obj.pending === false);

    if (isSuccess) {
      // 3. Execute Atomic Bundle (T1)
      const result = await paymentRepository.executeAtomicBundle({
        paymentId: payment.id,
        attemptId: payment.attempts[0]?.id,
        offerId: payment.offerId,
        propertyId: payment.offer.propertyId,
        buyerId: payment.buyerId,
        provider: "PAYMOB",
        eventId,
        providerTransactionId: String(obj.id),
        grossAmount: payment.grossAmount,
        payload,
      });

      // Notify buyer of confirmed reservation
      void notificationService
        .notifyUser({
          userId: payment.buyerId,
          type: "DEPOSIT_CONFIRMED",
          params: {
            offerId: payment.offerId,
            propertyTitle: payment.offer.property.titleEn,
            amountEgp: Math.round(Number(payment.grossAmount)),
            recipientRole: "buyer",
          },
          sendEmail: true,
        })
        .catch(() => {});

      // Notify agent of confirmed reservation
      void notificationService
        .notifyUser({
          userId: payment.offer.property.agentId,
          type: "DEPOSIT_CONFIRMED",
          params: {
            offerId: payment.offerId,
            propertyTitle: payment.offer.property.titleEn,
            amountEgp: Math.round(Number(payment.grossAmount)),
            recipientRole: "agent",
          },
          sendEmail: true,
        })
        .catch(() => {});

      return { success: true, reason: result.status };
    } else {
      // Failed attempt: update attempt, release hold, return payment to PENDING so buyer can retry
      if (payment.attempts[0]) {
        await paymentRepository.updateAttempt(payment.attempts[0].id, {
          status: "FAILED",
          errorMessage: obj.data?.message || "Transaction declined by provider",
        });
      }

      await paymentRepository.updatePayment(payment.id, {
        status: "PENDING",
      });

      await paymentRepository.releaseCheckoutHold(payment.offer.propertyId, payment.buyerId);

      return { success: false, reason: "transaction_declined" };
    }
  }

  async countFailedRefunds(): Promise<number> {
    return await paymentRepository.countFailedRefunds();
  }
}

export const paymentService = new PaymentService();
