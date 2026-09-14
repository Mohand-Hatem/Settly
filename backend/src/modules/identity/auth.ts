import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin } from "better-auth/plugins";
import { prisma } from "../../shared/database/prisma.js";
import { env } from "../../config/index.js";

import { sendVerificationEmail, sendPasswordResetEmail } from "../../shared/email/resend.js";

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
    requireEmailVerification: false, // Verification boundary enforced by Settly policy on financial/booking actions per Decision #38
    sendResetPassword: async ({ user, url }) => {
      await sendPasswordResetEmail({
        to: user.email,
        name: user.name,
        url,
      });
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await sendVerificationEmail({
        to: user.email,
        name: user.name,
        url,
      });
    },
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
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30-day sliding expiration
    updateAge: 60 * 60 * 24,      // Refresh expiration once per 24 hours
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
    "http://127.0.0.1:3000",
    "http://127.0.0.1:4000",
    "http://127.0.0.1:4001",
    "http://127.0.0.1:4002",
    "http://127.0.0.1:4003",
    "http://127.0.0.1:4004",
    "http://127.0.0.1:4005",
  ],
});

export type Auth = typeof auth;
export type UserSession = typeof auth.$Infer.Session.session;
export type AuthUser = typeof auth.$Infer.Session.user;
