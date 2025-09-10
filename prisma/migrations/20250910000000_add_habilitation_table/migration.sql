-- CreateTable
CREATE TABLE "Habilitation" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "filePath" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Habilitation_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Habilitation" ADD CONSTRAINT "Habilitation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
