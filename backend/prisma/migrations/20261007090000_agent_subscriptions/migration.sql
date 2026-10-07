-- ==============================================================================
-- Agent Subscription Engine & Listing Quota Waiting (Decisions #89, #103, #104, #105, #94)
-- ==============================================================================

-- 1. Create Enums safely
DO $$ BEGIN
    CREATE TYPE "SubscriptionPlan" AS ENUM ('PRO', 'ENTERPRISE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "SubscriptionPeriodKind" AS ENUM ('NEW', 'RENEWAL', 'UPGRADE', 'DOWNGRADE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "SubscriptionPeriodStatus" AS ENUM ('SCHEDULED', 'ACTIVE', 'ENDED', 'SUPERSEDED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "SubscriptionPaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCEEDED', 'EXPIRED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Alter Property to add approvedWaitingForQuotaAt
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "approvedWaitingForQuotaAt" TIMESTAMP(3);

-- 3. Create AgentSubscription table
CREATE TABLE IF NOT EXISTS "AgentSubscription" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentSubscription_pkey" PRIMARY KEY ("id")
);

-- 4. Create SubscriptionPayment table
CREATE TABLE IF NOT EXISTS "SubscriptionPayment" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "plan" "SubscriptionPlan" NOT NULL,
    "kind" "SubscriptionPeriodKind" NOT NULL,
    "baseAmountMinor" BIGINT NOT NULL,
    "baseCurrency" TEXT NOT NULL DEFAULT 'USD',
    "fxRate" DECIMAL(10,4) NOT NULL,
    "chargedAmountMinor" BIGINT NOT NULL,
    "chargedCurrency" TEXT NOT NULL DEFAULT 'EGP',
    "feeAmountMinor" BIGINT NOT NULL DEFAULT 0,
    "netAmountMinor" BIGINT NOT NULL DEFAULT 0,
    "status" "SubscriptionPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "receiptNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionPayment_pkey" PRIMARY KEY ("id")
);

-- 5. Create SubscriptionPeriod table
CREATE TABLE IF NOT EXISTS "SubscriptionPeriod" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "plan" "SubscriptionPlan" NOT NULL,
    "kind" "SubscriptionPeriodKind" NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "endedEarlyAt" TIMESTAMP(3),
    "status" "SubscriptionPeriodStatus" NOT NULL DEFAULT 'ACTIVE',
    "paymentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionPeriod_pkey" PRIMARY KEY ("id")
);

-- 6. Create SubscriptionPaymentAttempt table
CREATE TABLE IF NOT EXISTS "SubscriptionPaymentAttempt" (
    "id" TEXT NOT NULL,
    "subscriptionPaymentId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'PAYMOB',
    "providerTransactionId" TEXT,
    "status" "AttemptStatus" NOT NULL DEFAULT 'INITIATED',
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubscriptionPaymentAttempt_pkey" PRIMARY KEY ("id")
);

-- 7. Constraints & Indexes
CREATE UNIQUE INDEX IF NOT EXISTS "AgentSubscription_agentId_key" ON "AgentSubscription"("agentId");
CREATE UNIQUE INDEX IF NOT EXISTS "SubscriptionPeriod_paymentId_key" ON "SubscriptionPeriod"("paymentId");
CREATE UNIQUE INDEX IF NOT EXISTS "SubscriptionPayment_receiptNumber_key" ON "SubscriptionPayment"("receiptNumber");

CREATE INDEX IF NOT EXISTS "SubscriptionPeriod_subscriptionId_status_idx" ON "SubscriptionPeriod"("subscriptionId", "status");
CREATE INDEX IF NOT EXISTS "SubscriptionPeriod_startsAt_endsAt_idx" ON "SubscriptionPeriod"("startsAt", "endsAt");
CREATE INDEX IF NOT EXISTS "SubscriptionPayment_agentId_status_idx" ON "SubscriptionPayment"("agentId", "status");
CREATE INDEX IF NOT EXISTS "SubscriptionPaymentAttempt_subscriptionPaymentId_idx" ON "SubscriptionPaymentAttempt"("subscriptionPaymentId");
CREATE INDEX IF NOT EXISTS "SubscriptionPaymentAttempt_providerTransactionId_idx" ON "SubscriptionPaymentAttempt"("providerTransactionId");
CREATE INDEX IF NOT EXISTS "Property_agentId_status_approvedWaitingForQuotaAt_idx" ON "Property"("agentId", "status", "approvedWaitingForQuotaAt");

-- Foreign Keys (add safely if not exist)
DO $$ BEGIN
    ALTER TABLE "AgentSubscription" ADD CONSTRAINT "AgentSubscription_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "SubscriptionPeriod" ADD CONSTRAINT "SubscriptionPeriod_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "AgentSubscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "SubscriptionPeriod" ADD CONSTRAINT "SubscriptionPeriod_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "SubscriptionPayment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "SubscriptionPayment" ADD CONSTRAINT "SubscriptionPayment_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "SubscriptionPaymentAttempt" ADD CONSTRAINT "SubscriptionPaymentAttempt_subscriptionPaymentId_fkey" FOREIGN KEY ("subscriptionPaymentId") REFERENCES "SubscriptionPayment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
