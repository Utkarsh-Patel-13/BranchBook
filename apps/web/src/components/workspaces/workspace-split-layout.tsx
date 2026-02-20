import type { NodeTree } from "@branchbook/types";
import { useRouter } from "@tanstack/react-router";
import { MessageSquareDashedIcon } from "lucide-react";
import { useEffect, useRef } from "react";
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
	const sidebarOpen = useWorkspaceLayoutStore((s) => s.sidebarOpen);
	const desktopView = useWorkspaceLayoutStore((s) => s.desktopView);
	const editMode = useWorkspaceLayoutStore((s) => s.editMode);
	const mobileView = useWorkspaceLayoutStore((s) => s.mobileView);
	const initLayout = useWorkspaceLayoutStore((s) => s.initLayout);
	const setSidebarOpen = useWorkspaceLayoutStore((s) => s.setSidebarOpen);
	const panelSizes = useWorkspaceLayoutStore((s) => s.panelSizes);
	const setPanelSizes = useWorkspaceLayoutStore((s) => s.setPanelSizes);

	const panelContainerRef = useRef<HTMLDivElement>(null);

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

	const handleResizeMouseDown = (e: React.MouseEvent) => {
		e.preventDefault();
		const container = panelContainerRef.current;
		if (!container) {
			return;
		}

		const handleMouseMove = (moveEvent: MouseEvent) => {
			const rect = container.getBoundingClientRect();
			const leftPct = Math.min(
				90,
				Math.max(10, ((moveEvent.clientX - rect.left) / rect.width) * 100)
			);
			const rightPct = 100 - leftPct;
			setPanelSizes([leftPct, rightPct]);
		};

		const handleMouseUp = () => {
			document.removeEventListener("mousemove", handleMouseMove);
			document.removeEventListener("mouseup", handleMouseUp);
		};

		document.addEventListener("mousemove", handleMouseMove);
		document.addEventListener("mouseup", handleMouseUp);
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
					tree={tree}
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
						<div className="flex h-full" ref={panelContainerRef}>
							{/* Desktop: chat / both / notes */}
							{(desktopView === "chat" || desktopView === "both") && (
								<div
									className="hidden flex-col overflow-hidden border-r lg:flex"
									style={{
										width:
											desktopView === "both" ? `${panelSizes[0]}%` : "100%",
									}}
								>
									{currentNodeId ? (
										<NodeChatPanel nodeId={currentNodeId} tree={tree} />
									) : (
										<ChatEmptyState />
									)}
								</div>
							)}

							{/* Drag-to-resize handle (desktop only, both-panel view) */}
							{desktopView === "both" && (
								<div
									aria-hidden
									className="group relative z-10 hidden w-1 cursor-col-resize bg-border hover:bg-primary/40 active:bg-primary/60 lg:flex lg:items-center lg:justify-center"
									onMouseDown={handleResizeMouseDown}
								/>
							)}

							{(desktopView === "notes" || desktopView === "both") && (
								<div
									className="hidden overflow-hidden lg:block"
									style={{
										width:
											desktopView === "both" ? `${panelSizes[1]}%` : "100%",
									}}
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
