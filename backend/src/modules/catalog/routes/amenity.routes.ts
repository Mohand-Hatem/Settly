import { Router, type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import * as amenityService from "../service/amenity.service.js";
import {
  AmenityCategoryEnum,
  AmenityItemSchema,
  AmenityListResponseSchema,
  CreateAmenitySchema,
} from "../schema/amenity.schema.js";
import { requireRole } from "../../identity/middleware/auth.middleware.js";
import {
  registry,
  ValidationProblemSchema,
  ForbiddenProblemSchema,
  UnauthenticatedProblemSchema,
} from "../../../shared/openapi/registry.js";
import { validationError } from "../../../shared/errors/problem-details.js";

export const amenityRouter = Router();

// ==============================================================================
// 1. OpenAPI Route Declarations
// ==============================================================================

const AmenityQuerySchema = z.object({
  category: AmenityCategoryEnum.optional(),
});

registry.registerPath({
  method: "get",
  path: "/api/v1/amenities",
  tags: ["Catalog"],
  summary: "List property amenities",
  description: "Retrieve controlled vocabulary of property amenities, optionally filtered by category.",
  request: {
    query: AmenityQuerySchema,
  },
  responses: {
    200: {
      description: "List of amenities",
      content: {
        "application/json": {
          schema: AmenityListResponseSchema,
        },
      },
    },
    422: {
      description: "Validation error",
      content: { "application/problem+json": { schema: ValidationProblemSchema } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/amenities",
  tags: ["Catalog", "Admin"],
  summary: "Create property amenity (Admin only)",
  security: [{ sessionAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateAmenitySchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Amenity created",
      content: {
        "application/json": {
          schema: AmenityItemSchema,
        },
      },
    },
    401: {
      description: "Unauthenticated",
      content: { "application/problem+json": { schema: UnauthenticatedProblemSchema } },
    },
    403: {
      description: "Forbidden",
      content: { "application/problem+json": { schema: ForbiddenProblemSchema } },
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

amenityRouter.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = AmenityQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return next(validationError(parsed.error, req.originalUrl));
    }

    const items = await amenityService.listAmenities(parsed.data.category);
    res.status(200).json({ items });
  } catch (err) {
    next(err);
  }
});

amenityRouter.post(
  "/",
  requireRole("ADMIN"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = CreateAmenitySchema.safeParse(req.body);
      if (!parsed.success) {
        return next(validationError(parsed.error, req.originalUrl));
      }

      const item = await amenityService.createAmenity(parsed.data);
      res.status(201).json(item);
    } catch (err) {
      next(err);
    }
  }
);
