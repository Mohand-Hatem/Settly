import { z } from "../../../shared/openapi/zod.js";

// ==============================================================================
// Request / Query Schemas
// ==============================================================================

export const ListArticlesQuerySchema = z.object({
  cursor: z.string().optional().openapi({ description: "Opaque pagination cursor from previous response" }),
  limit: z
    .string()
    .optional()
    .transform((v) => (v ? Math.min(Math.max(parseInt(v, 10), 1), 50) : 20))
    .openapi({ description: "Number of articles to return (1–50, default 20)", example: "20" }),
});

export const GetArticleBySlugParamsSchema = z.object({
  slug: z.string().min(1).openapi({ description: "URL-safe article slug", example: "new-cairo-area-guide" }),
});

export const RagRetrieveRequestSchema = z
  .object({
    query: z.string().min(1).max(1000).openapi({
      description: "Natural language question for RAG retrieval",
      example: "What schools are near New Cairo?",
    }),
    propertyId: z.string().optional().openapi({
      description: "Optional property context for PARTY-scoped document retrieval",
    }),
  })
  .openapi("RagRetrieveRequest");

// ==============================================================================
// Response Schemas
// ==============================================================================

export const ArticleSchema = z
  .object({
    id: z.string(),
    slug: z.string(),
    titleEn: z.string(),
    bodyEn: z.string(),
    category: z.enum(["GUIDE", "FAQ", "LEGAL", "MARKET"]),
    isPublished: z.boolean(),
    publishedAt: z.string().datetime().nullable(),
    areaId: z.string().nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .openapi("Article");

export const ArticleSummarySchema = z
  .object({
    id: z.string(),
    slug: z.string(),
    titleEn: z.string(),
    category: z.enum(["GUIDE", "FAQ", "LEGAL", "MARKET"]),
    publishedAt: z.string().datetime().nullable(),
    areaId: z.string().nullable(),
  })
  .openapi("ArticleSummary");

export const ArticleListSchema = z
  .object({
    items: z.array(ArticleSummarySchema),
    nextCursor: z.string().nullable(),
    total: z.number().int(),
  })
  .openapi("ArticleList");

export const RagChunkSchema = z
  .object({
    chunkText: z.string(),
    sourceType: z.enum(["ARTICLE_CHUNK", "DOCUMENT_CHUNK"]),
    distance: z.number(),
    articleSlug: z.string().nullable(),
  })
  .openapi("RagChunk");

export const RagRetrieveResponseSchema = z
  .object({
    chunks: z.array(RagChunkSchema),
    abstain: z.boolean().openapi({
      description: "True when no relevant chunks survive the relevance floor",
    }),
  })
  .openapi("RagRetrieveResponse");

export type ListArticlesQuery = z.infer<typeof ListArticlesQuerySchema>;
export type GetArticleBySlugParams = z.infer<typeof GetArticleBySlugParamsSchema>;
export type RagRetrieveRequest = z.infer<typeof RagRetrieveRequestSchema>;
