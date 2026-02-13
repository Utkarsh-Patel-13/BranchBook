import prisma from "@nexus/db";
import type {
	Workspace,
	WorkspaceCreateInput,
	WorkspaceDeleteInput,
	WorkspaceGetByIdInput,
	WorkspaceListInput,
	WorkspaceListItem,
	WorkspaceRestoreInput,
	WorkspaceUpdateInput,
} from "@nexus/types";
import type { FastifyBaseLogger } from "fastify";

const RECOVERY_WINDOW_DAYS = 30;
const RECOVERY_WINDOW_MS = RECOVERY_WINDOW_DAYS * 24 * 60 * 60 * 1000;

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
	const workspace = await prisma.workspace.create({
		data: {
			ownerId,
			name: input.name,
			description: input.description ?? null,
		},
	});

	if (logger) {
		const { logWorkspaceCreated } = await import("./workspace.logging");
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
): Promise<WorkspaceListItem[]> => {
	const sortBy = input.sortBy ?? "lastUpdated";
	const sortDirection = input.sortDirection ?? "desc";

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
		select: {
			id: true,
			name: true,
			description: true,
			createdAt: true,
			updatedAt: true,
		},
	});

	return workspaces.map(toWorkspaceListItem);
};

export const listDeletedWorkspaces = async (
	ownerId: string,
	input: WorkspaceListInput
): Promise<(WorkspaceListItem & { deletedAt: Date })[]> => {
	const sortBy = input.sortBy ?? "lastUpdated";
	const sortDirection = input.sortDirection ?? "desc";

	type OrderByOption =
		| { name: typeof sortDirection }
		| { createdAt: typeof sortDirection }
		| { updatedAt: typeof sortDirection }
		| { deletedAt: typeof sortDirection };
	let orderBy: OrderByOption;
	if (sortBy === "name") {
		orderBy = { name: sortDirection };
	} else if (sortBy === "createdAt") {
		orderBy = { createdAt: sortDirection };
	} else {
		orderBy = { updatedAt: sortDirection };
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
		select: {
			id: true,
			name: true,
			description: true,
			createdAt: true,
			updatedAt: true,
			deletedAt: true,
		},
	});

	return workspaces.map((w) => ({
		...toWorkspaceListItem(w),
		deletedAt: w.deletedAt as Date,
	}));
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
	const existing = await prisma.workspace.findFirst({
		where: {
			id: input.workspaceId,
			ownerId,
			deletedAt: null,
		},
	});

	if (!existing) {
		return null;
	}

	const updateResult = await prisma.workspace.updateMany({
		where: {
			id: input.workspaceId,
			ownerId,
			deletedAt: null,
		},
		data: {
			name: input.name ?? existing.name,
			description:
				input.description !== undefined
					? input.description
					: existing.description,
		},
	});

	if (updateResult.count !== 1) {
		return null;
	}

	const workspace = {
		...existing,
		name: input.name ?? existing.name,
		description:
			input.description !== undefined
				? input.description
				: existing.description,
	};

	if (logger) {
		const { logWorkspaceUpdated } = await import("./workspace.logging");
		logWorkspaceUpdated(logger, {
			workspaceId: workspace.id,
			userId: ownerId,
		});
	}

	return toWorkspace(workspace);
};

export const deleteWorkspace = async (
	ownerId: string,
	input: WorkspaceDeleteInput,
	logger?: FastifyBaseLogger
): Promise<Workspace | null> => {
	const existing = await prisma.workspace.findFirst({
		where: {
			id: input.workspaceId,
			ownerId,
		},
	});

	if (!existing || existing.deletedAt) {
		return null;
	}

	const deletedAt = new Date();

	// Soft delete workspace and all its nodes in a transaction
	await prisma.$transaction([
		prisma.workspace.update({
			where: {
				id: input.workspaceId,
			},
			data: {
				deletedAt,
			},
		}),
		prisma.node.updateMany({
			where: {
				workspaceId: input.workspaceId,
				deletedAt: null,
			},
			data: {
				deletedAt,
			},
		}),
	]);

	const workspace = await prisma.workspace.findUnique({
		where: {
			id: input.workspaceId,
		},
	});

	if (!workspace) {
		return null;
	}

	if (logger) {
		const { logWorkspaceDeleted } = await import("./workspace.logging");
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
	const existing = await prisma.workspace.findFirst({
		where: {
			id: input.workspaceId,
			ownerId,
		},
	});

	if (!existing?.deletedAt) {
		return null;
	}

	const now = Date.now();
	const deletedAtTime = existing.deletedAt.getTime();

	if (now - deletedAtTime > RECOVERY_WINDOW_MS) {
		return null;
	}

	// Restore workspace and all its nodes in a transaction
	await prisma.$transaction([
		prisma.workspace.update({
			where: {
				id: input.workspaceId,
			},
			data: {
				deletedAt: null,
			},
		}),
		prisma.node.updateMany({
			where: {
				workspaceId: input.workspaceId,
				deletedAt: existing.deletedAt,
			},
			data: {
				deletedAt: null,
			},
		}),
	]);

	const workspace = await prisma.workspace.findUnique({
		where: {
			id: input.workspaceId,
		},
	});

	if (!workspace) {
		return null;
	}

	if (logger) {
		const { logWorkspaceRestored } = await import("./workspace.logging");
		logWorkspaceRestored(logger, {
			workspaceId: workspace.id,
			userId: ownerId,
		});
	}

	return toWorkspace(workspace);
};
