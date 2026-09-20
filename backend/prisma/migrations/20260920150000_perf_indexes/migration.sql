-- CreateIndex
CREATE INDEX "Offer_agentId_status_idx" ON "Offer"("agentId", "status");

-- CreateIndex
CREATE INDEX "Offer_propertyId_status_idx" ON "Offer"("propertyId", "status");

-- DropIndex
DROP INDEX IF EXISTS "Offer_propertyId_idx";

-- CreateIndex
CREATE INDEX "Payment_status_deadlineAt_idx" ON "Payment"("status", "deadlineAt");

-- CreateIndex
CREATE INDEX "PaymentAttempt_providerTransactionId_idx" ON "PaymentAttempt"("providerTransactionId");
