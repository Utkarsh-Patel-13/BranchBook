import type { NodeTree } from "@nexus/types";
import { MessageSquareDashedIcon } from "lucide-react";
import { useEffect } from "react";
import { NodeChatPanel } from "@/components/chat/node-chat-panel";
import {
	Sidebar,
	SidebarContent,
	SidebarHeader,
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@/components/ui/sidebar";
import { useNodeTree } from "@/hooks/use-nodes";
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

	const handleSidebarOpenChange = (open: boolean) => {
		setSidebarOpen(open);
	};

	const handleSelectNode = (nodeId: string) => {
		setSelectedNodeId(nodeId);
	};

	return (
		<SidebarProvider
			className="h-full min-h-0"
			onOpenChange={handleSidebarOpenChange}
			open={sidebarOpen}
		>
			<Sidebar className="pt-16" collapsible="icon">
				<SidebarHeader className="flex flex-row items-center gap-2 p-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:px-0">
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

			<SidebarInset className="relative flex-1 overflow-hidden">
				{/* absolute inset-0 gives the flex container a definite pixel height */}
				<div className="absolute inset-0">
					<div className="flex h-full">
						<div className="flex w-[60%] flex-col overflow-hidden border-r">
							{selectedNodeId ? (
								<NodeChatPanel nodeId={selectedNodeId} />
							) : (
								<ChatEmptyState />
							)}
						</div>
						<div className="w-[40%] overflow-hidden">
							<WorkspaceNotesPlaceholder />
						</div>
					</div>
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
