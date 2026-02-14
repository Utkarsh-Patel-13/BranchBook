import type { NodeTree } from "@nexus/types";
import { useRouter } from "@tanstack/react-router";
import {
	EyeIcon,
	EyeOffIcon,
	InfoIcon,
	MessageSquareIcon,
	StickyNoteIcon,
} from "lucide-react";
import { Fragment, useMemo } from "react";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { buildNodePath, findNodeById } from "@/lib/workspace-navigation";
import { useWorkspaceLayoutStore } from "@/stores/workspace-layout-store";

interface WorkspaceHeaderProps {
	currentNodeId: string | null;
	tree: NodeTree[];
	workspaceId: string;
}

function buildBreadcrumbPath(
	tree: NodeTree[],
	nodeId: string | null
): NodeTree[] | null {
	if (!nodeId) {
		return null;
	}

	const pathIds = buildNodePath(tree, nodeId);
	if (!pathIds) {
		return null;
	}

	const nodes: NodeTree[] = [];
	for (const id of pathIds) {
		const node = findNodeById(tree, id);
		if (node) {
			nodes.push(node);
		}
	}

	return nodes;
}

export function WorkspaceHeader({
	currentNodeId,
	tree,
	workspaceId,
}: WorkspaceHeaderProps) {
	const router = useRouter();
	const {
		notesVisible,
		mobileView,
		setNotesVisible,
		setContextModalOpen,
		setMobileView,
	} = useWorkspaceLayoutStore();

	const breadcrumbPath = useMemo(() => {
		if (!currentNodeId) {
			return [];
		}
		return buildBreadcrumbPath(tree, currentNodeId) ?? [];
	}, [tree, currentNodeId]);

	const handleNodeClick = (node: NodeTree) => {
		const path = buildNodePath(tree, node.id);
		if (path) {
			const urlPath = `/workspaces/${workspaceId}/${path.join("/")}`;
			router.navigate({ to: urlPath as never });
		}
	};

	return (
		<header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
			{/* Sidebar Toggle */}
			<SidebarTrigger />

			{/* Breadcrumbs */}
			<Breadcrumb className="hidden flex-1 md:flex">
				<BreadcrumbList>
					{breadcrumbPath.length === 0 && (
						<BreadcrumbItem>
							<BreadcrumbPage className="text-muted-foreground">
								No node selected
							</BreadcrumbPage>
						</BreadcrumbItem>
					)}
					{breadcrumbPath.slice(-3).map((node, index) => {
						const isLast =
							breadcrumbPath.length < 3
								? index === breadcrumbPath.length - 1
								: index === 2;
						return (
							<Fragment key={node.id}>
								<BreadcrumbItem>
									{isLast ? (
										<BreadcrumbPage>{node.title}</BreadcrumbPage>
									) : (
										<BreadcrumbLink
											className="cursor-pointer"
											onClick={() => handleNodeClick(node)}
										>
											{node.title.length > 10
												? `${node.title.slice(0, 10)}...`
												: node.title}
										</BreadcrumbLink>
									)}
								</BreadcrumbItem>
								{!isLast && <BreadcrumbSeparator />}
							</Fragment>
						);
					})}
				</BreadcrumbList>
			</Breadcrumb>

			{/* Mobile: Current node title */}
			<div className="flex-1 truncate md:hidden">
				{breadcrumbPath.length > 0 &&
					(() => {
						const lastNode = breadcrumbPath.at(-1);
						return lastNode ? (
							<span className="font-medium text-sm">{lastNode.title}</span>
						) : null;
					})()}
			</div>

			{/* Actions */}
			<div className="flex items-center gap-2">
				{/* Mobile view toggle */}
				<div className="flex gap-1 lg:hidden">
					<Button
						aria-label="Show chat"
						className="h-8 px-2"
						onClick={() => setMobileView("chat")}
						size="sm"
						variant={mobileView === "chat" ? "default" : "ghost"}
					>
						<MessageSquareIcon className="size-4" />
						<span className="ml-1.5 hidden sm:inline">Chat</span>
					</Button>
					<Button
						aria-label="Show notes"
						className="h-8 px-2"
						onClick={() => setMobileView("notes")}
						size="sm"
						variant={mobileView === "notes" ? "default" : "ghost"}
					>
						<StickyNoteIcon className="size-4" />
						<span className="ml-1.5 hidden sm:inline">Notes</span>
					</Button>
				</div>

				{/* Desktop controls */}
				<div className="hidden items-center gap-2 lg:flex">
					{/* Notes toggle */}
					<Button
						aria-label={notesVisible ? "Hide notes" : "Show notes"}
						onClick={() => setNotesVisible(!notesVisible)}
						size="sm"
						variant="ghost"
					>
						{notesVisible ? (
							<EyeOffIcon className="size-4" />
						) : (
							<EyeIcon className="size-4" />
						)}
						<span className="ml-1.5 text-xs">Notes</span>
					</Button>

					<Separator className="h-6" orientation="vertical" />

					{/* Context button */}
					<Button
						aria-label="Show context"
						onClick={() => setContextModalOpen(true)}
						size="sm"
						variant="ghost"
					>
						<InfoIcon className="size-4" />
						<span className="ml-1.5 text-xs">Context</span>
					</Button>
				</div>
			</div>
		</header>
	);
}
