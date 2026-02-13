// Node system types for workspace hierarchical node management

export interface Node {
	id: string;
	workspaceId: string;
	parentId: string | null;
	title: string;
	createdAt: Date | string;
	updatedAt: Date | string;
	deletedAt: Date | string | null;
	// Context Engine fields
	detailedSummary?: string | null;
	highLevelSummary?: string | null;
	summaryDraft?: string | null;
	summaryDraftCount?: number;
	inheritedContext?: string | null;
	branchPointMessageId?: string | null;
}

export interface NodeTree {
	id: string;
	workspaceId: string;
	parentId: string | null;
	title: string;
	createdAt: Date | string;
	updatedAt: Date | string;
	deletedAt: Date | string | null;
	children: NodeTree[];
}

export interface NodeListItem extends Node {
	childCount?: number;
}

// Input types for API operations
export interface CreateNodeInput {
	workspaceId: string;
	title: string;
	parentId?: string | null;
}

export interface UpdateNodeInput {
	nodeId: string;
	title?: string;
}

export interface DeleteNodeInput {
	nodeId: string;
}

export interface ListNodesInput {
	workspaceId: string;
}

export interface GetNodeByIdInput {
	nodeId: string;
}

export interface GetTreeInput {
	workspaceId: string;
}

// Canvas/viewport types for client-side state
export interface Viewport {
	x: number;
	y: number;
	zoom: number;
}

export interface CanvasState {
	selectedNodeIds: string[];
	viewport: Viewport;
	collapsedNodeIds: Set<string>;
	interactionMode: "select" | "pan";
}
