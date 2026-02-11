import type { NodeTree } from "@nexus/types";
import { MessageSquareDashedIcon } from "lucide-react";
import { useEffect } from "react";
import { NodeChatPanel } from "@/components/chat/node-chat-panel";
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
	Sidebar,
	SidebarContent,
	SidebarHeader,
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@/components/ui/sidebar";
import { useNodeTree } from "@/hooks/use-nodes";
import { getLayout, setLayout } from "@/lib/workspace-layout-storage";
import { useWorkspaceLayoutStore } from "@/stores/workspace-layout-store";
import { WorkspaceNodeTree } from "./workspace-node-tree";
import { WorkspaceNotesPlaceholder } from "./workspace-notes-placeholder";

function findNodeInTree(tree: NodeTree[], nodeId: string): boolean {
	for (const node of tree) {
		if (node.id === nodeId) {
			return true;
		}
		if (findNodeInTree(node.children, nodeId)) {
			return true;
		}
	}
	return false;
}

function ChatEmptyState() {
	return (
		<div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
			<div className="rounded-full bg-muted p-3">
				<MessageSquareDashedIcon className="size-6 text-muted-foreground" />
			</div>
			<div className="space-y-1">
				<h3 className="font-medium text-sm">No node selected</h3>
				<p className="text-muted-foreground text-xs">
					Select a node from the sidebar to start a conversation.
				</p>
			</div>
		</div>
	);
}

interface WorkspaceSplitLayoutProps {
	workspaceId: string;
}

export function WorkspaceSplitLayout({
	workspaceId,
}: WorkspaceSplitLayoutProps) {
	const {
		sidebarOpen,
		selectedNodeId,
		initLayout,
		setSidebarOpen,
		setPanelSizes,
		setSelectedNodeId,
	} = useWorkspaceLayoutStore();

	const { data: tree } = useNodeTree(workspaceId);

	useEffect(() => {
		initLayout(workspaceId);
	}, [workspaceId, initLayout]);

	// T018/T020: Validate restored selectedNodeId against the current tree.
	// If the node no longer exists, clear the selection and persist the change.
	useEffect(() => {
		if (!tree || selectedNodeId === null) {
			return;
		}
		if (!findNodeInTree(tree, selectedNodeId)) {
			setSelectedNodeId(null);
		}
	}, [tree, selectedNodeId, setSelectedNodeId]);

	const storedSizes = getLayout(workspaceId).panelSizes;
	const defaultChatSize = storedSizes[0] ?? 50;
	const defaultNotesSize = storedSizes[1] ?? 50;

	const handleSidebarOpenChange = (open: boolean) => {
		setSidebarOpen(open);
	};

	const handlePanelLayout = (layout: Record<string, number>) => {
		const sizes = Object.values(layout);
		if (sizes.length === 2) {
			setPanelSizes(sizes);
			setLayout(workspaceId, { panelSizes: sizes });
		}
	};

	const handleSelectNode = (nodeId: string) => {
		setSelectedNodeId(nodeId);
	};

	return (
		<SidebarProvider onOpenChange={handleSidebarOpenChange} open={sidebarOpen}>
			<Sidebar collapsible="icon">
				<SidebarHeader className="flex flex-row items-center gap-2 p-3">
					<SidebarTrigger />
					<span className="font-medium text-sm group-data-[collapsible=icon]:hidden">
						Nodes
					</span>
				</SidebarHeader>
				<SidebarContent>
					<WorkspaceNodeTree
						onSelectNode={handleSelectNode}
						selectedNodeId={selectedNodeId}
						workspaceId={workspaceId}
					/>
				</SidebarContent>
			</Sidebar>

			<SidebarInset className="flex min-h-0 flex-1 flex-col overflow-hidden">
				<ResizablePanelGroup
					direction="horizontal"
					onLayoutChanged={handlePanelLayout}
				>
					<ResizablePanel
						defaultSize={defaultChatSize}
						maxSize={80}
						minSize={20}
					>
						{selectedNodeId ? (
							<NodeChatPanel nodeId={selectedNodeId} />
						) : (
							<ChatEmptyState />
						)}
					</ResizablePanel>

					<ResizableHandle withHandle />

					<ResizablePanel
						defaultSize={defaultNotesSize}
						maxSize={80}
						minSize={20}
					>
						<WorkspaceNotesPlaceholder />
					</ResizablePanel>
				</ResizablePanelGroup>
			</SidebarInset>
		</SidebarProvider>
	);
}
