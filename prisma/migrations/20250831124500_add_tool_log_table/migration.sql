CREATE TABLE "ToolLog" (
    "id" TEXT NOT NULL,
    "tool" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "lieu" TEXT,
    "client" TEXT,
    "etat" TEXT,
    "transporteur" TEXT,
    "tracking" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    CONSTRAINT "ToolLog_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ToolLog"
  ADD CONSTRAINT "ToolLog_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
