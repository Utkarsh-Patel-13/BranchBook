-- CreateEnum
CREATE TYPE "ContextQualitySignal" AS ENUM ('FRESH', 'PARTIAL', 'STALE', 'MINIMAL');

-- AlterTable: add inheritedContextQuality to node
ALTER TABLE "node" ADD COLUMN "inheritedContextQuality" "ContextQualitySignal" NOT NULL DEFAULT 'MINIMAL';

-- AlterTable: drop old columns that were removed from the schema
ALTER TABLE "node" DROP COLUMN IF EXISTS "detailedSummary";
ALTER TABLE "node" DROP COLUMN IF EXISTS "highLevelSummary";

-- CreateTable: context_artifact
CREATE TABLE "context_artifact" (
    "id" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "shortTitle" VARCHAR(150) NOT NULL,
    "narrativeSummary" TEXT NOT NULL,
    "keyTopics" TEXT[],
    "keyDecisions" TEXT[],
    "promptReadyString" TEXT NOT NULL,
    "highLevelSummary" TEXT NOT NULL,
    "qualitySignal" "ContextQualitySignal" NOT NULL DEFAULT 'MINIMAL',
    "artifactVersion" INTEGER NOT NULL DEFAULT 1,
    "lastProcessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "context_artifact_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "context_artifact_nodeId_key" ON "context_artifact"("nodeId");

-- CreateIndex
CREATE INDEX "context_artifact_nodeId_idx" ON "context_artifact"("nodeId");

-- AddForeignKey
ALTER TABLE "context_artifact" ADD CONSTRAINT "context_artifact_nodeId_fkey"
    FOREIGN KEY ("nodeId") REFERENCES "node"("id") ON DELETE CASCADE ON UPDATE CASCADE;
