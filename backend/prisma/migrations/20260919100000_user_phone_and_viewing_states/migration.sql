-- Slice 1 (#60, #106): phone collected at sign-up; nullable because Google sign-up supplies none
-- and those accounts complete it at /complete-profile.
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "phone" TEXT;

-- BUSINESS_RULES §3: the viewing state machine has 8 states; DECLINED (V3) and EXPIRED (V10) were missing.
ALTER TYPE "ViewingStatus" ADD VALUE IF NOT EXISTS 'DECLINED';
ALTER TYPE "ViewingStatus" ADD VALUE IF NOT EXISTS 'EXPIRED';
