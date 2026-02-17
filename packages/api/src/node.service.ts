import prisma from "@branchbook/db";
import type {
	CreateNodeInput,
	DeleteNodeInput,
	GetNodeByIdInput,
	GetTreeInput,
	ListNodesInput,
	Node,
	NodeListItem,
	NodeTree,
	UpdateNodeInput,
} from "@branchbook/types";
import type { BranchFromMessageInput } from "@branchbook/validators";
import { TRPCError } from "@trpc/server";
import { assembleContextPayload } from "./context-engine.service";

const toNode = (record: {
	id: string;
	workspaceId: string;
	parentId: string | null;
	title: string;
	createdAt: Date;
	updatedAt: Date;
	deletedAt: Date | null;
}): Node => record;

const toNodeListItem = (
	record: {
		id: string;
		workspaceId: string;
		parentId: string | null;
		title: string;
		createdAt: Date;
		updatedAt: Date;
		deletedAt: Date | null;
	},
	childCount: number
): NodeListItem => ({
	...record,
	childCount,
});

// Validate that setting parentId doesn't create a circular reference
export const validateNoCircularRef = async (
	nodeId: string,
	newParentId: string | null
): Promise<void> => {
	if (!newParentId) {
		return;
	}

	// Cannot be parent of itself
	if (nodeId === newParentId) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "A node cannot be its own parent",
		});
	}

	// Walk up the parent chain to ensure new parent is not a descendant
	let currentId: string | null = newParentId;
	const visited = new Set<string>();

	while (currentId) {
		if (currentId === nodeId) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "Circular reference detected: new parent is a descendant",
			});
		}

		if (visited.has(currentId)) {
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Circular reference detected in existing tree",
			});
		}

		visited.add(currentId);

		const parent: { parentId: string | null } | null =
			await prisma.node.findUnique({
				where: { id: currentId },
				select: { parentId: true },
			});

		currentId = parent?.parentId ?? null;
	}
};

export const createNode = async (
	userId: string,
	input: CreateNodeInput
): Promise<Node> => {
	// Verify workspace ownership
	const workspace = await prisma.workspace.findFirst({
		where: {
			id: input.workspaceId,
			ownerId: userId,
			deletedAt: null,
		},
	});

	if (!workspace) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Workspace not found or access denied",
		});
	}

	let inheritedContext: string | null = null;
	let branchPointMessageId: string | null = null;

	if (input.parentId) {
		const parent = await prisma.node.findFirst({
			where: {
				id: input.parentId,
				workspaceId: input.workspaceId,
				deletedAt: null,
			},
		});

		if (!parent) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Parent node not found in this workspace",
			});
		}

		// Branch from parent: same context logic as branch-from-message, with branch point = parent (latest message)
		inheritedContext = await assembleContextPayload(input.parentId, null);
		const latestMessage = await prisma.message.findFirst({
			where: { nodeId: input.parentId },
			orderBy: { createdAt: "desc" },
			select: { id: true },
		});
		branchPointMessageId = latestMessage?.id ?? null;
	}

	const node = await prisma.node.create({
		data: {
			workspaceId: input.workspaceId,
			parentId: input.parentId ?? null,
			title: input.title,
			...(inheritedContext !== null && { inheritedContext }),
			...(branchPointMessageId !== null && { branchPointMessageId }),
		},
	});

	return toNode(node);
};

export const listNodes = async (
	userId: string,
	input: ListNodesInput
): Promise<NodeListItem[]> => {
	// Verify workspace ownership
	const workspace = await prisma.workspace.findFirst({
		where: {
			id: input.workspaceId,
			ownerId: userId,
			deletedAt: null,
		},
	});

	if (!workspace) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Workspace not found or access denied",
		});
	}

	const nodes = await prisma.node.findMany({
		where: {
			workspaceId: input.workspaceId,
			deletedAt: null,
		},
		orderBy: {
			createdAt: "asc",
		},
	});

	// Get child counts for each node
	const nodesWithCounts = await Promise.all(
		nodes.map(async (node) => {
			const childCount = await prisma.node.count({
				where: {
					parentId: node.id,
					deletedAt: null,
				},
			});
			return toNodeListItem(node, childCount);
		})
	);

	return nodesWithCounts;
};

export const getNodeById = async (
	userId: string,
	input: GetNodeByIdInput
): Promise<
	| (Node & {
			breadcrumb: Node[];
			children: Node[];
	  })
	| null
> => {
	const node = await prisma.node.findUnique({
		where: {
			id: input.nodeId,
		},
	});

	if (!node || node.deletedAt) {
		return null;
	}

	// Verify workspace ownership
	const workspace = await prisma.workspace.findFirst({
		where: {
			id: node.workspaceId,
			ownerId: userId,
			deletedAt: null,
		},
	});

	if (!workspace) {
		return null;
	}

	// Build breadcrumb trail
	const breadcrumb: Node[] = [toNode(node)];
	let currentParentId = node.parentId;

	while (currentParentId) {
		const parent = await prisma.node.findUnique({
			where: { id: currentParentId },
		});

		if (!parent || parent.deletedAt) {
			break;
		}

		breadcrumb.unshift(toNode(parent));
		currentParentId = parent.parentId;
	}

	// Get direct children (ordered by creation)
	const children = await prisma.node.findMany({
		where: {
			parentId: node.id,
			deletedAt: null,
		},
		orderBy: {
			createdAt: "asc",
		},
	});

	return {
		...toNode(node),
		breadcrumb,
		children: children.map(toNode),
	};
};

export const updateNode = async (
	userId: string,
	input: UpdateNodeInput
): Promise<Node | null> => {
	const existing = await prisma.node.findUnique({
		where: { id: input.nodeId },
	});

	if (!existing || existing.deletedAt) {
		return null;
	}

	// Verify workspace ownership
	const workspace = await prisma.workspace.findFirst({
		where: {
			id: existing.workspaceId,
			ownerId: userId,
			deletedAt: null,
		},
	});

	if (!workspace) {
		return null;
	}

	const node = await prisma.node.update({
		where: { id: input.nodeId },
		data: {
			title: input.title ?? existing.title,
		},
	});

	return toNode(node);
};

export const deleteNodeCascade = async (
	userId: string,
	input: DeleteNodeInput
): Promise<{ deletedCount: number } | null> => {
	const node = await prisma.node.findUnique({
		where: { id: input.nodeId },
	});

	if (!node || node.deletedAt) {
		return null;
	}

	// Verify workspace ownership
	const workspace = await prisma.workspace.findFirst({
		where: {
			id: node.workspaceId,
			ownerId: userId,
			deletedAt: null,
		},
	});

	if (!workspace) {
		return null;
	}

	// Get all descendants recursively
	const getDescendants = async (parentId: string): Promise<string[]> => {
		const children = await prisma.node.findMany({
			where: {
				parentId,
				deletedAt: null,
			},
			select: { id: true },
		});

		const childIds = children.map((c) => c.id);
		const descendants = [...childIds];

		for (const childId of childIds) {
			const subDescendants = await getDescendants(childId);
			descendants.push(...subDescendants);
		}

		return descendants;
	};

	const descendantIds = await getDescendants(input.nodeId);
	const allNodeIds = [input.nodeId, ...descendantIds];

	// Soft delete all nodes
	await prisma.node.updateMany({
		where: {
			id: { in: allNodeIds },
		},
		data: {
			deletedAt: new Date(),
		},
	});

	return { deletedCount: allNodeIds.length };
};

export const createBranchFromMessage = async (
	userId: string,
	input: BranchFromMessageInput
): Promise<Node> => {
	const parentNode = await prisma.node.findUnique({
		where: { id: input.nodeId },
		include: { workspace: { select: { ownerId: true } } },
	});

	if (!parentNode || parentNode.deletedAt) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Parent node not found",
		});
	}

	if (parentNode.workspace.ownerId !== userId) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "Access denied",
		});
	}

	const message = await prisma.message.findUnique({
		where: { id: input.messageId },
		select: { nodeId: true },
	});

	if (!message || message.nodeId !== input.nodeId) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Message not found in this node",
		});
	}

	const rawTitle = input.title ?? `Branch of ${parentNode.title}`;
	const safeTitle = rawTitle.slice(0, 100);

	const inheritedContext = await assembleContextPayload(
		input.nodeId,
		input.messageId
	);

	const childNode = await prisma.node.create({
		data: {
			workspaceId: parentNode.workspaceId,
			parentId: input.nodeId,
			title: safeTitle,
			inheritedContext,
			branchPointMessageId: input.messageId,
		},
	});

	await prisma.message.update({
		where: { id: input.messageId },
		data: { branchPoint: true },
	});

	return toNode(childNode);
};

export const getBranchesForNode = async (
	userId: string,
	input: GetNodeByIdInput
): Promise<Record<string, { id: string; title: string }[]>> => {
	const node = await prisma.node.findUnique({
		where: { id: input.nodeId },
		include: { workspace: { select: { ownerId: true } } },
	});

	if (!node || node.deletedAt) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Node not found",
		});
	}

	if (node.workspace.ownerId !== userId) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "Access denied",
		});
	}

	const children = await prisma.node.findMany({
		where: {
			parentId: input.nodeId,
			deletedAt: null,
			branchPointMessageId: { not: null },
		},
		select: { id: true, title: true, branchPointMessageId: true },
	});

	const byMessage: Record<string, { id: string; title: string }[]> = {};
	for (const child of children) {
		const mid = child.branchPointMessageId;
		if (!mid) {
			continue;
		}
		if (!byMessage[mid]) {
			byMessage[mid] = [];
		}
		byMessage[mid].push({ id: child.id, title: child.title });
	}
	return byMessage;
};

export const getNodeTree = async (
	userId: string,
	input: GetTreeInput
): Promise<NodeTree[]> => {
	// Verify workspace ownership
	const workspace = await prisma.workspace.findFirst({
		where: {
			id: input.workspaceId,
			ownerId: userId,
			deletedAt: null,
		},
	});

	if (!workspace) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Workspace not found or access denied",
		});
	}

	// Fetch all non-deleted nodes in the workspace
	const allNodes = await prisma.node.findMany({
		where: {
			workspaceId: input.workspaceId,
			deletedAt: null,
		},
		orderBy: {
			createdAt: "asc",
		},
	});

	// Build tree structure
	const nodeMap = new Map<string, NodeTree>();
	const rootNodes: NodeTree[] = [];

	// Initialize all nodes in the map
	for (const node of allNodes) {
		nodeMap.set(node.id, {
			...toNode(node),
			children: [],
		});
	}

	// Build parent-child relationships
	for (const node of allNodes) {
		const treeNode = nodeMap.get(node.id);
		if (!treeNode) {
			continue;
		}

		if (node.parentId) {
			const parent = nodeMap.get(node.parentId);
			if (parent) {
				parent.children.push(treeNode);
			}
		} else {
			rootNodes.push(treeNode);
		}
	}

	return rootNodes;
};
