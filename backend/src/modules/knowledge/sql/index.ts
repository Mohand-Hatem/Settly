import { prisma } from "../../../shared/database/prisma.js";
import type { RagRetrieveSqlRow } from "../types/index.js";

/**
 * RAG relevance floor: cosine distance threshold.
 * Governed by RAG.md §4: chunks with distance >= floor are discarded.
 * distance < FLOOR → above floor → included in results.
 * FLOOR = 0.30 means we require at least ~70% directional similarity.
 */
const RAG_RELEVANCE_FLOOR = 0.30;

/**
 * Max chunks to retrieve before applying the relevance floor.
 * RAG.md §4: "hybrid retrieve top ~20".
 */
const RAG_CANDIDATE_LIMIT = 20;

/**
 * Max chunks passed to the LLM after floor filtering.
 */
const RAG_MAX_RETURNED = 5;

/**
 * Executes the visibility-filtered RAG retrieval query against pgvector.
 *
 * ⚠️ SECURITY KERNEL — RAG.md §4–5, Decision #42:
 * Visibility is filtered IN-QUERY as SQL predicates on Embedding rows.
 * Post-filtering in application code is NEVER acceptable.
 *
 * Scopes enforced:
 *   PUBLIC  — any actor (anonymous or authenticated)
 *   PARTY   — listing agent OR buyer with a live offer on the same property as the document
 *   PRIVATE — the document uploader only
 *
 * KnowledgeArticle embeddings are always PUBLIC (no Document relation).
 */
export async function executeRagRetrievalSql(
  queryVector: number[],
  actorId: string | null
): Promise<RagRetrieveSqlRow[]> {
  const vectorStr = `[${queryVector.join(",")}]`;
  // actorId is nullable for anonymous callers — all PARTY/PRIVATE filters will fail closed
  const actor = actorId ?? null;

  const sql = `
    WITH ranked AS (
      SELECT
        e.id,
        e."chunkText",
        e."sourceType",
        e."sourceId",
        e."articleId",
        e."documentId",
        (e.embedding <=> $1::vector) AS distance
      FROM "Embedding" e
      WHERE e.embedding IS NOT NULL
        AND (
          -- PUBLIC: retrievable by anyone
          e."visibilityScope" = 'PUBLIC'
          OR
          -- PARTY: listing agent OR buyer with a live offer on this property's document
          (
            e."visibilityScope" = 'PARTY'
            AND $2::text IS NOT NULL
            AND e."documentId" IS NOT NULL
            AND EXISTS (
              SELECT 1
              FROM "Document" d
              JOIN "Property" prop ON prop.id = d."propertyId"
              WHERE d.id = e."documentId"
                AND (
                  -- The uploader (listing agent) is the actor
                  d."uploaderId" = $2
                  OR
                  -- The actor is a buyer with a live offer on this property
                  EXISTS (
                    SELECT 1 FROM "Offer" o
                    WHERE o."propertyId" = d."propertyId"
                      AND o."buyerId" = $2
                      AND o.status IN ('PENDING_AGENT', 'PENDING_BUYER', 'ACCEPTED', 'RESERVED')
                  )
                )
            )
          )
          OR
          -- PRIVATE: uploader only
          (
            e."visibilityScope" = 'PRIVATE'
            AND $2::text IS NOT NULL
            AND e."documentId" IS NOT NULL
            AND EXISTS (
              SELECT 1 FROM "Document" d
              WHERE d.id = e."documentId"
                AND d."uploaderId" = $2
            )
          )
        )
      ORDER BY distance ASC
      LIMIT $3
    )
    SELECT *
    FROM ranked
    WHERE distance < $4::float8
    LIMIT $5;
  `;

  const rows = await prisma.$queryRawUnsafe<RagRetrieveSqlRow[]>(
    sql,
    vectorStr,
    actor,
    RAG_CANDIDATE_LIMIT,
    RAG_RELEVANCE_FLOOR,
    RAG_MAX_RETURNED
  );

  return rows;
}

/**
 * Drift sweeper SQL: finds Embedding rows whose visibilityScope has drifted
 * from their source Document's current visibilityScope.
 * RAG.md §6 / Decision #42: any non-zero count is a security incident.
 */
export async function executeDriftSweepSql(): Promise<number> {
  const result = await prisma.$queryRawUnsafe<{ count: bigint }[]>(`
    SELECT COUNT(*)::bigint AS count
    FROM "Embedding" e
    JOIN "Document" d ON d.id = e."documentId"
    WHERE e."documentId" IS NOT NULL
      AND e."visibilityScope" != d."visibilityScope"
  `);
  const row = result[0];
  return row ? Number(row.count) : 0;
}
