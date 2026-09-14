import fs from 'node:fs';
import path from 'node:path';

const tempDiffPath = path.resolve('prisma/temp_diff.sql');
const targetMigrationPath = path.resolve('prisma/migrations/0_init/migration.sql');

if (!fs.existsSync(tempDiffPath)) {
  console.error('Missing temp_diff.sql');
  process.exit(1);
}

let diffSql = fs.readFileSync(tempDiffPath, 'utf8');

// Replace standard tsvector definitions with immutable GENERATED ALWAYS AS columns
diffSql = diffSql.replace(
  '"searchVectorEn" tsvector,',
  `"searchVectorEn" tsvector GENERATED ALWAYS AS (to_tsvector('english', coalesce("titleEn", '') || ' ' || coalesce("descriptionEn", ''))) STORED,`
);

diffSql = diffSql.replace(
  '"searchVectorAr" tsvector,',
  `"searchVectorAr" tsvector GENERATED ALWAYS AS (to_tsvector('simple', ar_normalize(coalesce("titleAr", '') || ' ' || coalesce("descriptionAr", '')))) STORED,`
);

const headerSql = `-- ==============================================================================
-- 1. PostgreSQL Extensions
-- ==============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- ==============================================================================
-- 2. Custom Functions (Arabic Normalization & AuditLog Guard)
-- ==============================================================================
CREATE OR REPLACE FUNCTION ar_normalize(input text)
RETURNS text LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$
  SELECT regexp_replace(
    regexp_replace(
      regexp_replace(
        regexp_replace(
          regexp_replace(
            coalesce(input, ''),
            '[\u064B-\u065F\u0670]', '', 'g' -- Harakat / tashkeel stripping
          ),
          '[\u0622\u0623\u0625\u0671]', 'ا', 'g' -- Alef normalization
        ),
        '\u0629', 'ه', 'g' -- Taa marbuta to haa
      ),
      '[\u0649]', 'ي', 'g' -- Alef maksura to yaa
    ),
    '[\u0640]', '', 'g' -- Tatweel stripping
  );
$$;

CREATE OR REPLACE FUNCTION audit_log_immutable_fn()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'AuditLog is append-only. UPDATE and DELETE operations are forbidden.';
END;
$$;

CREATE OR REPLACE FUNCTION property_location_sync()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW."latitude" IS NOT NULL AND NEW."longitude" IS NOT NULL THEN
    NEW."location" := ST_SetSRID(ST_MakePoint(NEW."longitude", NEW."latitude"), 4326)::geography;
  END IF;
  RETURN NEW;
END;
$$;

`;

const footerSql = `
-- ==============================================================================
-- 3. Database Triggers
-- ==============================================================================
DROP TRIGGER IF EXISTS "audit_log_immutable_trg" ON "AuditLog";
CREATE TRIGGER "audit_log_immutable_trg"
BEFORE UPDATE OR DELETE ON "AuditLog"
FOR EACH ROW EXECUTE FUNCTION audit_log_immutable_fn();

DROP TRIGGER IF EXISTS "property_location_sync_trg" ON "Property";
CREATE TRIGGER "property_location_sync_trg"
BEFORE INSERT OR UPDATE OF "latitude", "longitude" ON "Property"
FOR EACH ROW EXECUTE FUNCTION property_location_sync();

-- ==============================================================================
-- 4. Architectural Exclusion Constraints & Invariant Indexes
-- ==============================================================================

-- Viewing overlap exclusion constraint (agent cannot have overlapping confirmed viewings)
ALTER TABLE "Viewing"
DROP CONSTRAINT IF EXISTS "viewing_agent_overlap_excl";

ALTER TABLE "Viewing"
ADD CONSTRAINT "viewing_agent_overlap_excl"
EXCLUDE USING gist (
  "agentId" WITH =,
  tsrange("startsAt", "endsAt") WITH &&
) WHERE ("status" = 'CONFIRMED');

-- Offer deposit race partial unique index (Invariant I1)
CREATE UNIQUE INDEX IF NOT EXISTS "offer_property_reserved_completed_idx"
ON "Offer" ("propertyId")
WHERE "status" IN ('RESERVED', 'COMPLETED');

-- PaymentAttempt non-terminal partial unique index (one in-flight attempt per payment)
CREATE UNIQUE INDEX IF NOT EXISTS "payment_attempt_non_terminal_idx"
ON "PaymentAttempt" ("paymentId")
WHERE "status" IN ('INITIATED', 'REDIRECTED');

-- ==============================================================================
-- 5. Specialized Vector, Geospatial, Full-Text, and Trigram Indexes
-- ==============================================================================

-- PostGIS GiST index on location
CREATE INDEX IF NOT EXISTS "property_location_gist_idx"
ON "Property" USING gist ("location");

-- HNSW Cosine vector indexes for semantic search
CREATE INDEX IF NOT EXISTS "property_embedding_hnsw_idx"
ON "Property" USING hnsw ("embedding" vector_cosine_ops)
WHERE "status" = 'PUBLISHED' AND "embedding" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "embedding_vector_hnsw_idx"
ON "Embedding" USING hnsw ("embedding" vector_cosine_ops)
WHERE "embedding" IS NOT NULL;

-- GIN full-text search indexes on generated tsvectors
CREATE INDEX IF NOT EXISTS "property_search_vector_en_idx"
ON "Property" USING gin ("searchVectorEn");

CREATE INDEX IF NOT EXISTS "property_search_vector_ar_idx"
ON "Property" USING gin ("searchVectorAr");

-- GIN Trigram indexes for fast typo tolerance & autocomplete
CREATE INDEX IF NOT EXISTS "property_title_en_trgm_idx"
ON "Property" USING gin ("titleEn" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "property_title_ar_trgm_idx"
ON "Property" USING gin ("titleAr" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "area_name_en_trgm_idx"
ON "Area" USING gin ("nameEn" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "area_name_ar_trgm_idx"
ON "Area" USING gin ("nameAr" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "user_name_trgm_idx"
ON "user" USING gin ("name" gin_trgm_ops);
`;

const finalSql = `${headerSql}\n${diffSql}\n${footerSql}`;
fs.writeFileSync(targetMigrationPath, finalSql, 'utf8');
console.log(`Generated migration written to: ${targetMigrationPath} (${finalSql.length} bytes)`);
