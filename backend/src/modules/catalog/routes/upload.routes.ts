import { Router, type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import * as uploadService from "../service/upload.service.js";
import * as propertyService from "../service/property.service.js";
import {
  AuthorizeUploadSchema,
  AuthorizeUploadResponseSchema,
  CompleteUploadSchema,
  CompleteUploadResponseSchema,
} from "../schema/upload.schema.js";
import { requireAuth } from "../../identity/middleware/auth.middleware.js";
import {
  registry,
  ValidationProblemSchema,
  UnauthenticatedProblemSchema,
} from "../../../shared/openapi/registry.js";
import { validationError, forbiddenError } from "../../../shared/errors/problem-details.js";

export const uploadRouter = Router();

// ==============================================================================
// 1. OpenAPI Declarations
// ==============================================================================

registry.registerPath({
  method: "post",
  path: "/api/v1/uploads/authorize",
  tags: ["Uploads"],
  summary: "Authorize direct media upload",
  description: "Issues signed Cloudinary upload parameters for direct client upload per STORAGE.md Section 3.",
  security: [{ sessionAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: AuthorizeUploadSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Signed upload instructions",
      content: {
        "application/json": {
          schema: AuthorizeUploadResponseSchema,
        },
      },
    },
    401: {
      description: "Unauthenticated",
      content: { "application/problem+json": { schema: UnauthenticatedProblemSchema } },
    },
    422: {
      description: "Validation error",
      content: { "application/problem+json": { schema: ValidationProblemSchema } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/uploads/{assetId}/complete",
  tags: ["Uploads"],
  summary: "Finalize direct upload",
  description: "Binds uploaded provider asset to property record per STORAGE.md Section 3.",
  security: [{ sessionAuth: [] }],
  request: {
    params: z.object({
      assetId: z.string().uuid(),
    }),
    query: z.object({
      propertyId: z.string().uuid().optional(),
    }),
    body: {
      content: {
        "application/json": {
          schema: CompleteUploadSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Upload finalized",
      content: {
        "application/json": {
          schema: CompleteUploadResponseSchema,
        },
      },
    },
    401: {
      description: "Unauthenticated",
      content: { "application/problem+json": { schema: UnauthenticatedProblemSchema } },
    },
    422: {
      description: "Validation error",
      content: { "application/problem+json": { schema: ValidationProblemSchema } },
    },
  },
});

// ==============================================================================
// 2. Express Route Handlers
// ==============================================================================

uploadRouter.post(
  "/authorize",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = AuthorizeUploadSchema.safeParse(req.body);
      if (!parsed.success) {
        return next(validationError(parsed.error, req.originalUrl));
      }

      // If propertyId provided, check agent ownership
      if (parsed.data.propertyId) {
        const prop = await propertyService.getPropertyById(parsed.data.propertyId);
        if (prop.agentId !== req.user!.id && req.user!.role !== "ADMIN") {
          return next(forbiddenError("You do not own this property.", req.originalUrl));
        }
      }

      const result = await uploadService.authorizeUpload({
        userId: req.user!.id,
        input: parsed.data,
      });

      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
);

uploadRouter.post(
  "/:assetId/complete",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const params = z.object({ assetId: z.string().uuid() }).safeParse(req.params);
      if (!params.success) {
        return next(validationError(params.error, req.originalUrl));
      }

      const query = z.object({ propertyId: z.string().uuid().optional() }).safeParse(req.query);
      if (!query.success) {
        return next(validationError(query.error, req.originalUrl));
      }

      const parsed = CompleteUploadSchema.safeParse(req.body);
      if (!parsed.success) {
        return next(validationError(parsed.error, req.originalUrl));
      }

      const propertyId = query.data.propertyId;
      if (propertyId) {
        const prop = await propertyService.getPropertyById(propertyId);
        if (prop.agentId !== req.user!.id && req.user!.role !== "ADMIN") {
          return next(forbiddenError("You do not own this property.", req.originalUrl));
        }
      }

      const result = await uploadService.completeUpload({
        assetId: params.data.assetId,
        propertyId,
        input: parsed.data,
      });

      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
);
