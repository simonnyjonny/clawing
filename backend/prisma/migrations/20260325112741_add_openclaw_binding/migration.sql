-- CreateEnum
CREATE TYPE "HumanRole" AS ENUM ('viewer', 'operator');

-- CreateEnum
CREATE TYPE "OperatorStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "BindingStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "VerificationMethod" AS ENUM ('manual', 'token');

-- CreateEnum
CREATE TYPE "OpenClawAuthType" AS ENUM ('none', 'token', 'apiKey');

-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "humanRole" "HumanRole" DEFAULT 'viewer';

-- CreateTable
CREATE TABLE "Operator" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" "OperatorStatus" NOT NULL DEFAULT 'pending',
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Operator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpenClawBinding" (
    "id" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "aiProfileId" TEXT NOT NULL,
    "openclawId" TEXT NOT NULL,
    "openclawName" TEXT NOT NULL,
    "openclawEndpoint" TEXT,
    "authType" "OpenClawAuthType" NOT NULL DEFAULT 'none',
    "authTokenHash" TEXT,
    "webhookSecret" TEXT,
    "verificationMethod" "VerificationMethod" NOT NULL DEFAULT 'manual',
    "status" "BindingStatus" NOT NULL DEFAULT 'pending',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OpenClawBinding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BroadcastQualification" (
    "id" TEXT NOT NULL,
    "bindingId" TEXT NOT NULL,
    "isAllowed" BOOLEAN NOT NULL DEFAULT false,
    "allowedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BroadcastQualification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Operator_accountId_key" ON "Operator"("accountId");

-- CreateIndex
CREATE INDEX "Operator_status_idx" ON "Operator"("status");

-- CreateIndex
CREATE UNIQUE INDEX "OpenClawBinding_aiProfileId_key" ON "OpenClawBinding"("aiProfileId");

-- CreateIndex
CREATE INDEX "OpenClawBinding_operatorId_idx" ON "OpenClawBinding"("operatorId");

-- CreateIndex
CREATE INDEX "OpenClawBinding_status_idx" ON "OpenClawBinding"("status");

-- CreateIndex
CREATE INDEX "OpenClawBinding_openclawId_idx" ON "OpenClawBinding"("openclawId");

-- CreateIndex
CREATE UNIQUE INDEX "BroadcastQualification_bindingId_key" ON "BroadcastQualification"("bindingId");

-- AddForeignKey
ALTER TABLE "Operator" ADD CONSTRAINT "Operator_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpenClawBinding" ADD CONSTRAINT "OpenClawBinding_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "Operator"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpenClawBinding" ADD CONSTRAINT "OpenClawBinding_aiProfileId_fkey" FOREIGN KEY ("aiProfileId") REFERENCES "AiProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BroadcastQualification" ADD CONSTRAINT "BroadcastQualification_bindingId_fkey" FOREIGN KEY ("bindingId") REFERENCES "OpenClawBinding"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
