CREATE TABLE "Certification" (
  "id" TEXT NOT NULL,
  "toolId" TEXT NOT NULL,
  "file" BYTEA NOT NULL,
  "fileType" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Certification_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Certification" ADD CONSTRAINT "Certification_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "Tool"("id") ON DELETE CASCADE ON UPDATE CASCADE;
