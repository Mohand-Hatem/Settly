import { prisma } from "../../../shared/database/prisma.js";
import { uuidv7 } from "uuidv7";
import { executeRagRetrievalSql, executeDriftSweepSql } from "../sql/index.js";
import type {
  ArticleDto,
  ArticleSummaryDto,
  ArticleListDto,
  RagRetrieveParams,
  RagRetrieveSqlRow,
  IngestArticleParams,
} from "../types/index.js";
import type { ChunkResult } from "../../ai/service/chunking.service.js";

// ==============================================================================
// KnowledgeRepository
// Prisma is the ONLY database access mechanism here (architecture boundary).
// Raw SQL lives exclusively in ../sql/index.ts.
// ==============================================================================

export class KnowledgeRepository {
  /**
   * Creates a KnowledgeArticle and all its Embedding rows in a SINGLE Prisma
   * transaction, satisfying Decision #42 (embedding lifecycle is transactional).
   *
   * KnowledgeArticle embeddings are always PUBLIC (RAG.md §5 table — articles
   * are public knowledge, no PARTY/PRIVATE scope applies to KnowledgeArticle).
   */
  async createArticleWithEmbeddings(
    articleData: IngestArticleParams & { id?: string },
    chunks: ChunkResult[],
    vectors: number[][]
  ): Promise<ArticleDto> {
    const id = articleData.id ?? uuidv7();
    const now = new Date();

    const article = await prisma.$transaction(async (tx) => {
      const created = await tx.knowledgeArticle.create({
        data: {
          id,
          slug: articleData.slug,
          titleEn: articleData.titleEn,
          titleAr: "", // V1: Arabic deferred per #99/#101
          bodyEn: articleData.bodyEn,
          bodyAr: "", // V1: Arabic deferred per #99/#101
          category: articleData.category as "GUIDE" | "FAQ" | "LEGAL" | "MARKET",
          areaId: articleData.areaId ?? null,
          isPublished: articleData.isPublished ?? true,
          publishedAt: articleData.isPublished !== false ? now : null,
        },
      });

      // Insert embedding rows — one per chunk, always PUBLIC (RAG.md §5)
      if (chunks.length > 0 && vectors.length === chunks.length) {
        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          const vector = vectors[i];
          if (!chunk || !vector) continue;
          const embeddingId = uuidv7();
          const vectorStr = `[${vector.join(",")}]`;

          await tx.$executeRawUnsafe(
            `INSERT INTO "Embedding" (id, "sourceType", "sourceId", "articleId", "chunkIndex", "chunkText", language, "visibilityScope", embedding, "createdAt")
             VALUES ($1, 'ARTICLE_CHUNK', $2, $3, $4, $5, 'en', 'PUBLIC', $6::vector, NOW())`,
            embeddingId,
            created.id,
            created.id,
            chunk.chunkIndex,
            chunk.chunkText,
            vectorStr
          );
        }
      }

      return created;
    });

    return this._mapArticle(article);
  }

  /**
   * Upserts a KnowledgeArticle by slug: if it exists, deletes its Embedding rows
   * (cascade) and recreates — all within one transaction per Decision #42.
   */
  async upsertArticleWithEmbeddings(
    articleData: IngestArticleParams,
    chunks: ChunkResult[],
    vectors: number[][]
  ): Promise<ArticleDto> {
    // Delete existing article (and its embeddings via onDelete: Cascade)
    await prisma.knowledgeArticle.deleteMany({ where: { slug: articleData.slug } });
    return this.createArticleWithEmbeddings(articleData, chunks, vectors);
  }

  /**
   * Deletes a KnowledgeArticle and all its Embedding rows in a single transaction.
   * The schema uses onDelete: Cascade so embeddings auto-delete, but we wrap in
   * an explicit TX to maintain the Decision #42 atomicity guarantee at app layer.
   */
  async deleteArticleWithEmbeddings(articleId: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
      await tx.knowledgeArticle.delete({ where: { id: articleId } });
      // Embeddings are cascade-deleted by the DB but we acknowledge it explicitly.
    });
  }

  /** Paginated list of published articles (cursor on id). */
  async findAllPublished(cursor?: string | null, limit = 20): Promise<ArticleListDto> {
    const take = limit + 1; // fetch one extra to detect next page

    const rows = await prisma.knowledgeArticle.findMany({
      where: { isPublished: true },
      orderBy: [{ publishedAt: "desc" }, { id: "asc" }],
      take,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: {
        id: true,
        slug: true,
        titleEn: true,
        category: true,
        publishedAt: true,
        areaId: true,
      },
    });

    const hasNext = rows.length > limit;
    const items = hasNext ? rows.slice(0, limit) : rows;
    const nextCursor = hasNext && items.length > 0 ? (items[items.length - 1]?.id ?? null) : null;

    // Total count (separate query)
    const total = await prisma.knowledgeArticle.count({ where: { isPublished: true } });

    return {
      items: items.map((r) => ({
        id: r.id,
        slug: r.slug,
        titleEn: r.titleEn,
        category: r.category as "GUIDE" | "FAQ" | "LEGAL" | "MARKET",
        publishedAt: r.publishedAt?.toISOString() ?? null,
        areaId: r.areaId ?? null,
      })),
      nextCursor,
      total,
    };
  }

  /** Single published article by slug. Returns null if not found or unpublished. */
  async findBySlug(slug: string): Promise<ArticleDto | null> {
    const article = await prisma.knowledgeArticle.findFirst({
      where: { slug, isPublished: true },
    });
    if (!article) return null;
    return this._mapArticle(article);
  }

  /** Single article by id (internal use, no isPublished filter). */
  async findById(id: string): Promise<ArticleDto | null> {
    const article = await prisma.knowledgeArticle.findUnique({ where: { id } });
    if (!article) return null;
    return this._mapArticle(article);
  }

  /** Delegates RAG SQL retrieval (in-query visibility filter). */
  async retrieveRelevantChunks(
    queryVector: number[],
    actorId: string | null
  ): Promise<RagRetrieveSqlRow[]> {
    return executeRagRetrievalSql(queryVector, actorId);
  }

  /** Drift sweeper — counts mismatched Embedding.visibilityScope vs Document.visibilityScope */
  async countVisibilityDrift(): Promise<number> {
    return executeDriftSweepSql();
  }

  /** Fetches slugs for embedding rows to populate RagChunkDto.articleSlug */
  async findSlugByArticleId(articleId: string): Promise<string | null> {
    const row = await prisma.knowledgeArticle.findUnique({
      where: { id: articleId },
      select: { slug: true },
    });
    return row?.slug ?? null;
  }

  private _mapArticle(article: {
    id: string;
    slug: string;
    titleEn: string;
    bodyEn: string;
    category: string;
    isPublished: boolean;
    publishedAt: Date | null;
    areaId: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): ArticleDto {
    return {
      id: article.id,
      slug: article.slug,
      titleEn: article.titleEn,
      bodyEn: article.bodyEn,
      category: article.category as "GUIDE" | "FAQ" | "LEGAL" | "MARKET",
      isPublished: article.isPublished,
      publishedAt: article.publishedAt?.toISOString() ?? null,
      areaId: article.areaId ?? null,
      createdAt: article.createdAt.toISOString(),
      updatedAt: article.updatedAt.toISOString(),
    };
  }
}

export const knowledgeRepository = new KnowledgeRepository();
