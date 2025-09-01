-- Drop file and expiration columns from Certification
ALTER TABLE "Certification" DROP COLUMN IF EXISTS "file";
ALTER TABLE "Certification" DROP COLUMN IF EXISTS "fileType";
ALTER TABLE "Certification" DROP COLUMN IF EXISTS "expiresAt";
