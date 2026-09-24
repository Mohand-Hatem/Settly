import { logger } from "../../../shared/logger/index.js";
import { knowledgeRepository } from "../repository/index.js";
import { embeddingService } from "../../ai/service/embedding.service.js";
import { chunkText } from "../../ai/service/chunking.service.js";
import type {
  ArticleDto,
  ArticleListDto,
  IngestArticleParams,
  RagChunkDto,
  RagRetrieveParams,
  RagRetrieveResponseDto,
} from "../types/index.js";

// ==============================================================================
// IKnowledgeService interface
// ==============================================================================

export interface IKnowledgeService {
  ingestArticle(params: IngestArticleParams): Promise<ArticleDto>;
  getArticles(cursor?: string | null, limit?: number): Promise<ArticleListDto>;
  getArticleBySlug(slug: string): Promise<ArticleDto | null>;
  retrieveRelevantChunks(params: RagRetrieveParams): Promise<RagRetrieveResponseDto>;
  runDriftSweeper(): Promise<void>;
}

// ==============================================================================
// KnowledgeService
// ==============================================================================

export class KnowledgeService implements IKnowledgeService {
  /**
   * Ingests a KnowledgeArticle:
   *   1. Chunk the English body per RAG.md §3
   *   2. Embed each chunk (Gemini / deterministic fallback in test)
   *   3. Upsert article + embeddings in one transaction (Decision #42)
   */
  async ingestArticle(params: IngestArticleParams): Promise<ArticleDto> {
    logger.info({ slug: params.slug }, "knowledge: ingesting article");

    const chunks = chunkText(params.bodyEn, params.titleEn);

    // Embed all chunks — sequential to avoid rate-limit bursts
    const vectors: number[][] = [];
    for (const chunk of chunks) {
      const vec = await embeddingService.embedText(chunk.chunkText);
      vectors.push(vec);
    }

    const article = await knowledgeRepository.upsertArticleWithEmbeddings(
      params,
      chunks,
      vectors
    );

    logger.info(
      { slug: params.slug, chunkCount: chunks.length },
      "knowledge: article ingested"
    );
    return article;
  }

  /** Paginated list of published articles. */
  async getArticles(cursor?: string | null, limit = 20): Promise<ArticleListDto> {
    return knowledgeRepository.findAllPublished(cursor, limit);
  }

  /** Single published article by slug. */
  async getArticleBySlug(slug: string): Promise<ArticleDto | null> {
    return knowledgeRepository.findBySlug(slug);
  }

  /**
   * RAG retrieval pipeline per RAG.md §4:
   *   1. Embed the query
   *   2. Execute visibility-filtered SQL (in-query, never post-filter)
   *   3. If no chunks survive the relevance floor → abstain
   *   4. Map SQL rows to RagChunkDto (including articleSlug for citations)
   *
   * RAG.md §7: abstention is a success state. The caller (AI assistant)
   * is expected to respond "I don't have information on that" when abstain=true.
   */
  async retrieveRelevantChunks(params: RagRetrieveParams): Promise<RagRetrieveResponseDto> {
    const { query, actorId } = params;

    logger.debug({ queryLength: query.length, actorId }, "knowledge: RAG retrieval started");

    let queryVector: number[];
    try {
      queryVector = await embeddingService.embedText(query);
    } catch (err) {
      logger.error({ err }, "knowledge: failed to embed query — degraded, abstaining");
      return { chunks: [], abstain: true };
    }

    let rows;
    try {
      rows = await knowledgeRepository.retrieveRelevantChunks(queryVector, actorId);
    } catch (err) {
      logger.error({ err }, "knowledge: RAG SQL failed — degraded, abstaining");
      return { chunks: [], abstain: true };
    }

    if (rows.length === 0) {
      logger.debug({ actorId }, "knowledge: no chunks survived relevance floor — abstaining");
      return { chunks: [], abstain: true };
    }

    // Resolve article slugs for citation — batch by unique articleId
    const articleIds = [...new Set(rows.map((r) => r.articleId).filter(Boolean))] as string[];
    const slugMap = new Map<string, string>();
    await Promise.all(
      articleIds.map(async (aid) => {
        const slug = await knowledgeRepository.findSlugByArticleId(aid);
        if (slug) slugMap.set(aid, slug);
      })
    );

    const chunks: RagChunkDto[] = rows.map((r) => ({
      chunkText: r.chunkText,
      sourceType: r.sourceType as "ARTICLE_CHUNK" | "DOCUMENT_CHUNK",
      distance: Number(r.distance),
      articleSlug: r.articleId ? (slugMap.get(r.articleId) ?? null) : null,
    }));

    logger.debug({ chunkCount: chunks.length, actorId }, "knowledge: RAG retrieval complete");
    return { chunks, abstain: false };
  }

  /**
   * Nightly drift sweeper per Decision #42 / RAG.md §6.
   * Compares Embedding.visibilityScope against Document.visibilityScope.
   * Any mismatch is a SECURITY INCIDENT — logged as pino error, never silently ignored.
   */
  async runDriftSweeper(): Promise<void> {
    try {
      const mismatchCount = await knowledgeRepository.countVisibilityDrift();
      if (mismatchCount > 0) {
        logger.error(
          { securityIncident: true, mismatchCount },
          "knowledge: SECURITY INCIDENT — Embedding.visibilityScope drift detected. " +
            "Documents may be retrievable by unauthorized actors through RAG. " +
            "Immediate investigation required per RAG.md §6 / Decision #42."
        );
      } else {
        logger.debug({ mismatchCount: 0 }, "knowledge: visibility drift sweep clean");
      }
    } catch (err) {
      logger.error({ err }, "knowledge: drift sweeper failed");
    }
  }
}

export const knowledgeService = new KnowledgeService();
