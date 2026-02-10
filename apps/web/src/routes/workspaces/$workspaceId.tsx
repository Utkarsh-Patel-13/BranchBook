import type { NodeTree, WorkspaceId } from "@nexus/types";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { ReactFlowProvider } from "@xyflow/react";
import { Plus } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { CreateNodeDialog } from "@/components/nodes/create-node-dialog";
import { NodeCanvas } from "@/components/nodes/node-canvas";
import { NodeSidebar } from "@/components/nodes/node-sidebar";
import { Button } from "@/components/ui/button";
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from "@/components/ui/resizable";
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

function findNodeTitle(tree: NodeTree[], id: string): string | null {
	for (const node of tree) {
		if (node.id === id) {
			return node.title;
		}
		const found = findNodeTitle(node.children, id);
		if (found !== null) {
			return found;
		}
	}
	return null;
}

function WorkspaceCanvasRouteComponent() {
	const { workspaceId } = Route.useParams() as { workspaceId: WorkspaceId };
	const nodeTreeQuery = useNodeTree(workspaceId);

	const sidePanelNodeId = useCanvasStore((state) => state.sidePanelNodeId);
	const setSidePanelNodeId = useCanvasStore(
		(state) => state.setSidePanelNodeId
	);

	const [createDialogOpen, setCreateDialogOpen] = useState(false);
	const [createDialogParentId, setCreateDialogParentId] = useState<
		string | null
	>(null);

	const handleAddChild = useCallback((parentId: string) => {
		setCreateDialogParentId(parentId);
		setCreateDialogOpen(true);
	}, []);

	const handleNewRootNode = useCallback(() => {
		setCreateDialogParentId(null);
		setCreateDialogOpen(true);
	}, []);

	const tree = nodeTreeQuery.data ?? [];
	const isLoading = nodeTreeQuery.isLoading;
	const isEmpty = !isLoading && tree.length === 0;

	const sidePanelNodeTitle = useMemo(
		() => (sidePanelNodeId ? (findNodeTitle(tree, sidePanelNodeId) ?? "") : ""),
		[tree, sidePanelNodeId]
	);

	const canvas = (
		<div className="relative h-full w-full">
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
	);

	return (
		<div className="flex h-full w-full overflow-hidden">
			{sidePanelNodeId ? (
				<ResizablePanelGroup direction="horizontal">
					<ResizablePanel defaultSize={72} minSize={30}>
						{canvas}
					</ResizablePanel>
					<ResizableHandle withHandle />
					<ResizablePanel defaultSize={28} minSize={28}>
						<NodeSidebar
							nodeId={sidePanelNodeId}
							nodeTitle={sidePanelNodeTitle}
							onClose={() => setSidePanelNodeId(null)}
						/>
					</ResizablePanel>
				</ResizablePanelGroup>
			) : (
				canvas
			)}

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
