-- BUSINESS_RULES §4: the offer state machine has 10 states; SUPERSEDED (O3/O4) and FELL_THROUGH (O10) were missing.
ALTER TYPE "OfferStatus" ADD VALUE IF NOT EXISTS 'SUPERSEDED';
ALTER TYPE "OfferStatus" ADD VALUE IF NOT EXISTS 'FELL_THROUGH';

-- Rejection and withdrawal audit reasons (O6, O7, O8)
ALTER TABLE "Offer" ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT;
ALTER TABLE "Offer" ADD COLUMN IF NOT EXISTS "withdrawalReason" TEXT;
