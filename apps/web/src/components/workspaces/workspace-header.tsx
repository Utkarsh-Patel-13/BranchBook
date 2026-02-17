import type { NodeTree } from "@nexus/types";
import { useRouter } from "@tanstack/react-router";
import {
	ChevronLeftIcon,
	Columns2,
	InfoIcon,
	MessageSquareIcon,
	StickyNoteIcon,
} from "lucide-react";
import { Fragment, useMemo } from "react";
import {
	Breadcrumb,
	BreadcrumbEllipsis,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { DesktopView } from "@/lib/workspace-layout-storage";
import { buildBreadcrumbPath } from "@/lib/workspace-navigation";
import { useWorkspaceLayoutStore } from "@/stores/workspace-layout-store";

interface WorkspaceHeaderProps {
	currentNodeId: string | null;
	tree: NodeTree[];
	workspaceId: string;
}

export function WorkspaceHeader({
	currentNodeId,
	tree,
	workspaceId,
}: WorkspaceHeaderProps) {
	const router = useRouter();
	const desktopView = useWorkspaceLayoutStore((s) => s.desktopView);
	const mobileView = useWorkspaceLayoutStore((s) => s.mobileView);
	const setDesktopView = useWorkspaceLayoutStore((s) => s.setDesktopView);
	const setContextModalOpen = useWorkspaceLayoutStore(
		(s) => s.setContextModalOpen
	);
	const setMobileView = useWorkspaceLayoutStore((s) => s.setMobileView);

	const breadcrumbPath = useMemo(() => {
		if (!currentNodeId) {
			return [];
		}
		return buildBreadcrumbPath(tree, currentNodeId) ?? [];
	}, [tree, currentNodeId]);

	const handleNodeClick = (node: NodeTree) => {
		const idx = breadcrumbPath.findIndex((n) => n.id === node.id);
		if (idx >= 0) {
			const pathIds = breadcrumbPath.slice(0, idx + 1).map((n) => n.id);
			const urlPath = `/workspaces/${workspaceId}/${pathIds.join("/")}`;
			router.navigate({ to: urlPath as never });
		}
	};

	const breadcrumbSegments = useMemo(() => {
		const len = breadcrumbPath.length;
		if (len <= 4) {
			return breadcrumbPath.map((node, i) => ({ node, isLast: i === len - 1 }));
		}
		const first = breadcrumbPath[0];
		const lastTwo = breadcrumbPath.slice(-2);
		return [
			{ node: first, isLast: false },
			{ node: null, isLast: false, ellipsis: true },
			...lastTwo.map((node, i) => ({
				node,
				isLast: i === lastTwo.length - 1,
			})),
		];
	}, [breadcrumbPath]);

	return (
		<header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
			{/* Sidebar Toggle */}
			<SidebarTrigger />

			{/* Back */}
			<Button
				aria-label="Go back"
				className="size-8 shrink-0 md:size-9"
				onClick={() => router.navigate({ to: "/workspaces" })}
				variant="ghost"
			>
				<ChevronLeftIcon className="size-4" />
			</Button>

			{/* Breadcrumbs */}
			<Breadcrumb className="hidden min-w-0 flex-1 md:flex">
				<BreadcrumbList className="min-w-0 flex-wrap">
					{breadcrumbPath.length === 0 && (
						<BreadcrumbItem>
							<BreadcrumbPage className="text-muted-foreground">
								No node selected
							</BreadcrumbPage>
						</BreadcrumbItem>
					)}
					{breadcrumbSegments.map((segment) => {
						if (segment.ellipsis) {
							return (
								<Fragment key="breadcrumb-ellipsis">
									<BreadcrumbItem>
										<BreadcrumbEllipsis />
									</BreadcrumbItem>
									<BreadcrumbSeparator />
								</Fragment>
							);
						}
						const { node, isLast } = segment;
						if (!node) {
							return null;
						}
						const title = node.title.trim() || "Untitled";
						return (
							<Fragment key={node.id}>
								<BreadcrumbItem className="min-w-0 max-w-48">
									{isLast ? (
										<BreadcrumbPage className="truncate" title={title}>
											{title}
										</BreadcrumbPage>
									) : (
										<BreadcrumbLink
											className="cursor-pointer truncate"
											onClick={() => handleNodeClick(node)}
											title={title}
										>
											{title}
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
					<Tabs
						className="w-fit"
						onValueChange={(v) => setDesktopView(v as DesktopView)}
						value={desktopView}
					>
						<TabsList className="text-xs">
							<TabsTrigger aria-label="Show chat only" value="chat">
								<MessageSquareIcon className="size-4" />
								Chat
							</TabsTrigger>
							<TabsTrigger aria-label="Show chat and notes" value="both">
								<Columns2 className="size-4" />
								Both
							</TabsTrigger>
							<TabsTrigger aria-label="Show notes only" value="notes">
								<StickyNoteIcon className="size-4" />
								Notes
							</TabsTrigger>
						</TabsList>
					</Tabs>

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
