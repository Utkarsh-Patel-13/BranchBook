import type { NodeTree } from "@nexus/types";
import {
	MessageSquareDashedIcon,
	MessageSquareIcon,
	StickyNoteIcon,
} from "lucide-react";
import { Fragment, useEffect, useMemo, useState } from "react";
import { NodeChatPanel } from "@/components/chat/node-chat-panel";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@/components/ui/sidebar";
import { useNodeTree } from "@/hooks/use-nodes";
import { useWorkspaceLayoutStore } from "@/stores/workspace-layout-store";
import { WorkspaceNotesPanel } from "./workspace-notes-panel";
import { WorkspaceSidebar } from "./workspace-sidebar";

function findNodeInTree(tree: NodeTree[], nodeId: string): NodeTree | null {
	for (const node of tree) {
		if (node.id === nodeId) {
			return node;
		}
		const found = findNodeInTree(node.children, nodeId);
		if (found) {
			return found;
		}
	}
	return null;
}

function buildBreadcrumbPath(
	tree: NodeTree[],
	nodeId: string,
	path: NodeTree[] = []
): NodeTree[] | null {
	for (const node of tree) {
		if (node.id === nodeId) {
			return [...path, node];
		}
		const found = buildBreadcrumbPath(node.children, nodeId, [...path, node]);
		if (found) {
			return found;
		}
	}
	return null;
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
	const [mobileView, setMobileView] = useState<"chat" | "notes">("chat");

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

	const breadcrumbPath = useMemo(() => {
		if (!(tree && selectedNodeId)) {
			return [];
		}
		return buildBreadcrumbPath(tree, selectedNodeId) ?? [];
	}, [tree, selectedNodeId]);

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
			<WorkspaceSidebar
				className="pt-14"
				onSelectNode={handleSelectNode}
				selectedNodeId={selectedNodeId}
				workspaceId={workspaceId}
			/>

			<SidebarInset className="relative flex-1 overflow-hidden">
				<header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
					<SidebarTrigger className="-ml-1" />
					<Breadcrumb className="flex-1">
						<BreadcrumbList>
							{breadcrumbPath.length === 0 && (
								<BreadcrumbItem>
									<BreadcrumbPage className="text-muted-foreground">
										No node selected
									</BreadcrumbPage>
								</BreadcrumbItem>
							)}
							{breadcrumbPath.map((node, index) => {
								const isLast = index === breadcrumbPath.length - 1;
								return (
									<Fragment key={node.id}>
										<BreadcrumbItem>
											{isLast ? (
												<BreadcrumbPage>{node.title}</BreadcrumbPage>
											) : (
												<BreadcrumbLink
													className="cursor-pointer"
													onClick={() => handleSelectNode(node.id)}
												>
													{node.title}
												</BreadcrumbLink>
											)}
										</BreadcrumbItem>
										{!isLast && <BreadcrumbSeparator />}
									</Fragment>
								);
							})}
						</BreadcrumbList>
					</Breadcrumb>

					{/* Mobile view toggle */}
					<div className="flex gap-1 lg:hidden">
						<Button
							className="h-8 px-2"
							onClick={() => setMobileView("chat")}
							size="sm"
							variant={mobileView === "chat" ? "default" : "ghost"}
						>
							<MessageSquareIcon className="size-4" />
							<span className="ml-1.5 hidden sm:inline">Chat</span>
						</Button>
						<Button
							className="h-8 px-2"
							onClick={() => setMobileView("notes")}
							size="sm"
							variant={mobileView === "notes" ? "default" : "ghost"}
						>
							<StickyNoteIcon className="size-4" />
							<span className="ml-1.5 hidden sm:inline">Notes</span>
						</Button>
					</div>
				</header>

				{/* absolute inset-0 gives the flex container a definite pixel height */}
				<div className="absolute inset-0 top-14">
					<div className="flex h-full">
						{/* Desktop: Split view */}
						<div className="hidden w-[50%] flex-col overflow-hidden border-r lg:flex">
							{selectedNodeId ? (
								<NodeChatPanel nodeId={selectedNodeId} />
							) : (
								<ChatEmptyState />
							)}
						</div>
						<div className="hidden w-[50%] overflow-hidden lg:block">
							<WorkspaceNotesPanel selectedNodeId={selectedNodeId} />
						</div>

						{/* Mobile/Tablet: Toggled view */}
						<div className="flex w-full flex-col overflow-hidden lg:hidden">
							{mobileView === "chat" &&
								(selectedNodeId ? (
									<NodeChatPanel nodeId={selectedNodeId} />
								) : (
									<ChatEmptyState />
								))}
							{mobileView === "notes" && (
								<WorkspaceNotesPanel selectedNodeId={selectedNodeId} />
							)}
						</div>
					</div>
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
