import { Router, type Request, type Response, type NextFunction } from "express";
import { knowledgeService } from "../service/index.js";
import { authenticate } from "../../identity/middleware/auth.middleware.js";
import {
  ListArticlesQuerySchema,
  GetArticleBySlugParamsSchema,
  RagRetrieveRequestSchema,
  ArticleListSchema,
  ArticleSchema,
  RagRetrieveResponseSchema,
} from "../schema/knowledge.schema.js";
import { registry, ValidationProblemSchema, NotFoundProblemSchema } from "../../../shared/openapi/registry.js";
import { validationError, notFoundError } from "../../../shared/errors/problem-details.js";

export const knowledgeRouter: Router = Router();

// ==============================================================================
// 1. OpenAPI Declarations
// ==============================================================================

registry.registerPath({
  method: "get",
  path: "/api/v1/knowledge/articles",
  tags: ["Knowledge"],
  summary: "List published knowledge articles",
  description:
    "Returns a paginated list of published KnowledgeArticle summaries (area guides, FAQs, legal content). Public — no authentication required.",
  request: {
    query: ListArticlesQuerySchema,
  },
  responses: {
    200: {
      description: "Paginated article list",
      content: { "application/json": { schema: ArticleListSchema } },
    },
    422: {
      description: "Validation error",
      content: { "application/problem+json": { schema: ValidationProblemSchema } },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/knowledge/articles/{slug}",
  tags: ["Knowledge"],
  summary: "Get a published article by slug",
  description: "Returns the full body of a single published KnowledgeArticle. Public — no authentication required.",
  request: {
    params: GetArticleBySlugParamsSchema,
  },
  responses: {
    200: {
      description: "Full article",
      content: { "application/json": { schema: ArticleSchema } },
    },
    404: {
      description: "Article not found or not published",
      content: { "application/problem+json": { schema: NotFoundProblemSchema } },
    },
    422: {
      description: "Validation error",
      content: { "application/problem+json": { schema: ValidationProblemSchema } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/knowledge/retrieve",
  tags: ["Knowledge"],
  summary: "RAG retrieval — visibility-filtered semantic search over the knowledge corpus",
  description:
    "Embeds the query, retrieves top-K chunks from the RAG corpus filtered by the actor's visibility scope (PUBLIC/PARTY/PRIVATE per RAG.md §5). " +
    "Returns `abstain: true` when no chunks survive the relevance floor — the correct response is 'I don't have information on that'. " +
    "Authentication is optional — anonymous callers receive PUBLIC chunks only.",
  request: {
    body: {
      content: { "application/json": { schema: RagRetrieveRequestSchema } },
      required: true,
    },
  },
  responses: {
    200: {
      description: "RAG retrieval result (may have abstain: true)",
      content: { "application/json": { schema: RagRetrieveResponseSchema } },
    },
    422: {
      description: "Validation error",
      content: { "application/problem+json": { schema: ValidationProblemSchema } },
    },
  },
});

// ==============================================================================
// 2. Route Handlers
// ==============================================================================

/** GET /api/v1/knowledge/health */
knowledgeRouter.get("/health", (_req: Request, res: Response) => {
  res.json({ module: "knowledge", status: "ok" });
});

/** GET /api/v1/knowledge/articles */
knowledgeRouter.get(
  "/articles",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const parsed = ListArticlesQuerySchema.safeParse(req.query);
    if (!parsed.success) return next(validationError(parsed.error, req.path));

    const { cursor, limit } = parsed.data;
    const result = await knowledgeService.getArticles(cursor, limit).catch(next);
    if (!result) return;
    res.json(result);
  }
);

/** GET /api/v1/knowledge/articles/:slug */
knowledgeRouter.get(
  "/articles/:slug",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const parsed = GetArticleBySlugParamsSchema.safeParse(req.params);
    if (!parsed.success) return next(validationError(parsed.error, req.path));

    const article = await knowledgeService.getArticleBySlug(parsed.data.slug).catch(next);
    if (article === undefined) return; // catch propagated
    if (!article) return next(notFoundError("KnowledgeArticle", parsed.data.slug, req.path));

    res.json(article);
  }
);

/**
 * POST /api/v1/knowledge/retrieve
 * Optional Bearer auth: populates req.user if session present; anonymous otherwise.
 * Visibility scope is determined by actorId (null for anonymous → PUBLIC only).
 */
knowledgeRouter.post(
  "/retrieve",
  authenticate, // optional — populates req.user if session exists, never throws 401
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const parsed = RagRetrieveRequestSchema.safeParse(req.body);
    if (!parsed.success) return next(validationError(parsed.error, req.path));

    const actorId = req.user?.id ?? null;
    const result = await knowledgeService
      .retrieveRelevantChunks({
        query: parsed.data.query,
        actorId,
        propertyId: parsed.data.propertyId ?? null,
      })
      .catch(next);

    if (!result) return;
    res.json(result);
  }
);
