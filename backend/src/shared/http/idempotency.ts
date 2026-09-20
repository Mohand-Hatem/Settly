import { createHash } from "node:crypto";
import type { Request, Response, NextFunction } from "express";
import { ProblemError } from "../errors/problem-details.js";
import {
  claimIdempotencyKey,
  completeIdempotencyKey,
  releaseIdempotencyKey,
} from "../database/idempotency.js";

/**
 * Idempotency-Key middleware (API.md §7, Decision #40). Must run after authentication.
 * - Same key + same request → the stored response is replayed.
 * - Same key + different request → 422 /errors/idempotency-key-reused.
 * - Same key while the first request is still running → 409 /errors/idempotency-in-progress.
 * Failed requests (status >= 500 or thrown errors) release the key so the client can retry.
 */
export function idempotent({ required = true }: { required?: boolean } = {}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const key = req.header("Idempotency-Key");
    if (!key) {
      if (!required) return next();
      return next(
        new ProblemError({
          type: "/errors/idempotency-key-required",
          title: "Idempotency Key Required",
          status: 400,
          detail: "This operation requires an Idempotency-Key header.",
        })
      );
    }
    if (key.length < 16 || key.length > 128) {
      return next(
        new ProblemError({
          type: "/errors/validation-failed",
          title: "Validation Failed",
          status: 422,
          detail: "One or more request parameters failed validation schema checks.",
          errors: [{ path: "Idempotency-Key", code: "invalid_length" }],
        })
      );
    }

    const userId = req.user!.id;
    const paramsHash = createHash("sha256")
      .update(JSON.stringify({ params: req.params, body: req.body ?? null }))
      .digest("hex");

    try {
      const existing = await claimIdempotencyKey({
        userId,
        key,
        method: req.method,
        path: req.baseUrl + req.path,
        paramsHash,
      });

      if (existing) {
        if (existing.paramsHash !== paramsHash) {
          return next(
            new ProblemError({
              type: "/errors/idempotency-key-reused",
              title: "Idempotency Key Reused",
              status: 422,
              detail: "This Idempotency-Key was already used for a different request.",
            })
          );
        }
        if (existing.statusCode === null) {
          return next(
            new ProblemError({
              type: "/errors/idempotency-in-progress",
              title: "Request In Progress",
              status: 409,
              detail: "A request with this Idempotency-Key is still being processed.",
            })
          );
        }
        res.setHeader("Idempotent-Replayed", "true");
        return res.status(existing.statusCode).json(existing.responseBody);
      }
    } catch (err) {
      return next(err);
    }

    const originalJson = res.json.bind(res);
    res.json = (body: unknown) => {
      const status = res.statusCode;
      const store =
        status < 500
          ? completeIdempotencyKey(userId, key, status, body)
          : releaseIdempotencyKey(userId, key);
      store.catch(() => undefined);
      return originalJson(body);
    };
    res.on("close", () => {
      if (!res.writableFinished) releaseIdempotencyKey(userId, key).catch(() => undefined);
    });
    next();
  };
}
