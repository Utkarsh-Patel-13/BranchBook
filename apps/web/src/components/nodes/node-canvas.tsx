import type { NodeTree } from "@nexus/types";
import {
	Background,
	Controls,
	type Edge,
	MiniMap,
	type Node,
	type NodeTypes,
	ReactFlow,
	useEdgesState,
	useNodesState,
	useReactFlow,
} from "@xyflow/react";
import { useCallback, useEffect, useMemo } from "react";
import "@xyflow/react/dist/style.css";
import { useTheme } from "next-themes";
import { useCanvasStore } from "../../stores/canvas-store";
import { NodeCard } from "./node-card";

interface NodeCanvasProps {
	tree: NodeTree[];
	workspaceId: string;
	onAddChild: (parentId: string) => void;
}

const nodeTypes: NodeTypes = {
	custom: NodeCard,
};

const defaultEdgeOptions = {
	type: "smoothstep",
};

const NODE_WIDTH = 300;
const NODE_HEIGHT = 100;
const X_GAP = 60;
const Y_GAP = 80;

/** Returns the total horizontal space (px) required to render this subtree. */
function subtreeWidth(nodeTree: NodeTree, collapsed: Set<string>): number {
	if (collapsed.has(nodeTree.id) || nodeTree.children.length === 0) {
		return NODE_WIDTH + X_GAP;
	}
	return nodeTree.children.reduce(
		(sum, child) => sum + subtreeWidth(child, collapsed),
		0
	);
}

export function NodeCanvas({ tree, workspaceId, onAddChild }: NodeCanvasProps) {
	const { viewport, setViewport, setSelectedNodeIds } = useCanvasStore();
	const collapsedNodeIds = useCanvasStore((state) => state.collapsedNodeIds);
	const { resolvedTheme } = useTheme();
	const colorMode = resolvedTheme === "dark" ? "dark" : "light";
	const { fitView } = useReactFlow();

	// Compute layout from tree structure using recursive centering
	const layout = useMemo(() => {
		const nodes: Node[] = [];
		const edges: Edge[] = [];

		function placeNode(
			nodeTree: NodeTree,
			isRoot: boolean,
			collapsed: Set<string>,
			leftEdge: number,
			level: number
		) {
			const width = subtreeWidth(nodeTree, collapsed);
			const centerX = leftEdge + width / 2 - NODE_WIDTH / 2;
			const y = level * (NODE_HEIGHT + Y_GAP);

			nodes.push({
				id: nodeTree.id,
				type: "custom",
				position: { x: centerX, y },
				data: {
					node: nodeTree,
					isRoot,
					childCount: nodeTree.children.length,
					workspaceId,
					onAddChild,
				},
			});

			if (!collapsed.has(nodeTree.id)) {
				let childLeft = leftEdge;
				for (const child of nodeTree.children) {
					edges.push({
						id: `${nodeTree.id}-${child.id}`,
						source: nodeTree.id,
						target: child.id,
					});
					placeNode(child, false, collapsed, childLeft, level + 1);
					childLeft += subtreeWidth(child, collapsed);
				}
			}
		}

		let rootLeft = 0;
		for (const root of tree) {
			placeNode(root, true, collapsedNodeIds, rootLeft, 0);
			rootLeft += subtreeWidth(root, collapsedNodeIds) + X_GAP;
		}

		return { nodes, edges };
	}, [tree, collapsedNodeIds, workspaceId, onAddChild]);

	// React Flow owns positions so drag works; sync when tree structure changes,
	// but preserve positions of nodes the user has already dragged.
	const [nodes, setNodes, onNodesChange] = useNodesState(layout.nodes);
	const [edges, setEdges, onEdgesChange] = useEdgesState(layout.edges);

	useEffect(() => {
		setNodes((prev) => {
			const prevPositions = new Map(prev.map((n) => [n.id, n.position]));
			return layout.nodes.map((n) => ({
				...n,
				position: prevPositions.get(n.id) ?? n.position,
			}));
		});
		setEdges(layout.edges);
	}, [layout, setNodes, setEdges]);

	const onNodeClick = useCallback(
		(_: React.MouseEvent, node: Node) => {
			setSelectedNodeIds(new Set([node.id]));
			fitView({ nodes: [{ id: node.id }], duration: 300, padding: 0.5 });
		},
		[setSelectedNodeIds, fitView]
	);

	return (
		<div className="h-full w-full">
			<ReactFlow
				colorMode={colorMode}
				defaultEdgeOptions={defaultEdgeOptions}
				defaultViewport={viewport}
				edges={edges}
				fitView
				nodes={nodes}
				nodeTypes={nodeTypes}
				onEdgesChange={onEdgesChange}
				onlyRenderVisibleElements
				onNodeClick={onNodeClick}
				onNodesChange={onNodesChange}
				onViewportChange={(newViewport) => setViewport(newViewport)}
			>
				<Background gap={12} size={1} />
				<Controls />
				<MiniMap />
			</ReactFlow>
		</div>
	);
}
