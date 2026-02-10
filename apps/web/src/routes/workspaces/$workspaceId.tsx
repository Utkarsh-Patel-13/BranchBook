import type { WorkspaceId } from "@nexus/types";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { ReactFlowProvider } from "@xyflow/react";
import { Plus } from "lucide-react";
import { useCallback, useState } from "react";
import { CreateNodeDialog } from "@/components/nodes/create-node-dialog";
import { NodeCanvas } from "@/components/nodes/node-canvas";
import { NodeSidebar } from "@/components/nodes/node-sidebar";
import { Button } from "@/components/ui/button";
import { useNodeTree } from "@/hooks/use-nodes";
import { authClient } from "@/lib/auth-client";
import { useCanvasStore } from "@/stores/canvas-store";

export const Route = createFileRoute("/workspaces/$workspaceId")({
	component: WorkspaceCanvasRouteComponent,
	beforeLoad: async ({ location }) => {
		const session = await authClient.getSession();
		if (!session.data) {
			redirect({
				to: "/login",
				search: {
					redirect: location.href,
				},
				throw: true,
			});
		}
	},
});

function WorkspaceCanvasRouteComponent() {
	const { workspaceId } = Route.useParams() as { workspaceId: WorkspaceId };
	const nodeTreeQuery = useNodeTree(workspaceId);
	const selectedNodeIds = useCanvasStore((state) => state.selectedNodeIds);
	const clearSelection = useCanvasStore((state) => state.clearSelection);

	// Derive the first selected node id from canvas store for the sidebar
	const canvasSelectedNodeId =
		selectedNodeIds.size > 0 ? [...selectedNodeIds][0] : null;

	const [sidebarNodeId, setSidebarNodeId] = useState<string | null>(null);
	const [createDialogOpen, setCreateDialogOpen] = useState(false);
	const [createDialogParentId, setCreateDialogParentId] = useState<
		string | null
	>(null);

	// Canvas selection takes priority; fallback to sidebar manual selection
	const selectedNodeId = canvasSelectedNodeId ?? sidebarNodeId;

	const handleAddChild = useCallback((parentId: string) => {
		setCreateDialogParentId(parentId);
		setCreateDialogOpen(true);
	}, []);

	const handleNewRootNode = useCallback(() => {
		setCreateDialogParentId(null);
		setCreateDialogOpen(true);
	}, []);

	const handleNodeDeleted = useCallback(() => {
		setSidebarNodeId(null);
		clearSelection();
	}, [clearSelection]);

	const tree = nodeTreeQuery.data ?? [];
	const isLoading = nodeTreeQuery.isLoading;
	const isEmpty = !isLoading && tree.length === 0;

	return (
		<div className="flex h-full w-full overflow-hidden">
			<div className="relative flex-1">
				{isLoading && (
					<div className="flex h-full items-center justify-center">
						<p className="text-muted-foreground text-sm">Loading canvas…</p>
					</div>
				)}

				{isEmpty && (
					<div className="flex h-full flex-col items-center justify-center gap-4">
						<p className="text-muted-foreground text-sm">
							Create your first root node to start exploring
						</p>
						<Button onClick={handleNewRootNode} size="sm">
							<Plus className="mr-1 size-4" />
							New Root Node
						</Button>
					</div>
				)}

				{!(isLoading || isEmpty) && (
					<>
						<div className="absolute top-4 left-4 z-10">
							<Button onClick={handleNewRootNode} size="sm">
								<Plus className="mr-1 size-4" />
								New Root Node
							</Button>
						</div>
						<ReactFlowProvider>
							<NodeCanvas
								onAddChild={handleAddChild}
								tree={tree}
								workspaceId={workspaceId}
							/>
						</ReactFlowProvider>
					</>
				)}
			</div>

			<NodeSidebar
				onDeleted={handleNodeDeleted}
				onSelectNode={setSidebarNodeId}
				selectedNodeId={selectedNodeId}
				tree={tree}
				workspaceId={workspaceId}
			/>

			<CreateNodeDialog
				isRoot={createDialogParentId === null}
				onOpenChange={setCreateDialogOpen}
				open={createDialogOpen}
				parentId={createDialogParentId}
				workspaceId={workspaceId}
			/>
		</div>
	);
}
