import { prisma } from "../../../shared/database/prisma.js";

export interface SearchSqlFilters {
  intent?: string | null;
  propertyType?: string | null;
  minPrice?: bigint | null;
  maxPrice?: bigint | null;
  bedrooms?: number | null;
  areaId?: string | null;
  bounds?: {
    minLng: number;
    minLat: number;
    maxLng: number;
    maxLat: number;
  } | null;
}

export interface HybridSearchSqlParams {
  filters: SearchSqlFilters;
  textQuery?: string | null;
  vector?: number[] | null;
  limit: number;
  offset: number;
}

export interface SearchIdScoreRow {
  id: string;
  rrf_score?: number;
}

export interface ClusterRow {
  lat: number;
  lng: number;
  count: number;
}

/**
 * Executes hybrid search with Reciprocal Rank Fusion (RRF, k=60)
 * over PostgreSQL tsvector and pgvector embeddings.
 * Governed by SEARCH.md §4-6.
 */
export async function executeHybridSearchSql(params: HybridSearchSqlParams): Promise<{ ids: string[]; total: number }> {
  const { filters, textQuery, vector, limit, offset } = params;

  const hasLexical = Boolean(textQuery && textQuery.trim().length > 0);
  const cleanText = textQuery?.trim() || "";
  const hasVector = Boolean(vector && vector.length > 0);
  const vectorStr = hasVector ? `[${vector!.join(",")}]` : null;

  const hasBounds = Boolean(filters.bounds);
  const minLng = filters.bounds?.minLng ?? 0;
  const minLat = filters.bounds?.minLat ?? 0;
  const maxLng = filters.bounds?.maxLng ?? 0;
  const maxLat = filters.bounds?.maxLat ?? 0;

  const intent = filters.intent || null;
  const propertyType = filters.propertyType || null;
  const minPrice = filters.minPrice ? filters.minPrice.toString() : null;
  const maxPrice = filters.maxPrice ? filters.maxPrice.toString() : null;
  const bedrooms = filters.bedrooms !== undefined && filters.bedrooms !== null ? filters.bedrooms : null;
  const areaId = filters.areaId || null;

  // 1. If text query is present (Lexical and/or Semantic)
  if (hasLexical || hasVector) {
    const querySql = `
      WITH candidates AS (
        SELECT 
          p.id,
          p."featured",
          p."publishedAt",
          p."createdAt",
          CASE 
            WHEN $1::boolean AND p."searchVectorEn" IS NOT NULL 
              THEN ts_rank_cd(p."searchVectorEn", plainto_tsquery('english', $2::text))
            ELSE 0.0 
          END AS lex_score,
          CASE 
            WHEN $3::boolean AND p."embedding" IS NOT NULL 
              THEN (p."embedding" <=> $4::vector)
            ELSE 1.0 
          END AS sem_dist
        FROM "Property" p
        WHERE p."status" IN ('PUBLISHED', 'RESERVED')
          AND ($5::text IS NULL OR p."listingIntent"::text = $5)
          AND ($6::text IS NULL OR p."propertyType"::text = $6)
          AND ($7::numeric IS NULL OR p."price" >= $7::numeric)
          AND ($8::numeric IS NULL OR p."price" <= $8::numeric)
          AND ($9::int IS NULL OR p."bedrooms" >= $9)
          AND ($10::text IS NULL OR p."areaId" IN (
            SELECT a.id FROM "Area" a 
            WHERE a.id = $10 
               OR a."parentId" = $10 
               OR a."parentId" IN (SELECT sub.id FROM "Area" sub WHERE sub."parentId" = $10)
          ))
          AND ($11::boolean = FALSE OR (
            p."location" IS NOT NULL AND 
            ST_Intersects(p."location", ST_MakeEnvelope($12::float8, $13::float8, $14::float8, $15::float8, 4326)::geography)
          ))
          AND (
            $1::boolean = FALSE
            OR p."searchVectorEn" @@ plainto_tsquery('english', $2::text)
            OR p."titleEn" ILIKE '%' || $2::text || '%'
            OR $3::boolean = TRUE
          )
      ),
      ranked AS (
        SELECT 
          id,
          "featured",
          "publishedAt",
          "createdAt",
          CASE WHEN $1::boolean THEN ROW_NUMBER() OVER (ORDER BY lex_score DESC) ELSE NULL END AS rank_lex,
          CASE WHEN $3::boolean THEN ROW_NUMBER() OVER (ORDER BY sem_dist ASC) ELSE NULL END AS rank_sem
        FROM candidates
      ),
      fused AS (
        SELECT
          id,
          (
            COALESCE(1.0 / (60.0 + rank_lex), 0.0) +
            COALESCE(1.0 / (60.0 + rank_sem), 0.0) +
            (CASE WHEN "featured" = true THEN 0.005 ELSE 0.0 END)
          ) AS rrf_score,
          "publishedAt",
          "createdAt"
        FROM ranked
      )
      SELECT id, rrf_score
      FROM fused
      ORDER BY rrf_score DESC, "publishedAt" DESC NULLS LAST, "createdAt" DESC
      LIMIT $16 OFFSET $17;
    `;

    const countSql = `
      SELECT COUNT(*)::int AS count
      FROM "Property" p
      WHERE p."status" IN ('PUBLISHED', 'RESERVED')
        AND ($1::text IS NULL OR p."listingIntent"::text = $1)
        AND ($2::text IS NULL OR p."propertyType"::text = $2)
        AND ($3::numeric IS NULL OR p."price" >= $3::numeric)
        AND ($4::numeric IS NULL OR p."price" <= $4::numeric)
        AND ($5::int IS NULL OR p."bedrooms" >= $5)
        AND ($6::text IS NULL OR p."areaId" IN (
          SELECT a.id FROM "Area" a 
          WHERE a.id = $6 
             OR a."parentId" = $6 
             OR a."parentId" IN (SELECT sub.id FROM "Area" sub WHERE sub."parentId" = $6)
        ))
        AND ($7::boolean = FALSE OR (
          p."location" IS NOT NULL AND 
          ST_Intersects(p."location", ST_MakeEnvelope($8::float8, $9::float8, $10::float8, $11::float8, 4326)::geography)
        ))
        AND (
          $12::boolean = FALSE
          OR p."searchVectorEn" @@ plainto_tsquery('english', $13::text)
          OR p."titleEn" ILIKE '%' || $13::text || '%'
          OR $14::boolean = TRUE
        );
    `;

    const [rows, countRows] = await Promise.all([
      prisma.$queryRawUnsafe<SearchIdScoreRow[]>(
        querySql,
        hasLexical,
        cleanText,
        hasVector,
        vectorStr,
        intent,
        propertyType,
        minPrice,
        maxPrice,
        bedrooms,
        areaId,
        hasBounds,
        minLng,
        minLat,
        maxLng,
        maxLat,
        limit,
        offset
      ),
      prisma.$queryRawUnsafe<{ count: number }[]>(
        countSql,
        intent,
        propertyType,
        minPrice,
        maxPrice,
        bedrooms,
        areaId,
        hasBounds,
        minLng,
        minLat,
        maxLng,
        maxLat,
        hasLexical,
        cleanText,
        hasVector
      ),
    ]);

    const ids = rows.map((r) => r.id);
    const total = countRows[0]?.count ? Number(countRows[0].count) : ids.length;

    return { ids, total };
  }

  // 2. Structured-only Filter Search (no text/vector)
  const structuredQuerySql = `
    SELECT p.id, 0.0 AS rrf_score
    FROM "Property" p
    WHERE p."status" IN ('PUBLISHED', 'RESERVED')
      AND ($1::text IS NULL OR p."listingIntent"::text = $1)
      AND ($2::text IS NULL OR p."propertyType"::text = $2)
      AND ($3::numeric IS NULL OR p."price" >= $3::numeric)
      AND ($4::numeric IS NULL OR p."price" <= $4::numeric)
      AND ($5::int IS NULL OR p."bedrooms" >= $5)
      AND ($6::text IS NULL OR p."areaId" IN (
        SELECT a.id FROM "Area" a 
        WHERE a.id = $6 
           OR a."parentId" = $6 
           OR a."parentId" IN (SELECT sub.id FROM "Area" sub WHERE sub."parentId" = $6)
      ))
      AND ($7::boolean = FALSE OR (
        p."location" IS NOT NULL AND 
        ST_Intersects(p."location", ST_MakeEnvelope($8::float8, $9::float8, $10::float8, $11::float8, 4326)::geography)
      ))
    ORDER BY p."featured" DESC, p."publishedAt" DESC NULLS LAST, p."createdAt" DESC
    LIMIT $12 OFFSET $13;
  `;

  const structuredCountSql = `
    SELECT COUNT(*)::int AS count
    FROM "Property" p
    WHERE p."status" IN ('PUBLISHED', 'RESERVED')
      AND ($1::text IS NULL OR p."listingIntent"::text = $1)
      AND ($2::text IS NULL OR p."propertyType"::text = $2)
      AND ($3::numeric IS NULL OR p."price" >= $3::numeric)
      AND ($4::numeric IS NULL OR p."price" <= $4::numeric)
      AND ($5::int IS NULL OR p."bedrooms" >= $5)
      AND ($6::text IS NULL OR p."areaId" IN (
        SELECT a.id FROM "Area" a 
        WHERE a.id = $6 
           OR a."parentId" = $6 
           OR a."parentId" IN (SELECT sub.id FROM "Area" sub WHERE sub."parentId" = $6)
      ))
      AND ($7::boolean = FALSE OR (
        p."location" IS NOT NULL AND 
        ST_Intersects(p."location", ST_MakeEnvelope($8::float8, $9::float8, $10::float8, $11::float8, 4326)::geography)
      ));
  `;

  const [rows, countRows] = await Promise.all([
    prisma.$queryRawUnsafe<SearchIdScoreRow[]>(
      structuredQuerySql,
      intent,
      propertyType,
      minPrice,
      maxPrice,
      bedrooms,
      areaId,
      hasBounds,
      minLng,
      minLat,
      maxLng,
      maxLat,
      limit,
      offset
    ),
    prisma.$queryRawUnsafe<Array<{ count: number }>>(
      structuredCountSql,
      intent,
      propertyType,
      minPrice,
      maxPrice,
      bedrooms,
      areaId,
      hasBounds,
      minLng,
      minLat,
      maxLng,
      maxLat
    ),
  ]);

  return {
    ids: rows.map((r) => r.id),
    total: countRows[0]?.count || 0,
  };
}

/**
 * Server-side clustering query using PostGIS ST_SnapToGrid
 * Governed by SEARCH.md §3, §8.
 */
export async function executeSearchClustersSql(filters: SearchSqlFilters, gridSize = 0.05): Promise<ClusterRow[]> {
  const hasBounds = Boolean(filters.bounds);
  const minLng = filters.bounds?.minLng ?? 0;
  const minLat = filters.bounds?.minLat ?? 0;
  const maxLng = filters.bounds?.maxLng ?? 0;
  const maxLat = filters.bounds?.maxLat ?? 0;

  const intent = filters.intent || null;
  const propertyType = filters.propertyType || null;
  const minPrice = filters.minPrice ? filters.minPrice.toString() : null;
  const maxPrice = filters.maxPrice ? filters.maxPrice.toString() : null;
  const bedrooms = filters.bedrooms !== undefined && filters.bedrooms !== null ? filters.bedrooms : null;
  const areaId = filters.areaId || null;

  const clusterSql = `
    SELECT 
      AVG(ST_Y(p."location"::geometry))::float8 AS lat,
      AVG(ST_X(p."location"::geometry))::float8 AS lng,
      COUNT(*)::int AS count
    FROM "Property" p
    WHERE p."status" IN ('PUBLISHED', 'RESERVED')
      AND p."location" IS NOT NULL
      AND ($1::text IS NULL OR p."listingIntent"::text = $1)
      AND ($2::text IS NULL OR p."propertyType"::text = $2)
      AND ($3::numeric IS NULL OR p."price" >= $3::numeric)
      AND ($4::numeric IS NULL OR p."price" <= $4::numeric)
      AND ($5::int IS NULL OR p."bedrooms" >= $5)
      AND ($6::text IS NULL OR p."areaId" IN (
        SELECT a.id FROM "Area" a 
        WHERE a.id = $6 
           OR a."parentId" = $6 
           OR a."parentId" IN (SELECT sub.id FROM "Area" sub WHERE sub."parentId" = $6)
      ))
      AND ($7::boolean = FALSE OR ST_Intersects(p."location", ST_MakeEnvelope($8::float8, $9::float8, $10::float8, $11::float8, 4326)::geography))
    GROUP BY ST_SnapToGrid(p."location"::geometry, $12::float8);
  `;

  return prisma.$queryRawUnsafe<ClusterRow[]>(
    clusterSql,
    intent,
    propertyType,
    minPrice,
    maxPrice,
    bedrooms,
    areaId,
    hasBounds,
    minLng,
    minLat,
    maxLng,
    maxLat,
    gridSize
  );
}
