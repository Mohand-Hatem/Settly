-- AlterTable
ALTER TABLE "Offer" ADD COLUMN "buyerConfirmedAt" TIMESTAMP(3),
ADD COLUMN "agentConfirmedAt" TIMESTAMP(3),
ADD COLUMN "disputedAt" TIMESTAMP(3),
ADD COLUMN "disputedById" TEXT,
ADD COLUMN "disputeReason" TEXT,
ADD COLUMN "adminReviewedAt" TIMESTAMP(3),
ADD COLUMN "adminReviewedById" TEXT,
ADD COLUMN "adminReviewDecision" TEXT,
ADD COLUMN "adminReviewNotes" TEXT,
ADD COLUMN "adminReviewDeadline" TIMESTAMP(3);
