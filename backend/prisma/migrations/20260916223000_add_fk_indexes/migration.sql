-- Foreign key indexes to eliminate seq scans on cascading deletes and joins
-- Note: Does NOT touch specialized PostGIS, pgvector, full-text GIN, or Trigram indexes from 0_init

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Area_parentId_idx" ON "Area"("parentId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CollectionItem_propertyId_idx" ON "CollectionItem"("propertyId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PropertyAmenity_amenityId_idx" ON "PropertyAmenity"("amenityId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SavedSearchMatch_propertyId_idx" ON "SavedSearchMatch"("propertyId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "account_userId_idx" ON "account"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "session_userId_idx" ON "session"("userId");
