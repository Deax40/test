CREATE TABLE "MachineRevision" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "revisionDate" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MachineRevision_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MachineRevision_name_key" ON "MachineRevision"("name");
