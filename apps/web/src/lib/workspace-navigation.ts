import type { NodeTree } from "@branchbook/types";

/**
 * Builds the URL path from root to a specific node
 */
export function buildNodePath(
	tree: NodeTree[],
	targetNodeId: string,
	currentPath: string[] = []
): string[] | null {
	for (const node of tree) {
		const newPath = [...currentPath, node.id];

		if (node.id === targetNodeId) {
			return newPath;
		}

		const childPath = buildNodePath(node.children, targetNodeId, newPath);
		if (childPath) {
			return childPath;
		}
	}

	return null;
}

/**
 * Single-pass DFS that returns the full NodeTree objects along the path to the target node
 */
export function buildBreadcrumbPath(
	tree: NodeTree[],
	targetNodeId: string,
	currentPath: NodeTree[] = []
): NodeTree[] | null {
	for (const node of tree) {
		const newPath = [...currentPath, node];

		if (node.id === targetNodeId) {
			return newPath;
		}

		const childPath = buildBreadcrumbPath(node.children, targetNodeId, newPath);
		if (childPath) {
			return childPath;
		}
	}

	return null;
}

/**
 * Finds a node by ID anywhere in the tree
 */
export function findNodeById(
	tree: NodeTree[],
	nodeId: string
): NodeTree | null {
	for (const node of tree) {
		if (node.id === nodeId) {
			return node;
		}

		const found = findNodeById(node.children, nodeId);
		if (found) {
			return found;
		}
	}

	return null;
}
