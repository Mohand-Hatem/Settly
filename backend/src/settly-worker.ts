import pino from "pino";
import { env } from "./config/index.js";

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

  // Graceful shutdown handling
  const shutdown = (signal: string) => {
    workerLogger.info({ signal }, "Settly Worker shutting down gracefully...");
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
