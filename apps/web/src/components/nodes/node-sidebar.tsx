import type { NodeTree } from "@nexus/types";
import { ChevronRight, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { NodeChatPanel } from "../chat/node-chat-panel";
import { Button } from "../ui/button";
import { DeleteNodeDialog } from "./delete-node-dialog";

interface NodeSidebarProps {
	selectedNodeId: string | null;
	tree: NodeTree[];
	workspaceId: string;
	onSelectNode: (nodeId: string) => void;
	onDeleted?: () => void;
}

export function NodeSidebar({
	selectedNodeId,
	tree,
	workspaceId,
	onSelectNode,
	onDeleted,
}: NodeSidebarProps) {
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

	const selectedNodeData = useMemo<{
		node: NodeTree;
		breadcrumb: NodeTree[];
	} | null>(() => {
		if (!selectedNodeId) {
			return null;
		}

		let found: NodeTree | null = null;
		let breadcrumb: NodeTree[] = [];

		function searchNode(
			nodes: NodeTree[],
			currentBreadcrumb: NodeTree[]
		): boolean {
			for (const node of nodes) {
				const newBreadcrumb = [...currentBreadcrumb, node];

				if (node.id === selectedNodeId) {
					found = node;
					breadcrumb = newBreadcrumb;
					return true;
				}

				if (searchNode(node.children, newBreadcrumb)) {
					return true;
				}
			}
			return false;
		}

		searchNode(tree, []);

		return found ? { node: found, breadcrumb } : null;
	}, [selectedNodeId, tree]);

	if (!selectedNodeData) {
		return (
			<div className="flex h-full items-center justify-center border-l p-4">
				<p className="text-center text-muted-foreground text-sm">
					Select a node to view details
				</p>
			</div>
		);
	}

	const { node, breadcrumb } = selectedNodeData;
	const parent = breadcrumb.length > 1 ? (breadcrumb.at(-2) ?? null) : null;
	const isRoot = breadcrumb.length === 1;

	return (
		<div className="flex h-full w-80 flex-col border-l">
			<div className="flex items-center justify-between border-b p-4">
				<h2 className="font-semibold text-base">Node Details</h2>
				<Button
					className="text-destructive hover:text-destructive"
					onClick={() => setDeleteDialogOpen(true)}
					size="xs"
					variant="ghost"
				>
					<Trash2 className="size-3.5" />
				</Button>
			</div>

			<div className="space-y-4 overflow-y-auto p-4">
				{/* Breadcrumb */}
				<div>
					<h3 className="mb-2 font-medium text-muted-foreground text-xs uppercase">
						Path
					</h3>
					<div className="flex flex-wrap items-center gap-1">
						{breadcrumb.map((crumb, index) => (
							<div className="flex items-center gap-1" key={crumb.id}>
								{index > 0 && (
									<ChevronRight className="size-3 text-muted-foreground" />
								)}
								<Button
									className={
										crumb.id === node.id
											? "font-semibold text-foreground"
											: "text-muted-foreground"
									}
									onClick={() => onSelectNode(crumb.id)}
									size="xs"
									variant="ghost"
								>
									{crumb.title}
								</Button>
							</div>
						))}
					</div>
				</div>

				{/* Current Node Info */}
				<div>
					<h3 className="mb-2 font-medium text-muted-foreground text-xs uppercase">
						Current Node
					</h3>
					<div className="space-y-1 text-sm">
						<p>
							<span className="font-medium">Title:</span> {node.title}
						</p>
						<p>
							<span className="font-medium">Type:</span>{" "}
							{isRoot ? "Root" : "Child"}
						</p>
					</div>
				</div>

				{/* Parent */}
				{parent && (
					<div>
						<h3 className="mb-2 font-medium text-muted-foreground text-xs uppercase">
							Parent
						</h3>
						<Button
							className="w-full justify-start"
							onClick={() => onSelectNode(parent.id)}
							size="sm"
							variant="outline"
						>
							{parent.title}
						</Button>
					</div>
				)}

				{/* Children */}
				{node.children.length > 0 && (
					<div>
						<h3 className="mb-2 font-medium text-muted-foreground text-xs uppercase">
							Children ({node.children.length})
						</h3>
						<div className="space-y-1">
							{node.children.map((child) => (
								<Button
									className="w-full justify-start"
									key={child.id}
									onClick={() => onSelectNode(child.id)}
									size="sm"
									variant="ghost"
								>
									{child.title}
								</Button>
							))}
						</div>
					</div>
				)}
			</div>

			<NodeChatPanel nodeId={node.id} />

			<DeleteNodeDialog
				node={node}
				onDeleted={onDeleted}
				onOpenChange={setDeleteDialogOpen}
				open={deleteDialogOpen}
				workspaceId={workspaceId}
			/>
		</div>
	);
}
