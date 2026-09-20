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
  requireRole,
  requireVerifiedEmail,
} from "../../identity/middleware/auth.middleware.js";
import { viewingService } from "../service/index.js";
import {
  AvailabilitySchema,
  UpdateAvailabilitySchema,
  ViewingSlotsQuerySchema,
  ViewingSlotsResponseSchema,
  CreateViewingSchema,
  ProposeRescheduleSchema,
  OptionalReasonSchema,
  ViewingResponseSchema,
  ViewingListQuerySchema,
  AgentViewingListQuerySchema,
  ViewingListResponseSchema,
} from "../schema/index.js";

/** Health route kept from the module scaffold (mounted at /api/v1/pipeline). */
export const pipelineRouter: Router = Router();
pipelineRouter.get("/health", (_req, res) => {
  res.json({ module: "pipeline", status: "ok" });
});

/** /api/v1/viewings */
export const viewingRouter: Router = Router();
/** /api/v1/me/viewings — the buyer's viewings */
export const myViewingRouter: Router = Router();
/** /api/v1/me/agent/viewings — the agent's viewings */
export const myAgentViewingRouter: Router = Router();
/** /api/v1/me/availability — the agent's weekly availability */
export const availabilityRouter: Router = Router();
/** /api/v1/properties/:id/viewing-slots */
export const viewingSlotsRouter: Router = Router({ mergeParams: true });

// ------------------------------------------------------------------ helpers
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
  403: { description: "Forbidden", content: { "application/problem+json": { schema: ForbiddenProblemSchema } } },
  404: { description: "Not found", content: { "application/problem+json": { schema: NotFoundProblemSchema } } },
  409: { description: "State conflict", content: { "application/problem+json": { schema: ConflictProblemSchema } } },
  422: { description: "Validation failed", content: { "application/problem+json": { schema: ValidationProblemSchema } } },
};
const json = (schema: ZodTypeAny, description: string) => ({
  description,
  content: { "application/json": { schema } },
});

// ------------------------------------------------------------------ OpenAPI
registry.registerPath({
  method: "get",
  path: "/api/v1/properties/{id}/viewing-slots",
  tags: ["Viewings"],
  summary: "Available 60-minute viewing slots for a listing (Cairo time, up to 30 days ahead)",
  request: { params: idParam, query: ViewingSlotsQuerySchema },
  responses: { 200: json(ViewingSlotsResponseSchema, "Available slots"), 404: problems[404], 422: problems[422] },
});
registry.registerPath({
  method: "post",
  path: "/api/v1/viewings",
  tags: ["Viewings"],
  summary: "Request a viewing (V1). Requires a verified email and an Idempotency-Key",
  security: [{ SessionCookie: [] }],
  request: {
    headers: z.object({ "Idempotency-Key": z.string().min(16).max(128) }),
    body: { content: { "application/json": { schema: CreateViewingSchema } } },
  },
  responses: {
    201: json(ViewingResponseSchema, "Viewing requested"),
    401: problems[401],
    403: problems[403],
    404: problems[404],
    409: problems[409],
    422: problems[422],
  },
});
registry.registerPath({
  method: "get",
  path: "/api/v1/viewings/{id}",
  tags: ["Viewings"],
  summary: "Get one viewing (buyer or agent party only)",
  security: [{ SessionCookie: [] }],
  request: { params: idParam },
  responses: { 200: json(ViewingResponseSchema, "Viewing"), 401: problems[401], 404: problems[404] },
});
const actions: { path: string; summary: string; body?: ZodTypeAny }[] = [
  { path: "confirm", summary: "Agent confirms a requested viewing (V2)" },
  { path: "decline", summary: "Agent declines a requested viewing (V3)", body: OptionalReasonSchema },
  { path: "propose-reschedule", summary: "Agent proposes another slot (V4)", body: ProposeRescheduleSchema },
  { path: "accept-reschedule", summary: "Buyer accepts the proposed time (V5)" },
  { path: "decline-reschedule", summary: "Buyer declines the proposed time (V6)" },
  { path: "cancel", summary: "Buyer withdraws or cancels (V6a/V7); agent cancels with a reason (V7)", body: OptionalReasonSchema },
  { path: "complete", summary: "Agent marks the viewing completed after it starts (V8)" },
  { path: "no-show", summary: "Agent records a no-show 30 minutes after the start (V9)" },
];
for (const a of actions) {
  registry.registerPath({
    method: "post",
    path: `/api/v1/viewings/{id}/${a.path}`,
    tags: ["Viewings"],
    summary: a.summary,
    security: [{ SessionCookie: [] }],
    request: {
      params: idParam,
      ...(a.body && { body: { content: { "application/json": { schema: a.body } } } }),
    },
    responses: {
      200: json(ViewingResponseSchema, "Updated viewing"),
      401: problems[401],
      404: problems[404],
      409: problems[409],
      422: problems[422],
    },
  });
}
registry.registerPath({
  method: "get",
  path: "/api/v1/me/viewings",
  tags: ["Viewings"],
  summary: "The current user's viewings as a buyer",
  security: [{ SessionCookie: [] }],
  request: { query: ViewingListQuerySchema },
  responses: { 200: json(ViewingListResponseSchema, "Viewings"), 401: problems[401], 422: problems[422] },
});
registry.registerPath({
  method: "get",
  path: "/api/v1/me/agent/viewings",
  tags: ["Viewings"],
  summary: "The current agent's viewings on their listings",
  security: [{ SessionCookie: [] }],
  request: { query: AgentViewingListQuerySchema },
  responses: { 200: json(ViewingListResponseSchema, "Viewings"), 401: problems[401], 403: problems[403] },
});
registry.registerPath({
  method: "get",
  path: "/api/v1/me/availability",
  tags: ["Viewings"],
  summary: "The current agent's weekly availability (Cairo wall-clock)",
  security: [{ SessionCookie: [] }],
  responses: { 200: json(AvailabilitySchema, "Availability"), 401: problems[401], 403: problems[403] },
});
registry.registerPath({
  method: "put",
  path: "/api/v1/me/availability",
  tags: ["Viewings"],
  summary: "Replace the current agent's weekly availability and blackout dates",
  security: [{ SessionCookie: [] }],
  request: { body: { content: { "application/json": { schema: UpdateAvailabilitySchema } } } },
  responses: {
    200: json(AvailabilitySchema, "Availability"),
    401: problems[401],
    403: problems[403],
    422: problems[422],
  },
});

// ------------------------------------------------------------------ handlers
viewingSlotsRouter.get(
  "/",
  handle(async (req) => {
    const { id } = parse(idParam, req.params, req);
    return viewingService.getSlotsForProperty(id, parse(ViewingSlotsQuerySchema, req.query, req));
  })
);

viewingRouter.post(
  "/",
  requireVerifiedEmail,
  idempotent(),
  handle(async (req, res) => {
    const input = parse(CreateViewingSchema, req.body, req);
    const result = await viewingService.requestViewing(
      { id: req.user!.id, emailVerified: req.user!.emailVerified },
      input
    );
    res.status(201);
    return result;
  })
);

viewingRouter.get(
  "/:id",
  requireAuth,
  handle(async (req) => viewingService.getOne(req.user!.id, parse(idParam, req.params, req).id))
);

const agentOnly = requireRole("AGENT");
viewingRouter.post("/:id/confirm", agentOnly, handle(async (req) =>
  viewingService.agentActions.confirm(req.user!.id, parse(idParam, req.params, req).id)));
viewingRouter.post("/:id/decline", agentOnly, handle(async (req) =>
  viewingService.agentActions.decline(
    req.user!.id,
    parse(idParam, req.params, req).id,
    parse(OptionalReasonSchema, req.body ?? {}, req).reason
  )));
viewingRouter.post("/:id/propose-reschedule", agentOnly, handle(async (req) =>
  viewingService.agentActions.proposeReschedule(
    req.user!.id,
    parse(idParam, req.params, req).id,
    parse(ProposeRescheduleSchema, req.body, req).startsAt
  )));
viewingRouter.post("/:id/complete", agentOnly, handle(async (req) =>
  viewingService.agentActions.complete(req.user!.id, parse(idParam, req.params, req).id)));
viewingRouter.post("/:id/no-show", agentOnly, handle(async (req) =>
  viewingService.agentActions.noShow(req.user!.id, parse(idParam, req.params, req).id)));

viewingRouter.post("/:id/accept-reschedule", requireAuth, handle(async (req) =>
  viewingService.buyerActions.acceptReschedule(req.user!.id, parse(idParam, req.params, req).id)));
viewingRouter.post("/:id/decline-reschedule", requireAuth, handle(async (req) =>
  viewingService.buyerActions.declineReschedule(req.user!.id, parse(idParam, req.params, req).id)));
viewingRouter.post("/:id/cancel", requireAuth, handle(async (req) =>
  viewingService.cancel(
    req.user!.id,
    parse(idParam, req.params, req).id,
    parse(OptionalReasonSchema, req.body ?? {}, req).reason
  )));

myViewingRouter.get(
  "/",
  requireAuth,
  handle(async (req) => viewingService.listMine(req.user!.id, "buyer", parse(ViewingListQuerySchema, req.query, req)))
);

myAgentViewingRouter.get(
  "/",
  agentOnly,
  handle(async (req) =>
    viewingService.listMine(req.user!.id, "agent", parse(AgentViewingListQuerySchema, req.query, req))
  )
);

availabilityRouter.get("/", agentOnly, handle(async (req) => viewingService.getAvailability(req.user!.id)));
availabilityRouter.put(
  "/",
  agentOnly,
  handle(async (req) => viewingService.setAvailability(req.user!.id, parse(UpdateAvailabilitySchema, req.body, req)))
);

export * from "./offer.routes.js";
