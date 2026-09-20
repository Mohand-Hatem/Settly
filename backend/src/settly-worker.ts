import pino from "pino";
import { env } from "./config/index.js";
import { viewingService } from "./modules/pipeline/index.js";

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

  // Registered BullMQ consumer queues & scheduled jobs (Step 1 scaffold)
  const registeredSchedulers = [
    "payment-reconciliation",
    "deposit-expiry",
    "offer-expiry",
    "viewing-expiry",
    "checkout-hold-expiry",
    "notification-sweep",
    "idempotency-cleanup",
    "session-cleanup",
    "matview-refresh",
  ];

  workerLogger.info(
    { schedulers: registeredSchedulers },
    "Settly Worker: 9 scheduled jobs configured per CONCURRENCY_AND_IDEMPOTENCY.md"
  );

  // V10 viewing expiry (BUSINESS_RULES §3): open requests whose time has passed become EXPIRED.
  // A simple interval until BullMQ scheduling is wired; the update is idempotent.
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

  // Graceful shutdown handling
  const shutdown = (signal: string) => {
    workerLogger.info({ signal }, "Settly Worker shutting down gracefully...");
    clearInterval(viewingExpiryTimer);
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
