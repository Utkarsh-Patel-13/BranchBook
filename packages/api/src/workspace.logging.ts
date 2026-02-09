import type { WorkspaceId } from "@nexus/types";
import type { FastifyBaseLogger } from "fastify";

interface WorkspaceLogContext {
	workspaceId: WorkspaceId;
	userId: string;
}

export const logWorkspaceCreated = (
	logger: FastifyBaseLogger,
	context: WorkspaceLogContext
): void => {
	logger.info(
		{
			event: "workspace.create",
			workspaceId: context.workspaceId,
			userId: context.userId,
		},
		"Workspace created."
	);
};

export const logWorkspaceUpdated = (
	logger: FastifyBaseLogger,
	context: WorkspaceLogContext
): void => {
	logger.info(
		{
			event: "workspace.update",
			workspaceId: context.workspaceId,
			userId: context.userId,
		},
		"Workspace updated."
	);
};

export const logWorkspaceDeleted = (
	logger: FastifyBaseLogger,
	context: WorkspaceLogContext
): void => {
	logger.info(
		{
			event: "workspace.delete",
			workspaceId: context.workspaceId,
			userId: context.userId,
		},
		"Workspace soft-deleted."
	);
};

export const logWorkspaceRestored = (
	logger: FastifyBaseLogger,
	context: WorkspaceLogContext
): void => {
	logger.info(
		{
			event: "workspace.restore",
			workspaceId: context.workspaceId,
			userId: context.userId,
		},
		"Workspace restored."
	);
};
