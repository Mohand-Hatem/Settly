// ==============================================================================
// Knowledge Module — DTOs
// Governed by RAG.md §4-5, AI.md §7, DECISIONS.md #42
// ==============================================================================

export interface ArticleDto {
  id: string;
  slug: string;
  titleEn: string;
  bodyEn: string;
  category: "GUIDE" | "FAQ" | "LEGAL" | "MARKET";
  isPublished: boolean;
  publishedAt: string | null;
  areaId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ArticleSummaryDto {
  id: string;
  slug: string;
  titleEn: string;
  category: "GUIDE" | "FAQ" | "LEGAL" | "MARKET";
  publishedAt: string | null;
  areaId: string | null;
}

export interface ArticleListDto {
  items: ArticleSummaryDto[];
  nextCursor: string | null;
  total: number;
}

export interface RagChunkDto {
  chunkText: string;
  sourceType: "ARTICLE_CHUNK" | "DOCUMENT_CHUNK";
  distance: number;
  articleSlug: string | null;
}

/**
 * The abstain sentinel is the canonical "I don't have information on that" response.
 * RAG.md §7: abstention is a success state, not a failure.
 */
export interface RagRetrieveResponseDto {
  chunks: RagChunkDto[];
  abstain: boolean;
}

export interface IngestArticleParams {
  slug: string;
  titleEn: string;
  bodyEn: string;
  category: "GUIDE" | "FAQ" | "LEGAL" | "MARKET";
  areaId?: string | null;
  isPublished?: boolean;
}

export interface RagRetrieveParams {
  query: string;
  /** Authenticated actor ID — null for anonymous callers (PUBLIC-only retrieval) */
  actorId: string | null;
  /** Optional property context for PARTY-scoped document retrieval */
  propertyId?: string | null;
}

export interface RagRetrieveSqlRow {
  id: string;
  chunkText: string;
  sourceType: string;
  sourceId: string;
  articleId: string | null;
  documentId: string | null;
  distance: number;
}
