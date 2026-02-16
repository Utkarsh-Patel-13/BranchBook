import type { NodeTree } from "@nexus/types";
import { useRouter } from "@tanstack/react-router";
import { MessageSquareDashedIcon } from "lucide-react";
import { useEffect } from "react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { NodeChatPanel } from "@/components/workspaces/chat/node-chat-panel";
import { ContextModal } from "@/components/workspaces/context/context-modal";
import { WorkspaceNotesPanel } from "@/components/workspaces/notes/workspace-notes-panel";
import { WorkspaceHeader } from "@/components/workspaces/workspace-header";
import { WorkspaceSidebar } from "@/components/workspaces/workspace-sidebar";
import { buildNodePath } from "@/lib/workspace-navigation";
import { useWorkspaceLayoutStore } from "@/stores/workspace-layout-store";

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
	currentNodeId: string | null;
	rootId: string;
	tree: NodeTree[];
}

export function WorkspaceSplitLayout({
	currentNodeId,
	rootId,
	tree,
}: WorkspaceSplitLayoutProps) {
	const router = useRouter();
	const {
		sidebarOpen,
		desktopView,
		editMode,
		mobileView,
		initLayout,
		setSidebarOpen,
	} = useWorkspaceLayoutStore();

	useEffect(() => {
		initLayout(rootId);
	}, [rootId, initLayout]);

	const handleSidebarOpenChange = (open: boolean) => {
		setSidebarOpen(open);
	};

	const handleSelectNode = (nodeId: string) => {
		const path = buildNodePath(tree, nodeId);
		if (path) {
			const urlPath = `/workspaces/${rootId}/${path.join("/")}`;
			router.navigate({ to: urlPath as never });
		}
	};

	return (
		<>
			<SidebarProvider
				className="h-full min-h-0"
				onOpenChange={handleSidebarOpenChange}
				open={sidebarOpen}
			>
				<WorkspaceSidebar
					onSelectNode={handleSelectNode}
					selectedNodeId={currentNodeId}
					workspaceId={rootId}
				/>

				<SidebarInset className="relative flex-1 overflow-hidden">
					<WorkspaceHeader
						currentNodeId={currentNodeId}
						tree={tree}
						workspaceId={rootId}
					/>

					{/* absolute inset-0 gives the flex container a definite pixel height */}
					<div className="absolute inset-0 top-14">
						<div className="flex h-full">
							{/* Desktop: chat / both / notes */}
							{(desktopView === "chat" || desktopView === "both") && (
								<div
									className={`hidden flex-col overflow-hidden border-r lg:flex ${
										desktopView === "both" ? "w-[50%]" : "w-full"
									}`}
								>
									{currentNodeId ? (
										<NodeChatPanel nodeId={currentNodeId} tree={tree} />
									) : (
										<ChatEmptyState />
									)}
								</div>
							)}

							{(desktopView === "notes" || desktopView === "both") && (
								<div
									className={`hidden overflow-hidden lg:block ${
										desktopView === "both" ? "w-[50%]" : "w-full"
									}`}
								>
									<WorkspaceNotesPanel
										editMode={editMode}
										selectedNodeId={currentNodeId}
									/>
								</div>
							)}

							{/* Mobile/Tablet: Toggled view */}
							<div className="flex w-full flex-col overflow-hidden lg:hidden">
								{mobileView === "chat" &&
									(currentNodeId ? (
										<NodeChatPanel nodeId={currentNodeId} tree={tree} />
									) : (
										<ChatEmptyState />
									))}
								{mobileView === "notes" && (
									<WorkspaceNotesPanel
										editMode={editMode}
										selectedNodeId={currentNodeId}
									/>
								)}
							</div>
						</div>
					</div>
				</SidebarInset>
			</SidebarProvider>

			<ContextModal nodeId={currentNodeId} />
		</>
	);
}
