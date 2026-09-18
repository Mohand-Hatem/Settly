-- BUSINESS_RULES §3 V7: record who cancelled a viewing (buyer, agent or system).
ALTER TABLE "Viewing" ADD COLUMN IF NOT EXISTS "cancelledBy" "ActorType";
