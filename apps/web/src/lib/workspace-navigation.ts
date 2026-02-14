import type { NodeTree } from "@nexus/types";

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
 * Resolves a node from URL path segments
 */
export function getNodeFromPath(
	tree: NodeTree[],
	pathSegments: string[]
): NodeTree | null {
	if (pathSegments.length === 0) {
		return null;
	}

	const [firstSegment, ...rest] = pathSegments;
	const node = tree.find((n) => n.id === firstSegment);

	if (!node) {
		return null;
	}

	if (rest.length === 0) {
		return node;
	}

	return getNodeFromPath(node.children, rest);
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

/**
 * Navigates to a specific node by building its full path and updating the URL
 * Note: This function is kept for future use but currently not utilized
 * Navigation is handled directly in component handlers
 */
export function navigateToNode(
	router: { navigate: (options: { to: string }) => void },
	workspaceId: string,
	nodeId: string,
	tree: NodeTree[]
): void {
	const path = buildNodePath(tree, nodeId);

	if (!path) {
		return;
	}

	// Build the URL path: /workspaces/<workspace_id>/<node_path>
	const urlPath = `/workspaces/${workspaceId}/${path.join("/")}`;

	router.navigate({ to: urlPath as never });
}

/**
 * Gets the root node ID from a tree
 */
export function getRootNodeId(tree: NodeTree[]): string | null {
	return tree.length > 0 ? tree[0].id : null;
}
