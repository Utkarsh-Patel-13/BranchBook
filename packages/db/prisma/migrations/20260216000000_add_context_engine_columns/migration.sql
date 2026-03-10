-- AlterTable: Add Context Engine columns to node
ALTER TABLE "node" ADD COLUMN "branchPointMessageId" TEXT;
ALTER TABLE "node" ADD COLUMN "detailedSummary" TEXT;
ALTER TABLE "node" ADD COLUMN "highLevelSummary" TEXT;
ALTER TABLE "node" ADD COLUMN "inheritedContext" TEXT;
ALTER TABLE "node" ADD COLUMN "summaryDraft" TEXT;
ALTER TABLE "node" ADD COLUMN "summaryDraftCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable: Add Context Engine columns to message
ALTER TABLE "message" ADD COLUMN "branchPoint" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "message" ADD COLUMN "perMessageSummary" TEXT;
