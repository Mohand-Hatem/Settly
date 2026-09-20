import { createAuthClient } from "better-auth/react";
import { adminClient, inferAdditionalFields } from "better-auth/client/plugins";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

/**
 * Better Auth client. Authentication only — authorization is the API's job (AUTH.md §2).
 * `phone` mirrors the backend additional field (#60): required at email sign-up, and completed
 * at /complete-profile for Google accounts (#106).
 */
export const authClient = createAuthClient({
  baseURL: API_BASE_URL,
  plugins: [
    adminClient(),
    inferAdditionalFields({
      user: {
        phone: { type: "string", required: false },
        preferredLocale: { type: "string", required: false },
      },
    }),
  ],
});

export const { signIn, signUp, signOut, useSession } = authClient;

export type Role = "USER" | "AGENT" | "ADMIN";

/** Dashboard of each role (#100, #106). */
export const ROLE_HOME: Record<Role, string> = { USER: "/buyer", AGENT: "/agent", ADMIN: "/admin" };

export function roleOf(user: { role?: string | null } | null | undefined): Role {
  return user?.role === "AGENT" || user?.role === "ADMIN" ? user.role : "USER";
}

/** Only same-site relative paths are accepted as post-login targets (no open redirects). */
export function safeCallbackUrl(raw: string | null | undefined): string | null {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return null;
  return raw;
}
