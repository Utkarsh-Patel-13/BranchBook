import prisma from "@nexus/db";
import type {
	Workspace,
	WorkspaceCreateInput,
	WorkspaceDeleteInput,
	WorkspaceGetByIdInput,
	WorkspaceListInput,
	WorkspaceListItem,
	WorkspaceListOutput,
	WorkspaceRestoreInput,
	WorkspaceUpdateInput,
} from "@nexus/types";
import type { FastifyBaseLogger } from "fastify";
import {
	logWorkspaceCreated,
	logWorkspaceDeleted,
	logWorkspaceRestored,
	logWorkspaceUpdated,
} from "./workspace.logging";

const RECOVERY_WINDOW_DAYS = 30;
const RECOVERY_WINDOW_MS = RECOVERY_WINDOW_DAYS * 24 * 60 * 60 * 1000;

const CACHE_TTL_MS = 30_000;
const workspaceListCache = new Map<
	string,
	{ data: WorkspaceListItem[]; expiresAt: number }
>();

const toWorkspace = (record: {
	id: string;
	ownerId: string;
	name: string;
	description: string | null;
	createdAt: Date;
	updatedAt: Date;
	deletedAt: Date | null;
}): Workspace => record;

const toWorkspaceListItem = (record: {
	id: string;
	name: string;
	description: string | null;
	createdAt: Date;
	updatedAt: Date;
}): WorkspaceListItem => record;

export const createWorkspace = async (
	ownerId: string,
	input: WorkspaceCreateInput,
	logger?: FastifyBaseLogger
): Promise<Workspace> => {
	workspaceListCache.delete(ownerId);
	const workspace = await prisma.workspace.create({
		data: {
			ownerId,
			name: input.name,
			description: input.description ?? null,
		},
	});

	if (logger) {
		logWorkspaceCreated(logger, {
			workspaceId: workspace.id,
			userId: ownerId,
		});
	}

	return toWorkspace(workspace);
};

export const listWorkspaces = async (
	ownerId: string,
	input: WorkspaceListInput
): Promise<WorkspaceListOutput> => {
	const limit = input.limit ?? 50;
	const sortBy = input.sortBy ?? "lastUpdated";
	const sortDirection = input.sortDirection ?? "desc";

	if (!input.cursor) {
		const cached = workspaceListCache.get(ownerId);
		if (cached && Date.now() < cached.expiresAt) {
			return { items: cached.data, nextCursor: null };
		}
	}

	type OrderByOption =
		| { name: typeof sortDirection }
		| { createdAt: typeof sortDirection }
		| { updatedAt: typeof sortDirection };
	let orderBy: OrderByOption;
	if (sortBy === "name") {
		orderBy = { name: sortDirection };
	} else if (sortBy === "createdAt") {
		orderBy = { createdAt: sortDirection };
	} else {
		orderBy = { updatedAt: sortDirection };
	}

	const workspaces = await prisma.workspace.findMany({
		where: {
			ownerId,
			deletedAt: null,
		},
		orderBy,
		take: limit,
		...(input.cursor ? { skip: 1, cursor: { id: input.cursor } } : {}),
		select: {
			id: true,
			name: true,
			description: true,
			createdAt: true,
			updatedAt: true,
		},
	});

	const items = workspaces.map(toWorkspaceListItem);
	const nextCursor = items.length === limit ? (items.at(-1)?.id ?? null) : null;

	if (!input.cursor) {
		workspaceListCache.set(ownerId, {
			data: items,
			expiresAt: Date.now() + CACHE_TTL_MS,
		});
	}

	return { items, nextCursor };
};

export const listDeletedWorkspaces = async (
	ownerId: string,
	input: WorkspaceListInput
): Promise<{
	items: (WorkspaceListItem & { deletedAt: Date })[];
	nextCursor: string | null;
}> => {
	const limit = input.limit ?? 50;
	const sortBy = input.sortBy ?? "lastUpdated";
	const sortDirection = input.sortDirection ?? "desc";

	type OrderByOption =
		| { name: typeof sortDirection }
		| { createdAt: typeof sortDirection }
		| { deletedAt: typeof sortDirection };
	let orderBy: OrderByOption;
	if (sortBy === "name") {
		orderBy = { name: sortDirection };
	} else if (sortBy === "createdAt") {
		orderBy = { createdAt: sortDirection };
	} else {
		orderBy = { deletedAt: sortDirection };
	}

	const now = Date.now();
	const cutoffDate = new Date(now - RECOVERY_WINDOW_MS);

	const workspaces = await prisma.workspace.findMany({
		where: {
			ownerId,
			deletedAt: {
				not: null,
				gte: cutoffDate,
			},
		},
		orderBy,
		take: limit,
		...(input.cursor ? { skip: 1, cursor: { id: input.cursor } } : {}),
		select: {
			id: true,
			name: true,
			description: true,
			createdAt: true,
			updatedAt: true,
			deletedAt: true,
		},
	});

	const items = workspaces.map((w) => {
		if (w.deletedAt == null) {
			throw new Error(
				"Invariant failed: deleted workspace is missing deletedAt."
			);
		}

		return {
			...toWorkspaceListItem(w),
			deletedAt: w.deletedAt,
		};
	});

	const nextCursor = items.length === limit ? (items.at(-1)?.id ?? null) : null;

	return { items, nextCursor };
};

export const getWorkspaceById = async (
	ownerId: string,
	input: WorkspaceGetByIdInput
): Promise<Workspace | null> => {
	const workspace = await prisma.workspace.findFirst({
		where: {
			id: input.workspaceId,
			ownerId,
			deletedAt: null,
		},
	});

	if (!workspace) {
		return null;
	}

	return toWorkspace(workspace);
};

export const updateWorkspace = async (
	ownerId: string,
	input: WorkspaceUpdateInput,
	logger?: FastifyBaseLogger
): Promise<Workspace | null> => {
	workspaceListCache.delete(ownerId);
	try {
		const workspace = await prisma.workspace.update({
			where: {
				id: input.workspaceId,
				ownerId,
				deletedAt: null,
			},
			data: {
				...(input.name !== undefined && { name: input.name }),
				...(input.description !== undefined && {
					description: input.description,
				}),
			},
		});

		if (logger) {
			logWorkspaceUpdated(logger, {
				workspaceId: workspace.id,
				userId: ownerId,
			});
		}

		return toWorkspace(workspace);
	} catch (error) {
		if (
			typeof error === "object" &&
			error !== null &&
			"code" in error &&
			(error as { code: unknown }).code === "P2025"
		) {
			logger?.warn(
				{
					event: "workspace.update.not_found",
					workspaceId: input.workspaceId,
					userId: ownerId,
				},
				"Workspace not found for update"
			);
			return null;
		}
		throw error;
	}
};

export const deleteWorkspace = async (
	ownerId: string,
	input: WorkspaceDeleteInput,
	logger?: FastifyBaseLogger
): Promise<Workspace | null> => {
	workspaceListCache.delete(ownerId);
	const deletedAt = new Date();

	// Soft delete workspace and all its nodes in a single atomic transaction
	const workspace = await prisma.$transaction(async (tx) => {
		const found = await tx.workspace.findFirst({
			where: { id: input.workspaceId, ownerId, deletedAt: null },
			select: { id: true },
		});

		if (!found) {
			return null;
		}

		const updatedWorkspace = await tx.workspace.update({
			where: { id: input.workspaceId },
			data: { deletedAt },
		});
		await tx.node.updateMany({
			where: { workspaceId: input.workspaceId, deletedAt: null },
			data: { deletedAt },
		});
		return updatedWorkspace;
	});

	if (!workspace) {
		logger?.warn(
			{
				event: "workspace.delete.not_found",
				workspaceId: input.workspaceId,
				userId: ownerId,
			},
			"Workspace not found for delete"
		);
		return null;
	}

	if (logger) {
		logWorkspaceDeleted(logger, {
			workspaceId: workspace.id,
			userId: ownerId,
		});
	}

	return toWorkspace(workspace);
};

export const restoreWorkspace = async (
	ownerId: string,
	input: WorkspaceRestoreInput,
	logger?: FastifyBaseLogger
): Promise<Workspace | null> => {
	workspaceListCache.delete(ownerId);

	// Restore workspace and all its nodes in a single atomic transaction
	const workspace = await prisma.$transaction(async (tx) => {
		const found = await tx.workspace.findFirst({
			where: { id: input.workspaceId, ownerId },
			select: { id: true, deletedAt: true },
		});

		if (!found?.deletedAt) {
			return null;
		}

		const now = Date.now();
		if (now - found.deletedAt.getTime() > RECOVERY_WINDOW_MS) {
			return null;
		}

		const updatedWorkspace = await tx.workspace.update({
			where: { id: input.workspaceId },
			data: { deletedAt: null },
		});
		await tx.node.updateMany({
			where: { workspaceId: input.workspaceId, deletedAt: found.deletedAt },
			data: { deletedAt: null },
		});
		return updatedWorkspace;
	});

	if (!workspace) {
		logger?.warn(
			{
				event: "workspace.restore.not_found",
				workspaceId: input.workspaceId,
				userId: ownerId,
			},
			"Workspace not found for restore"
		);
		return null;
	}

	if (logger) {
		logWorkspaceRestored(logger, {
			workspaceId: workspace.id,
			userId: ownerId,
		});
	}

	return toWorkspace(workspace);
};
