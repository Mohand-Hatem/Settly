import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { getRequestId } from "../context/request-context.js";

export interface ProblemDetailParams {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  params?: Record<string, unknown>;
  errors?: Array<{
    path: string;
    code: string;
    params?: Record<string, unknown>;
    message?: string;
  }>;
}

export class ProblemError extends Error {
  public readonly type: string;
  public readonly title: string;
  public readonly status: number;
  public readonly detail?: string;
  public readonly instance?: string;
  public readonly params?: Record<string, unknown>;
  public readonly errors?: Array<{
    path: string;
    code: string;
    params?: Record<string, unknown>;
    message?: string;
  }>;

  constructor(options: ProblemDetailParams) {
    super(options.detail ?? options.title);
    this.name = "ProblemError";
    this.type = options.type;
    this.title = options.title;
    this.status = options.status;
    this.detail = options.detail;
    this.instance = options.instance;
    this.params = options.params;
    this.errors = options.errors;
  }
}

export function validationError(zodError: ZodError, instance?: string): ProblemError {
  const errors = zodError.errors.map((err) => ({
    path: err.path.join("."),
    code: err.code,
    message: err.message,
    params: { ...err },
  }));

  return new ProblemError({
    type: "/errors/validation-failed",
    title: "Validation Failed",
    status: 422,
    detail: "One or more request parameters failed validation schema checks.",
    instance,
    errors,
  });
}

export function notFoundError(resource: string, id?: string, instance?: string): ProblemError {
  return new ProblemError({
    type: "/errors/not-found",
    title: "Resource Not Found",
    status: 404,
    detail: id ? `${resource} with ID '${id}' was not found.` : `${resource} was not found.`,
    instance,
    params: { resource, id },
  });
}

export function forbiddenError(detail = "Not authorized to perform this operation", instance?: string): ProblemError {
  return new ProblemError({
    type: "/errors/forbidden",
    title: "Forbidden",
    status: 403,
    detail,
    instance,
  });
}

export function unauthenticatedError(detail = "Authentication credentials required", instance?: string): ProblemError {
  return new ProblemError({
    type: "/errors/unauthenticated",
    title: "Unauthenticated",
    status: 401,
    detail,
    instance,
  });
}

export function conflictError(
  type: string,
  title: string,
  detail: string,
  params?: Record<string, unknown>,
  instance?: string
): ProblemError {
  return new ProblemError({
    type,
    title,
    status: 409,
    detail,
    params,
    instance,
  });
}

/**
 * RFC 9457 Problem Details global error-handling middleware.
 * Guarantees application/problem+json responses and request correlation ID.
 */
export function problemDetailsMiddleware(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const requestId = getRequestId() ?? (req.headers["x-request-id"] as string) ?? "unknown-req";
  const instance = req.originalUrl || req.url;

  res.setHeader("Content-Type", "application/problem+json");

  // Handle explicit ProblemError
  if (err instanceof ProblemError) {
    res.status(err.status).json({
      type: err.type,
      title: err.title,
      status: err.status,
      detail: err.detail,
      instance: err.instance ?? instance,
      requestId,
      params: err.params,
      errors: err.errors,
    });
    return;
  }

  // Handle ZodError
  if (err instanceof ZodError) {
    const problem = validationError(err, instance);
    res.status(problem.status).json({
      type: problem.type,
      title: problem.title,
      status: problem.status,
      detail: problem.detail,
      instance,
      requestId,
      errors: problem.errors,
    });
    return;
  }

  // Handle JSON parse syntax errors from Express body-parser
  if (err instanceof SyntaxError && "status" in err && err.status === 400 && "body" in err) {
    res.status(400).json({
      type: "/errors/malformed-json",
      title: "Malformed JSON Request Body",
      status: 400,
      detail: err.message,
      instance,
      requestId,
    });
    return;
  }

  // Unhandled internal errors (500)
  const isDev = process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test";
  const errorMessage = err instanceof Error ? err.message : "Internal Server Error";

  res.status(500).json({
    type: "/errors/internal",
    title: "Internal Server Error",
    status: 500,
    detail: isDev ? errorMessage : "An unexpected internal server error occurred.",
    instance,
    requestId,
  });
}

/**
 * 404 Not Found fallback handler for unmatched API routes.
 */
export function notFoundHandler(req: Request, res: Response): void {
  const requestId = getRequestId() ?? (req.headers["x-request-id"] as string) ?? "unknown-req";
  const instance = req.originalUrl || req.url;

  res.setHeader("Content-Type", "application/problem+json");
  res.status(404).json({
    type: "/errors/not-found",
    title: "Route Not Found",
    status: 404,
    detail: `Route '${req.method} ${instance}' does not exist on this server.`,
    instance,
    requestId,
  });
}
