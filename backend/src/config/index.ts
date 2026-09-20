import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url().default("http://localhost:4000"),
  FRONTEND_URL: z.string().url().default("http://localhost:3000"),
  RESEND_API_KEY: z.string().min(1),
  EMAIL_FROM: z.string().default("Settly <notifications@settly.estate>"),
  GEMINI_API_KEY: z.string().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  PAYMOB_API_KEY: z.string().optional(),
  PAYMOB_HMAC_SECRET: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  ENABLE_REAL_EMAIL: z.string().optional().transform((v) => v === "true"),
});

export const env = envSchema.parse(process.env);

/**
 * Authoritative Business Constants
 * Governed by docs/product/BUSINESS_RULES.md Section 1 and Decision #31
 */
export const BUSINESS_CONSTANTS = {
  // Monetary
  CURRENCY: "EGP",
  DEPOSIT_PERCENTAGE: 0.05, // 5% of property price
  DEPOSIT_CAP_EGP: 50_000,  // Capped at 50,000 EGP
  COOLING_OFF_WINDOW_HOURS: 48, // 48 hours cooling-off window for full refund
  POST_COOLING_OFF_RETENTION_RATE: 0.20, // 20% retained on late buyer withdrawal

  // Deadlines & Expiries
  DEPOSIT_DEADLINE_HOURS: 72, // 72 hours to pay deposit before ACCEPTED offer expires
  OFFER_TTL_DAYS: 7,          // 7 days before pending offer expires with no response
  CHECKOUT_HOLD_MINUTES: 15,  // 15 minutes exclusive reservation hold
  VIEWING_GRACE_PERIOD_MINUTES: 30, // 30 minutes grace period before recording no-show

  // Concurrency & Operational Invariants
  MAX_OPEN_VIEWING_REQUESTS_PER_BUYER: 3, // Invariant I9
  MAX_SAVED_SEARCHES_PER_USER: 25,        // Invariant I11
  MAX_LIVE_OFFERS_PER_BUYER: 5,           // Invariant I12

  // Vector & AI Search Constants
  EMBEDDING_MODEL: "gemini-embedding-001",
  EMBEDDING_DIMENSIONS: 1536, // Truncated MRL dimensionality with mandatory L2 re-normalization
} as const;
