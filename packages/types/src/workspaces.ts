export type WorkspaceId = string;

export type WorkspaceSortBy = "lastUpdated" | "createdAt" | "name";

export type WorkspaceSortDirection = "asc" | "desc";

export interface Workspace {
	id: WorkspaceId;
	ownerId: string;
	name: string;
	description: string | null;
	createdAt: Date;
	updatedAt: Date;
	deletedAt: Date | null;
}

export interface WorkspaceListItem {
	id: WorkspaceId;
	name: string;
	description: string | null;
	createdAt: Date;
	updatedAt: Date;
}

export interface WorkspaceCreateInput {
	name: string;
	description?: string | null;
}

export interface WorkspaceListInput {
	sortBy?: WorkspaceSortBy;
	sortDirection?: WorkspaceSortDirection;
}

export interface WorkspaceGetByIdInput {
	workspaceId: WorkspaceId;
}

export interface WorkspaceUpdateInput {
	workspaceId: WorkspaceId;
	name?: string;
	description?: string | null;
}

export interface WorkspaceDeleteInput {
	workspaceId: WorkspaceId;
}

export interface WorkspaceRestoreInput {
	workspaceId: WorkspaceId;
}
