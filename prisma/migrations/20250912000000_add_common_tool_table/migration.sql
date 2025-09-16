-- CreateTable
CREATE TABLE "CommonTool" (
  "hash" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "contact" TEXT NOT NULL DEFAULT '',
  "weight" TEXT NOT NULL DEFAULT '',
  "date" TEXT NOT NULL DEFAULT '',
  "lastUser" TEXT NOT NULL DEFAULT '',
  "dimensions" TEXT NOT NULL DEFAULT '',
  "lastScanAt" TEXT,
  "lastScanBy" TEXT NOT NULL DEFAULT '',
  "updatedAt" TEXT,
  "updatedBy" TEXT NOT NULL DEFAULT '',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CommonTool_pkey" PRIMARY KEY ("hash")
);
