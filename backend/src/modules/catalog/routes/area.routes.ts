import { Router, type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import {
  AreaListResponseSchema,
  AreaQuerySchema,
  AreaItemSchema,
} from "../schema/area.schema.js";
import { areaService } from "../service/area.service.js";
import { registry, ValidationProblemSchema, NotFoundProblemSchema } from "../../../shared/openapi/registry.js";

export const areaRouter = Router();

// ==============================================================================
// 1. Register OpenAPI Specifications for /api/v1/areas
// ==============================================================================

registry.registerPath({
  method: "get",
  path: "/api/v1/areas",
  tags: ["Catalog"],
  summary: "List geographic areas",
  description:
    "Retrieve the hierarchical list of areas in Egypt (governorates, cities, districts, compounds). Supports filtering by administrative level and parent area.",
  request: {
    query: AreaQuerySchema,
  },
  responses: {
    200: {
      description: "Collection of geographic areas",
      content: {
        "application/json": {
          schema: AreaListResponseSchema,
        },
      },
    },
    422: {
      description: "Validation failed for query parameters",
      content: {
        "application/problem+json": {
          schema: ValidationProblemSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/areas/{id}",
  tags: ["Catalog"],
  summary: "Get an area by ID",
  description: "Retrieve detailed area record by its UUIDv7 identifier.",
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ description: "Area UUIDv7 ID" }),
    }),
  },
  responses: {
    200: {
      description: "Bare area resource",
      content: {
        "application/json": {
          schema: AreaItemSchema,
        },
      },
    },
    404: {
      description: "Area not found",
      content: {
        "application/problem+json": {
          schema: NotFoundProblemSchema,
        },
      },
    },
    422: {
      description: "Invalid UUID format",
      content: {
        "application/problem+json": {
          schema: ValidationProblemSchema,
        },
      },
    },
  },
});

// ==============================================================================
// 2. Express Route Handlers
// ==============================================================================

areaRouter.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedQuery = AreaQuerySchema.parse(req.query);
    const result = await areaService.listAreas(validatedQuery);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

areaRouter.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const params = z.object({ id: z.string().uuid() }).parse(req.params);
    const result = await areaService.getAreaById(params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});
