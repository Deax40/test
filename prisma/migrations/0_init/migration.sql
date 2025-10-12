-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'TECH',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Log" (
    "id" TEXT NOT NULL,
    "qrData" TEXT NOT NULL,
    "lieu" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "actorName" TEXT NOT NULL,
    "etat" TEXT NOT NULL DEFAULT 'RAS',
    "probleme" TEXT,
    "photo" BYTEA,
    "photoType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,

    CONSTRAINT "Log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
CREATE TABLE "Tool" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "qrData" TEXT NOT NULL,
    "lastScanAt" TIMESTAMP(3),
    "lastScanUser" TEXT,
    "lastScanLieu" TEXT,
    "lastScanEtat" TEXT,
    "certificatePath" TEXT,
    "fileSize" INTEGER,
    "fileName" TEXT,
    "fileExtension" TEXT,
    "filePath" TEXT,
    "dimensionLength" TEXT,
    "dimensionWidth" TEXT,
    "dimensionHeight" TEXT,
    "dimensionType" TEXT,
    "problemPhotoPath" TEXT,
    "problemPhotoBuffer" BYTEA,
    "problemPhotoType" TEXT,
    "problemDescription" TEXT,
    "complementaryInfo" TEXT,
    "tracking" TEXT,
    "client" TEXT,
    "transporteur" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Certification" (
    "id" TEXT NOT NULL,
    "toolId" TEXT,
    "toolHash" TEXT,
    "toolName" TEXT NOT NULL,
    "toolCategory" TEXT NOT NULL,
    "revisionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pdfPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Certification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MachineRevision" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "revisionDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MachineRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Habilitation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT,
    "filePath" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Habilitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareLog" (
    "id" TEXT NOT NULL,
    "toolId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "field" TEXT,
    "oldValue" TEXT,
    "newValue" TEXT,
    "userId" TEXT,
    "userName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CareLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminFileInfo" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "equipmentType" TEXT,
    "location" TEXT,
    "fileSize" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "format" TEXT,
    "extension" TEXT,
    "hash" TEXT,
    "uuid" TEXT,

    CONSTRAINT "AdminFileInfo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvalidScan" (
    "id" TEXT NOT NULL,
    "qrData" TEXT,
    "imagePath" TEXT,
    "imageType" TEXT,
    "userId" TEXT,
    "userName" TEXT NOT NULL,
    "location" TEXT,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "notes" TEXT,

    CONSTRAINT "InvalidScan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Tool_hash_key" ON "Tool"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "Tool_qrData_key" ON "Tool"("qrData");

-- CreateIndex
CREATE UNIQUE INDEX "MachineRevision_name_key" ON "MachineRevision"("name");

-- CreateIndex
CREATE UNIQUE INDEX "AdminFileInfo_fileName_key" ON "AdminFileInfo"("fileName");

-- AddForeignKey
ALTER TABLE "Log" ADD CONSTRAINT "Log_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ToolLog" ADD CONSTRAINT "ToolLog_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certification" ADD CONSTRAINT "Certification_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "Tool"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Habilitation" ADD CONSTRAINT "Habilitation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareLog" ADD CONSTRAINT "CareLog_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "Tool"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareLog" ADD CONSTRAINT "CareLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

