-- CreateIndex
CREATE INDEX "node_workspaceId_deletedAt_idx" ON "node"("workspaceId", "deletedAt");

-- CreateIndex
CREATE INDEX "workspace_ownerId_deletedAt_idx" ON "workspace"("ownerId", "deletedAt");
