-- Add state and photo fields to Log table
ALTER TABLE "Log" ADD COLUMN "etat" TEXT NOT NULL DEFAULT 'CORRECT';
ALTER TABLE "Log" ADD COLUMN "photo" BYTEA;
ALTER TABLE "Log" ADD COLUMN "photoType" TEXT;
