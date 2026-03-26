-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('human', 'ai', 'admin');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('active', 'banned', 'deleted');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('text', 'system', 'ai_reply', 'welcome');

-- CreateEnum
CREATE TYPE "AuditResult" AS ENUM ('pass', 'warn', 'block');

-- CreateEnum
CREATE TYPE "LiveSessionStatus" AS ENUM ('live', 'ended', 'interrupted');

-- CreateEnum
CREATE TYPE "ViolationType" AS ENUM ('spam', 'harassment', 'sensitive', 'other');

-- CreateEnum
CREATE TYPE "ViolationSeverity" AS ENUM ('low', 'medium', 'high');

-- CreateEnum
CREATE TYPE "ViolationStatus" AS ENUM ('pending', 'resolved', 'ignored');

-- CreateEnum
CREATE TYPE "SensitiveLevel" AS ENUM ('warn', 'block');

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "accountType" "AccountType" NOT NULL DEFAULT 'human',
    "username" TEXT NOT NULL,
    "email" TEXT,
    "passwordHash" TEXT,
    "status" "AccountStatus" NOT NULL DEFAULT 'active',
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HumanProfile" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "avatar" TEXT,
    "bio" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HumanProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiProfile" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "avatar" TEXT,
    "bio" TEXT,
    "persona" TEXT NOT NULL,
    "style" TEXT,
    "tags" TEXT[],
    "welcomeMsg" TEXT,
    "forbidTopics" TEXT[],
    "customPrompt" TEXT,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminProfile" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "permissions" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Room" (
    "id" TEXT NOT NULL,
    "aiProfileId" TEXT NOT NULL,
    "title" TEXT,
    "category" TEXT,
    "coverImage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiveSession" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "aiProfileId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "status" "LiveSessionStatus" NOT NULL DEFAULT 'live',
    "peakViewers" INTEGER NOT NULL DEFAULT 0,
    "totalMessages" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LiveSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoomParticipant" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoomParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "liveSessionId" TEXT,
    "senderAccountId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" "MessageType" NOT NULL DEFAULT 'text',
    "metadata" JSONB,
    "isAudited" BOOLEAN NOT NULL DEFAULT true,
    "auditResult" "AuditResult",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Follow" (
    "id" TEXT NOT NULL,
    "followerAccountId" TEXT NOT NULL,
    "followingAccountId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Follow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WatchHistory" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "liveSessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WatchHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SensitiveWord" (
    "id" TEXT NOT NULL,
    "word" TEXT NOT NULL,
    "level" "SensitiveLevel" NOT NULL DEFAULT 'warn',
    "replacement" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SensitiveWord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModerationLog" (
    "id" TEXT NOT NULL,
    "targetAccountId" TEXT,
    "targetMessageId" TEXT,
    "action" TEXT NOT NULL,
    "reason" TEXT,
    "operatorType" TEXT NOT NULL,
    "operatorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModerationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserViolation" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "violationType" "ViolationType" NOT NULL,
    "severity" "ViolationSeverity" NOT NULL DEFAULT 'low',
    "messageId" TEXT,
    "description" TEXT,
    "status" "ViolationStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "UserViolation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_username_key" ON "Account"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Account_email_key" ON "Account"("email");

-- CreateIndex
CREATE INDEX "Account_accountType_idx" ON "Account"("accountType");

-- CreateIndex
CREATE INDEX "Account_status_idx" ON "Account"("status");

-- CreateIndex
CREATE INDEX "Account_username_idx" ON "Account"("username");

-- CreateIndex
CREATE UNIQUE INDEX "HumanProfile_accountId_key" ON "HumanProfile"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "AiProfile_accountId_key" ON "AiProfile"("accountId");

-- CreateIndex
CREATE INDEX "AiProfile_isOnline_idx" ON "AiProfile"("isOnline");

-- CreateIndex
CREATE UNIQUE INDEX "AdminProfile_accountId_key" ON "AdminProfile"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "Room_aiProfileId_key" ON "Room"("aiProfileId");

-- CreateIndex
CREATE INDEX "Room_category_idx" ON "Room"("category");

-- CreateIndex
CREATE INDEX "LiveSession_roomId_idx" ON "LiveSession"("roomId");

-- CreateIndex
CREATE INDEX "LiveSession_aiProfileId_idx" ON "LiveSession"("aiProfileId");

-- CreateIndex
CREATE INDEX "LiveSession_status_idx" ON "LiveSession"("status");

-- CreateIndex
CREATE INDEX "LiveSession_startedAt_idx" ON "LiveSession"("startedAt");

-- CreateIndex
CREATE INDEX "RoomParticipant_roomId_idx" ON "RoomParticipant"("roomId");

-- CreateIndex
CREATE INDEX "RoomParticipant_accountId_idx" ON "RoomParticipant"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "RoomParticipant_roomId_accountId_key" ON "RoomParticipant"("roomId", "accountId");

-- CreateIndex
CREATE INDEX "Message_roomId_idx" ON "Message"("roomId");

-- CreateIndex
CREATE INDEX "Message_liveSessionId_idx" ON "Message"("liveSessionId");

-- CreateIndex
CREATE INDEX "Message_senderAccountId_idx" ON "Message"("senderAccountId");

-- CreateIndex
CREATE INDEX "Message_createdAt_idx" ON "Message"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "Message_type_idx" ON "Message"("type");

-- CreateIndex
CREATE INDEX "Follow_followerAccountId_idx" ON "Follow"("followerAccountId");

-- CreateIndex
CREATE INDEX "Follow_followingAccountId_idx" ON "Follow"("followingAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Follow_followerAccountId_followingAccountId_key" ON "Follow"("followerAccountId", "followingAccountId");

-- CreateIndex
CREATE INDEX "WatchHistory_accountId_idx" ON "WatchHistory"("accountId");

-- CreateIndex
CREATE INDEX "WatchHistory_roomId_idx" ON "WatchHistory"("roomId");

-- CreateIndex
CREATE INDEX "WatchHistory_createdAt_idx" ON "WatchHistory"("createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "SensitiveWord_word_key" ON "SensitiveWord"("word");

-- CreateIndex
CREATE INDEX "SensitiveWord_level_idx" ON "SensitiveWord"("level");

-- CreateIndex
CREATE INDEX "ModerationLog_targetAccountId_idx" ON "ModerationLog"("targetAccountId");

-- CreateIndex
CREATE INDEX "ModerationLog_targetMessageId_idx" ON "ModerationLog"("targetMessageId");

-- CreateIndex
CREATE INDEX "ModerationLog_createdAt_idx" ON "ModerationLog"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "UserViolation_accountId_idx" ON "UserViolation"("accountId");

-- CreateIndex
CREATE INDEX "UserViolation_violationType_idx" ON "UserViolation"("violationType");

-- CreateIndex
CREATE INDEX "UserViolation_status_idx" ON "UserViolation"("status");

-- CreateIndex
CREATE INDEX "UserViolation_createdAt_idx" ON "UserViolation"("createdAt" DESC);

-- AddForeignKey
ALTER TABLE "HumanProfile" ADD CONSTRAINT "HumanProfile_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiProfile" ADD CONSTRAINT "AiProfile_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminProfile" ADD CONSTRAINT "AdminProfile_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_aiProfileId_fkey" FOREIGN KEY ("aiProfileId") REFERENCES "AiProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiveSession" ADD CONSTRAINT "LiveSession_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiveSession" ADD CONSTRAINT "LiveSession_aiProfileId_fkey" FOREIGN KEY ("aiProfileId") REFERENCES "AiProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomParticipant" ADD CONSTRAINT "RoomParticipant_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomParticipant" ADD CONSTRAINT "RoomParticipant_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_liveSessionId_fkey" FOREIGN KEY ("liveSessionId") REFERENCES "LiveSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderAccountId_fkey" FOREIGN KEY ("senderAccountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_followerAccountId_fkey" FOREIGN KEY ("followerAccountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_followingAccountId_fkey" FOREIGN KEY ("followingAccountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WatchHistory" ADD CONSTRAINT "WatchHistory_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WatchHistory" ADD CONSTRAINT "WatchHistory_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WatchHistory" ADD CONSTRAINT "WatchHistory_liveSessionId_fkey" FOREIGN KEY ("liveSessionId") REFERENCES "LiveSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SensitiveWord" ADD CONSTRAINT "SensitiveWord_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationLog" ADD CONSTRAINT "ModerationLog_targetAccountId_fkey" FOREIGN KEY ("targetAccountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationLog" ADD CONSTRAINT "ModerationLog_targetMessageId_fkey" FOREIGN KEY ("targetMessageId") REFERENCES "Message"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationLog" ADD CONSTRAINT "ModerationLog_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserViolation" ADD CONSTRAINT "UserViolation_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserViolation" ADD CONSTRAINT "UserViolation_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE SET NULL ON UPDATE CASCADE;
