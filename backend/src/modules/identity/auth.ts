import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin } from "better-auth/plugins";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { prisma } from "../../shared/database/prisma.js";
import { env } from "../../config/index.js";

import { sendVerificationEmail, sendPasswordResetEmail } from "../../shared/email/resend.js";
import { normalizePhone } from "./phone.js";

export const SESSION_SLIDING_SECONDS = 60 * 60 * 24 * 7;
export const SESSION_ABSOLUTE_MAX_MS = 1000 * 60 * 60 * 24 * 30;

/**
 * Authoritative Better Auth Server Configuration
 * Governed by Decision #9, #33, #38, #39, #40, #42 and docs/architecture/AUTH.md.
 * 
 * - Owns authentication, session management, credential verification, and account bans.
 * - Operates against the 4 Better Auth tables: user, session, account, verification.
 * - Disables cookie caching to ensure suspension is immediate.
 * - Mounts on /api/auth/* outside the Settly /api/v1 business API.
 */
export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  basePath: "/api/auth",
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    revokeSessionsOnPasswordReset: true, // AUTH.md §3: a password reset revokes every session
    requireEmailVerification: false, // Verification boundary enforced by Settly policy on financial/booking actions per Decision #38
    sendResetPassword: async ({ user, url }) => {
      await sendPasswordResetEmail({
        to: user.email,
        name: user.name,
        url,
      });
    },
  },
  // Email verification is by Better Auth link only (Decision #9: emailOTP not used; #106).
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendVerificationEmail({
        to: user.email,
        name: user.name,
        url,
      });
    },
  },
  // Phone is required for email sign-up (#60). Google sign-up supplies none, so those accounts
  // complete it at /complete-profile (#106); the column is therefore nullable.
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-up/email") return;
      const phone = normalizePhone(ctx.body?.phone);
      if (!phone) {
        throw new APIError("BAD_REQUEST", {
          message: "A valid phone number in international format is required.",
        });
      }
      return { context: { body: { ...ctx.body, phone } } };
    }),
  },
  socialProviders: {
    ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
          },
        }
      : {}),
  },
  plugins: [
    admin({
      defaultRole: "USER",
      adminRoles: ["ADMIN"],
    }),
  ],
  user: {
    additionalFields: {
      preferredLocale: {
        type: "string",
        defaultValue: "en",
        required: false,
      },
      anonymizedAt: {
        type: "date",
        required: false,
      },
      phone: {
        type: "string",
        required: false,
        input: true,
      },
    },
  },
  // 7-day sliding expiry refreshed daily; the absolute 30-day cap is enforced in the
  // authenticate middleware against the immutable session.createdAt (V12, #106).
  session: {
    expiresIn: SESSION_SLIDING_SECONDS,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: false,             // MANDATORY (AUTH.md §3): Cookie cache DISABLED so ban/revocation is immediate
    },
  },
  trustedOrigins: [
    env.FRONTEND_URL,
    "http://localhost:3000",
    "http://localhost:4000",
    "http://localhost:4001",
    "http://localhost:4002",
    "http://localhost:4003",
    "http://localhost:4004",
    "http://localhost:4005",
    "http://localhost:4007",
    "http://localhost:4008",
    "http://localhost:4009",
    "http://localhost:4010",
    "http://localhost:4011",
    "http://localhost:4016",
    "http://localhost:4017",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:4000",
    "http://127.0.0.1:4001",
    "http://127.0.0.1:4002",
    "http://127.0.0.1:4003",
    "http://127.0.0.1:4004",
    "http://127.0.0.1:4005",
    "http://127.0.0.1:4008",
    "http://127.0.0.1:4009",
    "http://127.0.0.1:4010",
    "http://127.0.0.1:4011",
    "http://127.0.0.1:4016",
    "http://127.0.0.1:4017",
  ],
});

export type Auth = typeof auth;
export type UserSession = typeof auth.$Infer.Session.session;
export type AuthUser = typeof auth.$Infer.Session.user;
