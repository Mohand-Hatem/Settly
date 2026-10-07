import pino from "pino";
import { env } from "./config/index.js";
import { viewingService, offerService } from "./modules/pipeline/index.js";
import { paymentService, subscriptionService } from "./modules/payments/index.js";
import { knowledgeService } from "./modules/knowledge/index.js";
import { identityService } from "./modules/identity/index.js";
import { pruneExpiredIdempotencyKeys } from "./shared/database/idempotency.js";

export const workerLogger = pino({
  level: env.NODE_ENV === "production" ? "info" : "debug",
  transport:
    env.NODE_ENV !== "production"
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "HH:MM:ss.l",
            ignore: "pid,hostname",
          },
        }
      : undefined,
});

async function startWorker() {
  workerLogger.info({ service: "settly-worker", env: env.NODE_ENV }, "Settly Worker process initializing...");

  // Registered scheduled jobs (Business Rules §1, §3, §4, §5, §6.1, RAG.md §6)
  const registeredSchedulers = [
    "viewing-expiry",
    "deposit-expiry",
    "offer-expiry",
    "checkout-hold-expiry",
    "payment-reconciliation",
    "idempotency-cleanup",
    "session-cleanup",
    "rag-drift-sweep",
    "subscription-periods",
  ];

  workerLogger.info(
    { schedulers: registeredSchedulers },
    `Settly Worker: ${registeredSchedulers.length} scheduled jobs configured and running`
  );

  // 1. V10 viewing expiry (BUSINESS_RULES §3): open requests whose time has passed become EXPIRED.
  const VIEWING_EXPIRY_INTERVAL_MS = 5 * 60 * 1000;
  const runViewingExpiry = async () => {
    try {
      const expired = await viewingService.expireStaleRequests();
      if (expired > 0) workerLogger.info({ expired }, "viewing-expiry: requests expired");
    } catch (err) {
      workerLogger.error({ err }, "viewing-expiry failed");
    }
  };
  void runViewingExpiry();
  const viewingExpiryTimer = setInterval(runViewingExpiry, VIEWING_EXPIRY_INTERVAL_MS);

  // 2. O9 / Y6 deposit expiry: 72h deadline on ACCEPTED offers passed unpaid.
  const DEPOSIT_EXPIRY_INTERVAL_MS = 5 * 60 * 1000;
  const runDepositExpiry = async () => {
    try {
      const expired = await offerService.expireStaleAcceptedOffers();
      if (expired > 0) workerLogger.info({ expired }, "deposit-expiry: accepted offers expired unpaid");
    } catch (err) {
      workerLogger.error({ err }, "deposit-expiry failed");
    }
  };
  void runDepositExpiry();
  const depositExpiryTimer = setInterval(runDepositExpiry, DEPOSIT_EXPIRY_INTERVAL_MS);

  // 3. O10 offer expiry: 7-day TTL on unanswered pending offers.
  const OFFER_EXPIRY_INTERVAL_MS = 10 * 60 * 1000;
  const runOfferExpiry = async () => {
    try {
      const expired = await offerService.expireStalePendingOffers();
      if (expired > 0) workerLogger.info({ expired }, "offer-expiry: pending offers expired after 7d TTL");
    } catch (err) {
      workerLogger.error({ err }, "offer-expiry failed");
    }
  };
  void runOfferExpiry();
  const offerExpiryTimer = setInterval(runOfferExpiry, OFFER_EXPIRY_INTERVAL_MS);

  // 4. §6.1 Checkout hold release: clears 15-min exclusive holds that naturally expired.
  const HOLD_EXPIRY_INTERVAL_MS = 60 * 1000; // 1 minute
  const runHoldExpiry = async () => {
    try {
      const cleared = await paymentService.clearExpiredCheckoutHolds();
      if (cleared > 0) workerLogger.info({ cleared }, "checkout-hold-expiry: expired holds released");
    } catch (err) {
      workerLogger.error({ err }, "checkout-hold-expiry failed");
    }
  };
  void runHoldExpiry();
  const holdExpiryTimer = setInterval(runHoldExpiry, HOLD_EXPIRY_INTERVAL_MS);

  // 5. §5.1 Payment reconciliation poller: polls Paymob for stale PROCESSING payments.
  const RECONCILIATION_INTERVAL_MS = 5 * 60 * 1000;
  const runPaymentReconciliation = async () => {
    try {
      const reconciled = await paymentService.reconcileStalePayments();
      if (reconciled > 0) workerLogger.info({ reconciled }, "payment-reconciliation: stale payments reconciled");
    } catch (err) {
      workerLogger.error({ err }, "payment-reconciliation failed");
    }
  };
  void runPaymentReconciliation();
  const reconciliationTimer = setInterval(runPaymentReconciliation, RECONCILIATION_INTERVAL_MS);

  // 6. Security & Hygiene: Prunes expired idempotency keys (24h TTL).
  const IDEMPOTENCY_CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
  const runIdempotencyCleanup = async () => {
    try {
      const pruned = await pruneExpiredIdempotencyKeys();
      if (pruned > 0) workerLogger.info({ pruned }, "idempotency-cleanup: expired keys pruned");
    } catch (err) {
      workerLogger.error({ err }, "idempotency-cleanup failed");
    }
  };
  void runIdempotencyCleanup();
  const idempotencyCleanupTimer = setInterval(runIdempotencyCleanup, IDEMPOTENCY_CLEANUP_INTERVAL_MS);

  // 7. Security & Hygiene: Prunes expired Better Auth sessions.
  const SESSION_CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
  const runSessionCleanup = async () => {
    try {
      const pruned = await identityService.pruneExpiredSessions();
      if (pruned > 0) workerLogger.info({ pruned }, "session-cleanup: expired sessions pruned");
    } catch (err) {
      workerLogger.error({ err }, "session-cleanup failed");
    }
  };
  void runSessionCleanup();
  const sessionCleanupTimer = setInterval(runSessionCleanup, SESSION_CLEANUP_INTERVAL_MS);

  // 8. RAG Visibility Drift Sweeper (Decision #42, RAG.md §6):
  // Nightly check that Embedding.visibilityScope matches Document.visibilityScope.
  const RAG_DRIFT_INTERVAL_MS = 24 * 60 * 60 * 1000; // nightly
  const runRagDriftSweep = async () => {
    try {
      await knowledgeService.runDriftSweeper();
    } catch (err) {
      workerLogger.error({ err }, "rag-drift-sweep failed");
    }
  };
  void runRagDriftSweep();
  const ragDriftTimer = setInterval(runRagDriftSweep, RAG_DRIFT_INTERVAL_MS);

  // 9. Subscription period sweeper (Decisions #91, #104, #105):
  // Activates scheduled periods on arrival and marks expired periods as ENDED.
  const SUBSCRIPTION_PERIOD_INTERVAL_MS = 5 * 60 * 1000;
  const runSubscriptionPeriodSweeper = async () => {
    try {
      const advanced = await subscriptionService.advanceScheduledPeriods();
      const expired = await subscriptionService.expireEndedPeriods();
      if (advanced > 0 || expired > 0) {
        workerLogger.info({ advanced, expired }, "subscription-periods: periods processed");
      }
    } catch (err) {
      workerLogger.error({ err }, "subscription-periods failed");
    }
  };
  void runSubscriptionPeriodSweeper();
  const subscriptionPeriodTimer = setInterval(runSubscriptionPeriodSweeper, SUBSCRIPTION_PERIOD_INTERVAL_MS);

  // Graceful shutdown handling
  const shutdown = (signal: string) => {
    workerLogger.info({ signal }, "Settly Worker shutting down gracefully...");
    clearInterval(viewingExpiryTimer);
    clearInterval(depositExpiryTimer);
    clearInterval(offerExpiryTimer);
    clearInterval(holdExpiryTimer);
    clearInterval(reconciliationTimer);
    clearInterval(idempotencyCleanupTimer);
    clearInterval(sessionCleanupTimer);
    clearInterval(ragDriftTimer);
    clearInterval(subscriptionPeriodTimer);
    process.exit(0);
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

if (process.env["NODE_ENV"] !== "test") {
  startWorker().catch((err) => {
    workerLogger.error({ err }, "Settly Worker failed to start");
    process.exit(1);
  });
}
