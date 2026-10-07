-- ==============================================================================
-- Self-Service Agent Applications & KYC Flow (Decisions #49, #55, #56, #57, #74)
-- ==============================================================================

-- 1. Create Enums safely
DO $$ BEGIN
    CREATE TYPE "AgentApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "AgentProofType" AS ENUM ('BROKER_LICENSE', 'BROKERAGE_AUTHORIZATION', 'COMMERCIAL_REGISTRATION', 'OTHER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create AgentApplication table
CREATE TABLE IF NOT EXISTS "AgentApplication" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nationalIdUrl" TEXT NOT NULL,
    "selfieUrl" TEXT NOT NULL,
    "proofType" "AgentProofType" NOT NULL,
    "proofDocumentUrl" TEXT NOT NULL,
    "proofDescription" TEXT,
    "licenseNumber" TEXT NOT NULL,
    "brokerageName" TEXT,
    "bioEn" TEXT,
    "bioAr" TEXT,
    "status" "AgentApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "reviewedByUserId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentApplication_pkey" PRIMARY KEY ("id")
);

-- 3. Decision #74: Database-level uniqueness on pending applications per user
CREATE UNIQUE INDEX IF NOT EXISTS "AgentApplication_userId_pending_idx" 
    ON "AgentApplication"("userId") 
    WHERE "status" = 'PENDING';

CREATE INDEX IF NOT EXISTS "AgentApplication_userId_idx" ON "AgentApplication"("userId");
CREATE INDEX IF NOT EXISTS "AgentApplication_status_idx" ON "AgentApplication"("status");

-- 4. Foreign Key Constraints
DO $$ BEGIN
    ALTER TABLE "AgentApplication" ADD CONSTRAINT "AgentApplication_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "AgentApplication" ADD CONSTRAINT "AgentApplication_reviewedByUserId_fkey" 
        FOREIGN KEY ("reviewedByUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
