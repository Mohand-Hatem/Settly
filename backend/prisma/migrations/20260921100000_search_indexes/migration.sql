-- ==============================================================================
-- Search & Intelligence Indexes: GIN for Lexical FTS & HNSW for Vector Search
-- Governed by SEARCH.md §5, §7 and Decision #24
-- ==============================================================================

-- 1. GIN index on Property English tsvector for lexical search
CREATE INDEX IF NOT EXISTS "property_search_vector_en_idx" 
ON "Property" USING gin ("searchVectorEn");

-- 2. Partial HNSW index on Property embedding (vector_cosine_ops) for PUBLISHED properties
CREATE INDEX IF NOT EXISTS "property_embedding_hnsw_idx" 
ON "Property" USING hnsw ("embedding" vector_cosine_ops) 
WHERE "status" = 'PUBLISHED';

-- 3. HNSW index on Knowledge/Document chunk Embedding table
CREATE INDEX IF NOT EXISTS "embedding_hnsw_idx" 
ON "Embedding" USING hnsw ("embedding" vector_cosine_ops);
