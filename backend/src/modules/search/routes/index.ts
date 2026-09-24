import { Router, type Request, type Response, type NextFunction } from "express";
import { searchService } from "../service/index.js";
import {
  SearchPropertiesQuerySchema,
  SearchPropertiesResponseSchema,
  SearchClustersResponseSchema,
} from "../schema/search.schema.js";
import { registry, ValidationProblemSchema } from "../../../shared/openapi/registry.js";
import { validationError } from "../../../shared/errors/problem-details.js";

export const searchRouter: Router = Router();

// ==============================================================================
// 1. OpenAPI Declarations
// ==============================================================================

registry.registerPath({
  method: "get",
  path: "/api/v1/search/properties",
  tags: ["Search"],
  summary: "Hybrid search for properties (Lexical + Semantic pgvector + RRF)",
  description:
    "Executes hybrid search across PostgreSQL full-text search and vector embeddings with Reciprocal Rank Fusion (RRF). Extracts deterministic query chips from natural language search.",
  request: {
    query: SearchPropertiesQuerySchema,
  },
  responses: {
    200: {
      description: "Search results with parsed chips and pagination",
      content: { "application/json": { schema: SearchPropertiesResponseSchema } },
    },
    422: {
      description: "Validation error",
      content: { "application/problem+json": { schema: ValidationProblemSchema } },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/search/properties/clusters",
  tags: ["Search"],
  summary: "Spatial cluster aggregates for low-zoom map viewports",
  description:
    "Returns server-side spatial cluster centroids and counts using PostGIS ST_SnapToGrid, sharing the same filtering logic as entity search.",
  request: {
    query: SearchPropertiesQuerySchema,
  },
  responses: {
    200: {
      description: "Map clusters and total count",
      content: { "application/json": { schema: SearchClustersResponseSchema } },
    },
    422: {
      description: "Validation error",
      content: { "application/problem+json": { schema: ValidationProblemSchema } },
    },
  },
});

// ==============================================================================
// 2. Route Implementations
// ==============================================================================

searchRouter.get("/health", (_req, res) => {
  res.json({ module: "search", status: "ok" });
});

searchRouter.get("/properties/clusters", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parse = SearchPropertiesQuerySchema.safeParse(req.query);
    if (!parse.success) {
      return next(validationError(parse.error));
    }

    const clusters = await searchService.getClusters(parse.data);
    res.status(200).json(clusters);
  } catch (err) {
    next(err);
  }
});

searchRouter.get("/properties", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parse = SearchPropertiesQuerySchema.safeParse(req.query);
    if (!parse.success) {
      return next(validationError(parse.error));
    }

    const results = await searchService.searchProperties(parse.data);
    res.status(200).json(results);
  } catch (err) {
    next(err);
  }
});
