import createClient from "openapi-fetch";
import type { paths } from "./v1.d.ts";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

/**
 * Type-safe API client for Settly Core API v1.
 * Bound to authoritative OpenAPI schema derived directly from backend Zod definitions.
 * Automatically forwards Better Auth session cookies via credentials: "include".
 */
export const api = createClient<paths>({
  baseUrl: API_BASE_URL,
  credentials: "include",
  headers: {
    "Accept": "application/json, application/problem+json",
  },
});

export const apiClient = api;

export type { paths };
