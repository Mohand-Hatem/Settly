import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

/**
 * Authoritative Better Auth Client for Settly Frontend.
 * Exposes authentication methods, session reactivity hooks, and admin plugin bindings.
 * Automatically exchanges credentials with the backend via HTTP-only cookies.
 */
export const authClient = createAuthClient({
  baseURL: API_BASE_URL,
  plugins: [adminClient()],
});

export const { signIn, signUp, signOut, useSession } = authClient;
