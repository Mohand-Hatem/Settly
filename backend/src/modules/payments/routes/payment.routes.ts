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
import { paymentService } from "../service/payment.service.js";
import {
  CheckoutInitiateRequestSchema,
  CheckoutInitiateResponseSchema,
  DepositStatusResponseSchema,
} from "../schema/payment.schema.js";

/** /api/v1/offers/:id/deposit */
export const depositOfferRouter: Router = Router({ mergeParams: true });
/** /api/v1/payments */
export const paymentsRouter: Router = Router();

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

const idParam = z.object({ id: z.string().uuid() });
const problems = {
  401: { description: "Not signed in", content: { "application/problem+json": { schema: UnauthenticatedProblemSchema } } },
  403: { description: "Forbidden / Unverified email", content: { "application/problem+json": { schema: ForbiddenProblemSchema } } },
  404: { description: "Not found", content: { "application/problem+json": { schema: NotFoundProblemSchema } } },
  409: { description: "State conflict / Checkout hold active", content: { "application/problem+json": { schema: ConflictProblemSchema } } },
  422: { description: "Validation failed", content: { "application/problem+json": { schema: ValidationProblemSchema } } },
};

function json(schema: ZodTypeAny, description: string) {
  return { description, content: { "application/json": { schema } } };
}

// ----------------------------------------------------------------------
// OpenAPI Registration
// ----------------------------------------------------------------------

registry.registerPath({
  method: "post",
  path: "/api/v1/offers/{id}/deposit/checkout",
  tags: ["Payments"],
  summary: "Acquires 15-min checkout hold and initiates Paymob deposit checkout (Y2, BUY-08)",
  security: [{ sessionCookie: [] }],
  request: {
    params: idParam,
    headers: z.object({ "Idempotency-Key": z.string().optional() }),
    body: {
      content: { "application/json": { schema: CheckoutInitiateRequestSchema } },
    },
  },
  responses: {
    200: json(CheckoutInitiateResponseSchema, "Checkout session created and hold acquired"),
    ...problems,
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/offers/{id}/deposit/status",
  tags: ["Payments"],
  summary: "Gets real-time deposit payment and checkout hold status for polling (SH-05, BUY-09)",
  security: [{ sessionCookie: [] }],
  request: {
    params: idParam,
  },
  responses: {
    200: json(DepositStatusResponseSchema, "Current deposit payment and hold telemetry"),
    ...problems,
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/payments/webhook/paymob",
  tags: ["Payments"],
  summary: "Receives authoritative Paymob transaction webhook and executes Atomic Bundle T1 (Y4)",
  request: {
    body: {
      content: { "application/json": { schema: z.record(z.any()) } },
    },
  },
  responses: {
    200: json(z.object({ success: z.boolean(), reason: z.string().optional() }), "Webhook processed"),
    401: { description: "Invalid HMAC signature" },
  },
});

// ----------------------------------------------------------------------
// Route Handlers
// ----------------------------------------------------------------------

depositOfferRouter.post(
  "/checkout",
  requireAuth,
  requireVerifiedEmail,
  idempotent(),
  handle(async (req) => {
    const { id } = parse(idParam, req.params, req);
    const body = parse(CheckoutInitiateRequestSchema, req.body ?? {}, req);
    return paymentService.initiateCheckout(id, req.user!.id, body.returnUrl);
  })
);

depositOfferRouter.get(
  "/status",
  requireAuth,
  handle(async (req) => {
    const { id } = parse(idParam, req.params, req);
    return paymentService.getDepositStatus(id, req.user!.id);
  })
);

paymentsRouter.post(
  "/webhook/paymob",
  handle(async (req, res) => {
    const signature =
      (req.query.hmac as string) ||
      (req.headers["x-paymob-hmac"] as string) ||
      (req.body?.hmac as string) ||
      "";

    const result = await paymentService.handleWebhook(req.body, signature);
    res.status(200);
    return result;
  })
);
