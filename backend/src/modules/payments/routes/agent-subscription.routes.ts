import { Router, type Request, type Response, type NextFunction, type RequestHandler } from "express";
import type { ZodTypeAny } from "zod";
import { z } from "../../../shared/openapi/zod.js";
import {
  registry,
  ValidationProblemSchema,
  NotFoundProblemSchema,
  ForbiddenProblemSchema,
  UnauthenticatedProblemSchema,
  ConflictProblemSchema,
} from "../../../shared/openapi/registry.js";
import { validationError } from "../../../shared/errors/problem-details.js";
import { idempotent } from "../../../shared/http/idempotency.js";
import {
  requireAuth,
  requireVerifiedEmail,
} from "../../identity/middleware/auth.middleware.js";
import { subscriptionService } from "../service/subscription.service.js";
import {
  SubscriptionStatusResponseSchema,
  SubscriptionCheckoutRequestSchema,
  SubscriptionCheckoutResponseSchema,
  SubscriptionCancelResponseSchema,
} from "../schema/subscription.schema.js";

export const agentSubscriptionRouter: Router = Router();

function parse<T extends ZodTypeAny>(schema: T, value: unknown, req: Request): z.infer<T> {
  const result = schema.safeParse(value);
  if (!result.success) throw validationError(result.error, req.originalUrl);
  return result.data;
}

function handle(fn: (req: Request, res: Response) => Promise<unknown>): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = await fn(req, res);
      if (!res.headersSent) res.status(res.statusCode === 201 ? 201 : 200).json(body);
    } catch (err) {
      next(err);
    }
  };
}

const problems = {
  401: { description: "Not signed in", content: { "application/problem+json": { schema: UnauthenticatedProblemSchema } } },
  403: { description: "Forbidden / Unverified email / Unverified agent", content: { "application/problem+json": { schema: ForbiddenProblemSchema } } },
  404: { description: "Not found", content: { "application/problem+json": { schema: NotFoundProblemSchema } } },
  409: { description: "State conflict / Quota / Period constraint", content: { "application/problem+json": { schema: ConflictProblemSchema } } },
  422: { description: "Validation failed", content: { "application/problem+json": { schema: ValidationProblemSchema } } },
};

function json(schema: ZodTypeAny, description: string) {
  return { description, content: { "application/json": { schema } } };
}

// ----------------------------------------------------------------------
// OpenAPI Registration
// ----------------------------------------------------------------------

registry.registerPath({
  method: "get",
  path: "/api/v1/agent/subscription",
  tags: ["Subscription"],
  summary: "Gets agent subscription status, current plan, quota and renewal eligibility (SUB-01, SUB-04, SUB-09)",
  security: [{ sessionCookie: [] }],
  responses: {
    200: json(SubscriptionStatusResponseSchema, "Agent subscription details"),
    ...problems,
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/agent/subscription/checkout",
  tags: ["Subscription"],
  summary: "Initiates Paymob checkout for Pro or Enterprise subscription tier (SUB-02, #89, #103, #104, #105)",
  security: [{ sessionCookie: [] }],
  request: {
    headers: z.object({ "Idempotency-Key": z.string().optional() }),
    body: {
      content: { "application/json": { schema: SubscriptionCheckoutRequestSchema } },
    },
  },
  responses: {
    200: json(SubscriptionCheckoutResponseSchema, "Checkout session created and Paymob redirect generated"),
    ...problems,
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/agent/subscription/cancel",
  tags: ["Subscription"],
  summary: "Cancels subscription renewal; active period runs to completion without refund (SUB-07, #91)",
  security: [{ sessionCookie: [] }],
  responses: {
    200: json(SubscriptionCancelResponseSchema, "Subscription cancelled successfully"),
    ...problems,
  },
});

// ----------------------------------------------------------------------
// Route Handlers
// ----------------------------------------------------------------------

agentSubscriptionRouter.get(
  "/",
  requireAuth,
  requireVerifiedEmail,
  handle(async (req) => {
    return subscriptionService.getSubscriptionStatus(req.user!.id);
  })
);

agentSubscriptionRouter.post(
  "/checkout",
  requireAuth,
  requireVerifiedEmail,
  idempotent({ required: false }),
  handle(async (req) => {
    const body = parse(SubscriptionCheckoutRequestSchema, req.body ?? {}, req);
    return subscriptionService.initiateCheckout(req.user!.id, body);
  })
);

agentSubscriptionRouter.post(
  "/cancel",
  requireAuth,
  requireVerifiedEmail,
  handle(async (req) => {
    return subscriptionService.cancelSubscription(req.user!.id);
  })
);
