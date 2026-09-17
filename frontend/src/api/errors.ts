/** Error thrown by the typed fetchers; carries the RFC 9457 problem fields when present. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly problem?: { title?: string; detail?: string }
  ) {
    super(problem?.detail || problem?.title || `Request failed with status ${status}`);
    this.name = "ApiError";
  }
}

/** Unwraps an openapi-fetch result, throwing ApiError on a non-2xx response. */
export function unwrap<T>(result: { data?: T; error?: unknown; response: Response }): T {
  if (result.error !== undefined || result.data === undefined) {
    throw new ApiError(
      result.response.status,
      (result.error ?? undefined) as { title?: string; detail?: string } | undefined
    );
  }
  return result.data;
}
