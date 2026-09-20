import { Router, type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import * as propertyService from "../service/property.service.js";
import * as uploadService from "../service/upload.service.js";
import {
  CreatePropertySchema,
  UpdatePropertySchema,
  PropertyResponseSchema,
  PropertyListResponseSchema,
  ActionReasonSchema,
} from "../schema/property.schema.js";
import { ReorderImagesSchema } from "../schema/upload.schema.js";
import { requireRole } from "../../identity/middleware/auth.middleware.js";
import {
  registry,
  ValidationProblemSchema,
  NotFoundProblemSchema,
  ForbiddenProblemSchema,
  UnauthenticatedProblemSchema,
  ConflictProblemSchema,
} from "../../../shared/openapi/registry.js";
import { validationError, forbiddenError } from "../../../shared/errors/problem-details.js";

export const propertyRouter = Router();
export const adminPropertyRouter = Router();
export const myPropertyRouter = Router();

// ==============================================================================
// 1. OpenAPI Declarations
// ==============================================================================

// Public: GET /api/v1/properties
registry.registerPath({
  method: "get",
  path: "/api/v1/properties",
  tags: ["Catalog"],
  summary: "List published properties",
  description: "Returns paginated list of published and reserved properties for public browsing.",
  request: {
    query: z.object({
      cursor: z.string().uuid().optional(),
      limit: z.coerce.number().int().min(1).max(50).optional(),
    }),
  },
  responses: {
    200: {
      description: "List of properties",
      content: { "application/json": { schema: PropertyListResponseSchema } },
    },
  },
});

// Public: GET /api/v1/properties/{id}
registry.registerPath({
  method: "get",
  path: "/api/v1/properties/{id}",
  tags: ["Catalog"],
  summary: "Get property details by ID",
  request: {
    params: z.object({ id: z.string().uuid() }),
  },
  responses: {
    200: {
      description: "Property record",
      content: { "application/json": { schema: PropertyResponseSchema } },
    },
    404: {
      description: "Property not found",
      content: { "application/problem+json": { schema: NotFoundProblemSchema } },
    },
  },
});

// Public: GET /api/v1/properties/slug/{slug}
registry.registerPath({
  method: "get",
  path: "/api/v1/properties/slug/{slug}",
  tags: ["Catalog"],
  summary: "Get property details by SEO slug",
  request: {
    params: z.object({ slug: z.string().min(1) }),
  },
  responses: {
    200: {
      description: "Property record",
      content: { "application/json": { schema: PropertyResponseSchema } },
    },
    404: {
      description: "Property not found",
      content: { "application/problem+json": { schema: NotFoundProblemSchema } },
    },
  },
});

// Agent: POST /api/v1/properties
registry.registerPath({
  method: "post",
  path: "/api/v1/properties",
  tags: ["Catalog", "Agent"],
  summary: "Create a draft property listing (P1)",
  security: [{ sessionAuth: [] }],
  request: {
    body: {
      content: { "application/json": { schema: CreatePropertySchema } },
    },
  },
  responses: {
    201: {
      description: "Draft property created",
      content: { "application/json": { schema: PropertyResponseSchema } },
    },
    401: { description: "Unauthenticated", content: { "application/problem+json": { schema: UnauthenticatedProblemSchema } } },
    403: { description: "Forbidden", content: { "application/problem+json": { schema: ForbiddenProblemSchema } } },
    422: { description: "Validation error", content: { "application/problem+json": { schema: ValidationProblemSchema } } },
  },
});

// Agent: PATCH /api/v1/properties/{id}
registry.registerPath({
  method: "patch",
  path: "/api/v1/properties/{id}",
  tags: ["Catalog", "Agent"],
  summary: "Update a property listing with two-tier moderation (P6)",
  security: [{ sessionAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      content: { "application/json": { schema: UpdatePropertySchema } },
    },
  },
  responses: {
    200: {
      description: "Property updated",
      content: { "application/json": { schema: PropertyResponseSchema } },
    },
    401: { description: "Unauthenticated", content: { "application/problem+json": { schema: UnauthenticatedProblemSchema } } },
    403: { description: "Forbidden", content: { "application/problem+json": { schema: ForbiddenProblemSchema } } },
    404: { description: "Not found", content: { "application/problem+json": { schema: NotFoundProblemSchema } } },
    409: { description: "Conflict / Terminal state", content: { "application/problem+json": { schema: ConflictProblemSchema } } },
  },
});

// Agent: DELETE /api/v1/properties/{id}
registry.registerPath({
  method: "delete",
  path: "/api/v1/properties/{id}",
  tags: ["Catalog", "Agent"],
  summary: "Hard-delete a never-published DRAFT listing (Decision #42)",
  security: [{ sessionAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
  },
  responses: {
    204: { description: "Draft listing deleted" },
    401: { description: "Unauthenticated", content: { "application/problem+json": { schema: UnauthenticatedProblemSchema } } },
    403: { description: "Forbidden", content: { "application/problem+json": { schema: ForbiddenProblemSchema } } },
    409: { description: "Cannot hard-delete published listing", content: { "application/problem+json": { schema: ConflictProblemSchema } } },
  },
});

// Action: POST /api/v1/properties/{id}/submit
registry.registerPath({
  method: "post",
  path: "/api/v1/properties/{id}/submit",
  tags: ["Catalog", "Agent"],
  summary: "Submit draft listing for publication review (P2)",
  security: [{ sessionAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
  },
  responses: {
    200: { description: "Property submitted for review", content: { "application/json": { schema: PropertyResponseSchema } } },
    403: { description: "Forbidden or agent not verified", content: { "application/problem+json": { schema: ForbiddenProblemSchema } } },
    409: { description: "Invalid transition", content: { "application/problem+json": { schema: ConflictProblemSchema } } },
    422: { description: "Missing required fields or <3 images", content: { "application/problem+json": { schema: ValidationProblemSchema } } },
  },
});

// Action: POST /api/v1/properties/{id}/resubmit
registry.registerPath({
  method: "post",
  path: "/api/v1/properties/{id}/resubmit",
  tags: ["Catalog", "Agent"],
  summary: "Resubmit rejected listing for review (P5)",
  security: [{ sessionAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
  },
  responses: {
    200: { description: "Property resubmitted", content: { "application/json": { schema: PropertyResponseSchema } } },
    409: { description: "Invalid transition", content: { "application/problem+json": { schema: ConflictProblemSchema } } },
  },
});

// Action: POST /api/v1/properties/{id}/archive
registry.registerPath({
  method: "post",
  path: "/api/v1/properties/{id}/archive",
  tags: ["Catalog", "Agent"],
  summary: "Archive a published listing (P7)",
  security: [{ sessionAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
  },
  responses: {
    200: { description: "Property archived", content: { "application/json": { schema: PropertyResponseSchema } } },
    409: { description: "Active reservation prevents archiving", content: { "application/problem+json": { schema: ConflictProblemSchema } } },
  },
});


// Action: POST /api/v1/properties/{id}/relist
registry.registerPath({
  method: "post",
  path: "/api/v1/properties/{id}/relist",
  tags: ["Catalog", "Agent"],
  summary: "Relist archived listing back to draft (P14)",
  security: [{ sessionAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
  },
  responses: {
    200: { description: "Property relisted to DRAFT", content: { "application/json": { schema: PropertyResponseSchema } } },
  },
});

// Admin: POST /api/v1/admin/properties/{id}/approve
registry.registerPath({
  method: "post",
  path: "/api/v1/admin/properties/{id}/approve",
  tags: ["Catalog", "Admin"],
  summary: "Approve listing for publication (P3)",
  security: [{ sessionAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
  },
  responses: {
    200: { description: "Property published", content: { "application/json": { schema: PropertyResponseSchema } } },
  },
});

// Admin: POST /api/v1/admin/properties/{id}/reject
registry.registerPath({
  method: "post",
  path: "/api/v1/admin/properties/{id}/reject",
  tags: ["Catalog", "Admin"],
  summary: "Reject listing from moderation queue (P4)",
  security: [{ sessionAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: { content: { "application/json": { schema: ActionReasonSchema } } },
  },
  responses: {
    200: { description: "Property rejected", content: { "application/json": { schema: PropertyResponseSchema } } },
  },
});

// Admin: POST /api/v1/admin/properties/{id}/suspend
registry.registerPath({
  method: "post",
  path: "/api/v1/admin/properties/{id}/suspend",
  tags: ["Catalog", "Admin"],
  summary: "Suspend a listing immediately (P12)",
  security: [{ sessionAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: { content: { "application/json": { schema: ActionReasonSchema } } },
  },
  responses: {
    200: { description: "Property suspended", content: { "application/json": { schema: PropertyResponseSchema } } },
  },
});

// Admin: POST /api/v1/admin/properties/{id}/unsuspend
registry.registerPath({
  method: "post",
  path: "/api/v1/admin/properties/{id}/unsuspend",
  tags: ["Catalog", "Admin"],
  summary: "Unsuspend listing (P13)",
  security: [{ sessionAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
    query: z.object({ target: z.enum(["PUBLISHED", "ARCHIVED"]).default("PUBLISHED") }),
  },
  responses: {
    200: { description: "Property unsuspended", content: { "application/json": { schema: PropertyResponseSchema } } },
  },
});

// My properties: GET /api/v1/me/properties
registry.registerPath({
  method: "get",
  path: "/api/v1/me/properties",
  tags: ["Catalog", "Agent"],
  summary: "List current agent listings",
  security: [{ sessionAuth: [] }],
  responses: {
    200: {
      description: "List of agent properties",
      content: { "application/json": { schema: PropertyListResponseSchema } },
    },
  },
});

// ==============================================================================
// 2. Express Route Handlers
// ==============================================================================

const ListPropertiesQuerySchema = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

// Public routes
propertyRouter.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = ListPropertiesQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return next(validationError(parsed.error, req.originalUrl));
    }
    const result = await propertyService.listPublicProperties(parsed.data);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

propertyRouter.get("/slug/:slug", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const slug = req.params.slug as string;
    const result = await propertyService.getPropertyBySlug(slug);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

propertyRouter.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const result = await propertyService.getPropertyById(id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

// Agent creation
propertyRouter.post(
  "/",
  requireRole("AGENT", "ADMIN"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = CreatePropertySchema.safeParse(req.body);
      if (!parsed.success) {
        return next(validationError(parsed.error, req.originalUrl));
      }

      const result = await propertyService.createDraft(req.user!.id, parsed.data);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }
);

// Agent update (two-tier edit)
propertyRouter.patch(
  "/:id",
  requireRole("AGENT", "ADMIN"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const parsed = UpdatePropertySchema.safeParse(req.body);
      if (!parsed.success) {
        return next(validationError(parsed.error, req.originalUrl));
      }

      const result = await propertyService.editProperty(req.user!.id, id, parsed.data);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
);

// Agent delete draft
propertyRouter.delete(
  "/:id",
  requireRole("AGENT", "ADMIN"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      await propertyService.deleteProperty(req.user!.id, id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);

// P2: Submit
propertyRouter.post(
  "/:id/submit",
  requireRole("AGENT", "ADMIN"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const result = await propertyService.submitForReview(req.user!.id, id);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
);

// P5: Resubmit
propertyRouter.post(
  "/:id/resubmit",
  requireRole("AGENT", "ADMIN"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const result = await propertyService.submitForReview(req.user!.id, id);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
);

// P7: Archive
propertyRouter.post(
  "/:id/archive",
  requireRole("AGENT", "ADMIN"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const result = await propertyService.archiveProperty(req.user!.id, id);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
);


// P14: Relist
propertyRouter.post(
  "/:id/relist",
  requireRole("AGENT", "ADMIN"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const result = await propertyService.relistProperty(req.user!.id, id);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
);

// Images sub-resources on property
propertyRouter.delete(
  "/:id/images/:imageId",
  requireRole("AGENT", "ADMIN"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const imageId = req.params.imageId as string;

      const prop = await propertyService.getPropertyOwnerOrThrow(id);
      if (prop.agentId !== req.user!.id && req.user!.role !== "ADMIN") {
        return next(forbiddenError("You do not own this property."));
      }

      await uploadService.deleteImage(id, imageId);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);

propertyRouter.patch(
  "/:id/images/order",
  requireRole("AGENT", "ADMIN"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const parsed = ReorderImagesSchema.safeParse(req.body);
      if (!parsed.success) {
        return next(validationError(parsed.error, req.originalUrl));
      }

      const prop = await propertyService.getPropertyOwnerOrThrow(id);
      if (prop.agentId !== req.user!.id && req.user!.role !== "ADMIN") {
        return next(forbiddenError("You do not own this property."));
      }

      await uploadService.reorderImages(id, parsed.data.imageIds);
      res.status(200).json({ success: true });
    } catch (err) {
      next(err);
    }
  }
);

// ==============================================================================
// Admin Router
// ==============================================================================

adminPropertyRouter.use(requireRole("ADMIN"));

// P3: Approve
adminPropertyRouter.post("/:id/approve", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const result = await propertyService.approveProperty(req.user!.id, id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

// P4: Reject
adminPropertyRouter.post("/:id/reject", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const parsed = ActionReasonSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(validationError(parsed.error, req.originalUrl));
    }

    const result = await propertyService.rejectProperty(req.user!.id, id, parsed.data.reason);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

// P12: Suspend
adminPropertyRouter.post("/:id/suspend", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const parsed = ActionReasonSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(validationError(parsed.error, req.originalUrl));
    }

    const result = await propertyService.suspendProperty(req.user!.id, id, parsed.data.reason);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

// P13: Unsuspend
adminPropertyRouter.post("/:id/unsuspend", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const target = (req.query.target as "PUBLISHED" | "ARCHIVED") || "PUBLISHED";
    const result = await propertyService.unsuspendProperty(req.user!.id, id, target);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

// ==============================================================================
// My Properties Router (Agent's personal dashboard feed)
// ==============================================================================

myPropertyRouter.use(requireRole("AGENT", "ADMIN"));

myPropertyRouter.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = ListPropertiesQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return next(validationError(parsed.error, req.originalUrl));
    }
    const result = await propertyService.listAgentProperties(req.user!.id, parsed.data);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});
