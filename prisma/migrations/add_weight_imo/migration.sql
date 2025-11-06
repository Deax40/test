-- Add weight and imoNumber columns to Tool table
ALTER TABLE "Tool" ADD COLUMN IF NOT EXISTS "weight" TEXT;
ALTER TABLE "Tool" ADD COLUMN IF NOT EXISTS "imoNumber" TEXT;
