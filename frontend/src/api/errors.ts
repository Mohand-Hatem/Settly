/** RFC 9457 problem fields the UI relies on. The UI renders from `type` + `params`, never `detail`. */
export type Problem = {
  type?: string;
  title?: string;
  detail?: string;
  status?: number;
  params?: Record<string, unknown>;
  errors?: { path: string; code: string; params?: Record<string, unknown> }[];
};

/** Error thrown by the typed fetchers; carries the RFC 9457 problem fields when present. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly problem?: Problem
  ) {
    super(problem?.detail || problem?.title || `Request failed with status ${status}`);
    this.name = "ApiError";
  }

  get type(): string | undefined {
    return this.problem?.type;
  }
}

/** Unwraps an openapi-fetch result, throwing ApiError on a non-2xx response. */
export function unwrap<T>(result: { data?: T; error?: unknown; response: Response }): T {
  if (result.error !== undefined || result.data === undefined) {
    throw new ApiError(result.response.status, (result.error ?? undefined) as Problem | undefined);
  }
  return result.data;
}

/**
 * User-facing message for an error (UX_PATTERNS §2). Mapped from the problem `type`; unmapped
 * types fall back to a generic message — never a raw backend string.
 */
export function problemMessage(error: unknown): string {
  const type = error instanceof ApiError ? error.type : undefined;
  const params = error instanceof ApiError ? error.problem?.params : undefined;
  switch (type) {
    case "/errors/email-not-verified":
      return "Verify your email address to continue.";
    case "/errors/open-viewing-limit":
      return `You already have ${String(params?.limit ?? 3)} open viewing requests. Cancel one or wait for the agent to respond.`;
    case "/errors/slot-unavailable":
      return "That time is no longer available. Please pick another slot.";
    case "/errors/listing-unavailable":
      return "This listing is not taking viewing requests right now.";
    case "/errors/viewing-overlap":
      return "You already have a confirmed viewing at this time.";
    case "/errors/state-conflict":
      return "This has changed since you loaded it. We refreshed it for you.";
    case "/errors/too-early":
      return "This action is available only after the viewing starts.";
    case "/errors/validation-failed":
      return "Some details are missing or invalid. Please check the form.";
    case "/errors/unauthenticated":
      return "Please sign in to continue.";
    case "/errors/forbidden":
      return "You don't have access to do that.";
    case "/errors/not-found":
      return "We couldn't find that.";
    case "/errors/account-suspended":
      return "Your account is suspended.";
    case "/errors/idempotency-in-progress":
      return "Your request is still being processed.";
    default:
      return "Something went wrong. Please try again.";
  }
}
