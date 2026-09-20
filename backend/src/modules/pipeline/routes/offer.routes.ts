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
import { offerService } from "../service/offer.service.js";
import {
  CreateOfferSchema,
  CounterOfferSchema,
  OptionalOfferReasonSchema,
  OfferResponseSchema,
  OfferListQuerySchema,
  OfferListResponseSchema,
  DisputeSaleSchema,
  AdminConfirmSaleSchema,
  AdminFellThroughSaleSchema,
  AdminExtendSaleReviewSchema,
  AdminSalesQuerySchema,
  AdminSaleItemSchema,
  AdminSalesListResponseSchema,
} from "../schema/offer.schema.js";

/** /api/v1/offers */
export const offerRouter: Router = Router();
/** /api/v1/me/offers — buyer's offers */
export const myOfferRouter: Router = Router();
/** /api/v1/me/agent/offers — agent's offers across their listings */
export const myAgentOfferRouter: Router = Router();
/** /api/v1/properties/:id/my-offer — check buyer's active offer for listing */
export const propertyOfferRouter: Router = Router({ mergeParams: true });
/** /api/v1/admin/sales — admin sale completion review queue */
export const adminSalesRouter: Router = Router();

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
  409: { description: "State conflict / Limit reached", content: { "application/problem+json": { schema: ConflictProblemSchema } } },
  422: { description: "Validation failed", content: { "application/problem+json": { schema: ValidationProblemSchema } } },
};
const json = (schema: ZodTypeAny, description: string) => ({
  description,
  content: { "application/json": { schema } },
});

// ------------------------------------------------------------------ OpenAPI Spec Registration
registry.registerPath({
  method: "post",
  path: "/api/v1/offers",
  tags: ["Offers"],
  summary: "Submit an initial purchase offer (O1). Requires verified email, max 5 live offers (I12)",
  security: [{ SessionCookie: [] }],
  request: {
    headers: z.object({ "Idempotency-Key": z.string().min(16).max(128).optional() }),
    body: { content: { "application/json": { schema: CreateOfferSchema } } },
  },
  responses: {
    201: json(OfferResponseSchema, "Offer created"),
    401: problems[401],
    403: problems[403],
    404: problems[404],
    409: problems[409],
    422: problems[422],
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/offers/{id}",
  tags: ["Offers"],
  summary: "Get offer details (buyer, agent, or admin only)",
  security: [{ SessionCookie: [] }],
  request: { params: idParam },
  responses: {
    200: json(OfferResponseSchema, "Offer details"),
    401: problems[401],
    403: problems[403],
    404: problems[404],
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/offers/{id}/counter",
  tags: ["Offers"],
  summary: "Submit a counter-offer with revised amount/terms (O2 for agent, O3 for buyer)",
  security: [{ SessionCookie: [] }],
  request: {
    params: idParam,
    body: { content: { "application/json": { schema: CounterOfferSchema } } },
  },
  responses: {
    200: json(OfferResponseSchema, "Offer countered"),
    401: problems[401],
    403: problems[403],
    404: problems[404],
    409: problems[409],
    422: problems[422],
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/offers/{id}/accept",
  tags: ["Offers"],
  summary: "Accept offer terms (O4 for agent, O5 for buyer). Generates 72-hour deposit obligation",
  security: [{ SessionCookie: [] }],
  request: { params: idParam },
  responses: {
    200: json(OfferResponseSchema, "Offer accepted"),
    401: problems[401],
    403: problems[403],
    404: problems[404],
    409: problems[409],
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/offers/{id}/reject",
  tags: ["Offers"],
  summary: "Agent rejects an offer (O6)",
  security: [{ SessionCookie: [] }],
  request: {
    params: idParam,
    body: { content: { "application/json": { schema: OptionalOfferReasonSchema } } },
  },
  responses: {
    200: json(OfferResponseSchema, "Offer rejected"),
    401: problems[401],
    403: problems[403],
    404: problems[404],
    409: problems[409],
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/offers/{id}/withdraw",
  tags: ["Offers"],
  summary: "Buyer withdraws a pending or accepted offer before reservation (O7, O8)",
  security: [{ SessionCookie: [] }],
  request: {
    params: idParam,
    body: { content: { "application/json": { schema: OptionalOfferReasonSchema } } },
  },
  responses: {
    200: json(OfferResponseSchema, "Offer withdrawn"),
    401: problems[401],
    403: problems[403],
    404: problems[404],
    409: problems[409],
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/me/offers",
  tags: ["Offers"],
  summary: "List current buyer's offers",
  security: [{ SessionCookie: [] }],
  request: { query: OfferListQuerySchema },
  responses: {
    200: json(OfferListResponseSchema, "Buyer offers"),
    401: problems[401],
    422: problems[422],
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/me/agent/offers",
  tags: ["Offers"],
  summary: "List incoming offers across current agent's listings",
  security: [{ SessionCookie: [] }],
  request: { query: OfferListQuerySchema },
  responses: {
    200: json(OfferListResponseSchema, "Agent offers"),
    401: problems[401],
    403: problems[403],
    422: problems[422],
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/properties/{id}/my-offer",
  tags: ["Offers"],
  summary: "Check current buyer's active offer on this property (if any)",
  security: [{ SessionCookie: [] }],
  request: { params: idParam },
  responses: {
    200: json(OfferResponseSchema.nullable(), "Active offer or null"),
    401: problems[401],
    404: problems[404],
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/offers/{id}/confirm-sale",
  tags: ["Offers", "Sales"],
  summary: "Confirm property sale completion (BUY-10 for buyer, AGT-07 for agent). Transitions to SOLD when both confirm (#77, #102)",
  security: [{ SessionCookie: [] }],
  request: { params: idParam },
  responses: {
    200: json(OfferResponseSchema, "Sale confirmation recorded or completed"),
    401: problems[401],
    403: problems[403],
    404: problems[404],
    409: problems[409],
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/offers/{id}/dispute-sale",
  tags: ["Offers", "Sales"],
  summary: "Report a dispute on conveyance progress. Transfers case to Admin Review immediately (P9a)",
  security: [{ SessionCookie: [] }],
  request: {
    params: idParam,
    body: { content: { "application/json": { schema: DisputeSaleSchema } } },
  },
  responses: {
    200: json(OfferResponseSchema, "Dispute recorded and escalated to admin review"),
    401: problems[401],
    403: problems[403],
    404: problems[404],
    409: problems[409],
    422: problems[422],
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/admin/sales",
  tags: ["Admin", "Sales"],
  summary: "Admin sale completion review queue (ADM-07). Lists sales requiring review, active reservations, and resolved deals (#82)",
  security: [{ SessionCookie: [] }],
  request: { query: AdminSalesQuerySchema },
  responses: {
    200: json(AdminSalesListResponseSchema, "Admin sales queue"),
    401: problems[401],
    403: problems[403],
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/admin/sales/{id}",
  tags: ["Admin", "Sales"],
  summary: "Admin get sale case details for adjudication (ADM-07)",
  security: [{ SessionCookie: [] }],
  request: { params: idParam },
  responses: {
    200: json(AdminSaleItemSchema, "Sale case details"),
    401: problems[401],
    403: problems[403],
    404: problems[404],
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/admin/sales/{id}/confirm",
  tags: ["Admin", "Sales"],
  summary: "Admin confirms sale completion. Transitions Property to SOLD and Offer to COMPLETED (P9, Decision #82)",
  security: [{ SessionCookie: [] }],
  request: {
    params: idParam,
    body: { content: { "application/json": { schema: AdminConfirmSaleSchema } } },
  },
  responses: {
    200: json(OfferResponseSchema, "Sale confirmed by admin"),
    401: problems[401],
    403: problems[403],
    404: problems[404],
    409: problems[409],
    422: problems[422],
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/admin/sales/{id}/fell-through",
  tags: ["Admin", "Sales"],
  summary: "Admin declares sale fell through. Transitions Property to PUBLISHED and Offer to FELL_THROUGH (P10, §7 refund policy, Decision #82)",
  security: [{ SessionCookie: [] }],
  request: {
    params: idParam,
    body: { content: { "application/json": { schema: AdminFellThroughSaleSchema } } },
  },
  responses: {
    200: json(OfferResponseSchema, "Sale declared fell through"),
    401: problems[401],
    403: problems[403],
    404: problems[404],
    409: problems[409],
    422: problems[422],
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/admin/sales/{id}/extend",
  tags: ["Admin", "Sales"],
  summary: "Admin extends review period with justified reason (Decision #82)",
  security: [{ SessionCookie: [] }],
  request: {
    params: idParam,
    body: { content: { "application/json": { schema: AdminExtendSaleReviewSchema } } },
  },
  responses: {
    200: json(OfferResponseSchema, "Review period extended"),
    401: problems[401],
    403: problems[403],
    404: problems[404],
    409: problems[409],
    422: problems[422],
  },
});

// ------------------------------------------------------------------ Route Handlers
offerRouter.post(
  "/",
  requireVerifiedEmail,
  idempotent(),
  handle(async (req, res) => {
    const input = parse(CreateOfferSchema, req.body, req);
    const result = await offerService.createOffer(
      { id: req.user!.id, emailVerified: req.user!.emailVerified },
      input
    );
    res.status(201);
    return result;
  })
);

offerRouter.get(
  "/:id",
  requireAuth,
  handle(async (req) =>
    offerService.getOffer(
      { id: req.user!.id, role: req.user!.role },
      parse(idParam, req.params, req).id
    )
  )
);

offerRouter.post(
  "/:id/counter",
  requireAuth,
  handle(async (req) =>
    offerService.counterOffer(
      { id: req.user!.id, emailVerified: req.user!.emailVerified, role: req.user!.role },
      parse(idParam, req.params, req).id,
      parse(CounterOfferSchema, req.body, req)
    )
  )
);

offerRouter.post(
  "/:id/accept",
  requireAuth,
  handle(async (req) =>
    offerService.acceptOffer(
      { id: req.user!.id, emailVerified: req.user!.emailVerified, role: req.user!.role },
      parse(idParam, req.params, req).id
    )
  )
);

const agentOnly = requireRole("AGENT");
offerRouter.post(
  "/:id/reject",
  agentOnly,
  handle(async (req) =>
    offerService.rejectOffer(
      { id: req.user!.id },
      parse(idParam, req.params, req).id,
      parse(OptionalOfferReasonSchema, req.body ?? {}, req).reason
    )
  )
);

offerRouter.post(
  "/:id/withdraw",
  requireAuth,
  handle(async (req) =>
    offerService.withdrawOffer(
      { id: req.user!.id },
      parse(idParam, req.params, req).id,
      parse(OptionalOfferReasonSchema, req.body ?? {}, req).reason
    )
  )
);

myOfferRouter.get(
  "/",
  requireAuth,
  handle(async (req) =>
    offerService.listMine(req.user!.id, "buyer", parse(OfferListQuerySchema, req.query, req))
  )
);

myAgentOfferRouter.get(
  "/",
  agentOnly,
  handle(async (req) =>
    offerService.listMine(req.user!.id, "agent", parse(OfferListQuerySchema, req.query, req))
  )
);

propertyOfferRouter.get(
  "/my-offer",
  requireAuth,
  handle(async (req) =>
    offerService.getMyOfferForProperty(req.user!.id, parse(idParam, req.params, req).id)
  )
);

offerRouter.post(
  "/:id/confirm-sale",
  requireAuth,
  handle(async (req) => {
    const result = await offerService.confirmSale(
      parse(idParam, req.params, req).id,
      { id: req.user!.id, role: req.user!.role }
    );
    if (result.status === "error") throw result.error;
    return result.offer;
  })
);

offerRouter.post(
  "/:id/dispute-sale",
  requireAuth,
  handle(async (req) => {
    const body = parse(DisputeSaleSchema, req.body, req);
    const result = await offerService.disputeSale(
      parse(idParam, req.params, req).id,
      { id: req.user!.id, role: req.user!.role },
      body.reason
    );
    if (result.status === "error") throw result.error;
    return result.offer;
  })
);

const adminOnly = requireRole("ADMIN");

adminSalesRouter.get(
  "/",
  adminOnly,
  handle(async (req) => {
    const query = parse(AdminSalesQuerySchema, req.query, req);
    return offerService.listAdminSales(query);
  })
);

adminSalesRouter.get(
  "/:id",
  adminOnly,
  handle(async (req) => {
    const { id } = parse(idParam, req.params, req);
    const result = await offerService.getAdminSaleById(id);
    if (result.status === "error") throw result.error;
    return result.sale;
  })
);

adminSalesRouter.post(
  "/:id/confirm",
  adminOnly,
  handle(async (req) => {
    const { id } = parse(idParam, req.params, req);
    const body = parse(AdminConfirmSaleSchema, req.body, req);
    const result = await offerService.adminConfirmSale(id, { id: req.user!.id }, body.notes);
    if (result.status === "error") throw result.error;
    return result.offer;
  })
);

adminSalesRouter.post(
  "/:id/fell-through",
  adminOnly,
  handle(async (req) => {
    const { id } = parse(idParam, req.params, req);
    const body = parse(AdminFellThroughSaleSchema, req.body, req);
    const result = await offerService.adminFellThroughSale(id, { id: req.user!.id }, body);
    if (result.status === "error") throw result.error;
    return result.offer;
  })
);

adminSalesRouter.post(
  "/:id/extend",
  adminOnly,
  handle(async (req) => {
    const { id } = parse(idParam, req.params, req);
    const body = parse(AdminExtendSaleReviewSchema, req.body, req);
    const result = await offerService.adminExtendSaleReview(id, { id: req.user!.id }, body);
    if (result.status === "error") throw result.error;
    return result.offer;
  })
);

