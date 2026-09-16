import pino from "pino";
import { env } from "../../config/index.js";

/**
 * Authoritative Application Logger (Decision #34)
 * RFC 9457 correlation and structured telemetry logger.
 */
export const logger = pino({
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
