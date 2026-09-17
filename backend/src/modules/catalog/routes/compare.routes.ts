import { Router, type Request, type Response, type NextFunction } from "express";
import { registry, ValidationProblemSchema } from "../../../shared/openapi/registry.js";
import {
  CompareQuerySchema,
  CompareResponseSchema,
  type CompareResponse,
} from "../schema/compare.schema.js";
import * as propertyService from "../service/property.service.js";

export const compareRouter = Router();

// ==============================================================================
// 1. Register OpenAPI Path
// ==============================================================================

registry.registerPath({
  method: "get",
  path: "/api/v1/catalog/compare",
  tags: ["Catalog"],
  summary: "Compare multiple properties",
  description:
    "Retrieve side-by-side architectural and financial specifications for between 2 and 4 residences.",
  request: {
    query: CompareQuerySchema,
  },
  responses: {
    200: {
      description: "Comparison specifications matrix",
      content: {
        "application/json": {
          schema: CompareResponseSchema,
        },
      },
    },
    422: {
      description: "Validation failed (e.g. fewer than 2 or more than 4 properties specified)",
      content: {
        "application/problem+json": {
          schema: ValidationProblemSchema,
        },
      },
    },
  },
});

// ==============================================================================
// 2. Express Route Handler
// ==============================================================================

compareRouter.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { ids } = CompareQuerySchema.parse(req.query);
    const refs = ids
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const items = await propertyService.compareProperties(refs);
    const body: CompareResponse = { items, count: items.length };
    res.json(body);
  } catch (error) {
    next(error);
  }
});
