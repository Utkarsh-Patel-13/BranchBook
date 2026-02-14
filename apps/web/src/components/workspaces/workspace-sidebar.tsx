import type { NodeTree } from "@nexus/types";
import { Link } from "@tanstack/react-router";
import {
	BookOpenIcon,
	ChevronRightIcon,
	FileTextIcon,
	FolderIcon,
	MoreHorizontalIcon,
	PlusIcon,
	Trash2Icon,
} from "lucide-react";
import { useState } from "react";
import { ModeToggle } from "@/components/mode-toggle";
import { CreateNodeDialog } from "@/components/nodes/create-node-dialog";
import { DeleteNodeDialog } from "@/components/nodes/delete-node-dialog";
import { Button } from "@/components/ui/button";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupAction,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuAction,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarRail,
} from "@/components/ui/sidebar";
import UserMenu from "@/components/user-menu";
import { useNodeTree } from "@/hooks/use-nodes";
import { cn } from "@/lib/utils";

interface NodeRowProps {
	node: NodeTree;
	workspaceId: string;
	selectedNodeId: string | null;
	onSelectNode: (nodeId: string) => void;
	tree: NodeTree[];
}

function NodeRow({
	node,
	workspaceId,
	selectedNodeId,
	onSelectNode,
	tree,
}: NodeRowProps) {
	const [addChildOpen, setAddChildOpen] = useState(false);
	const [deleteOpen, setDeleteOpen] = useState(false);

	const hasChildren = node.children.length > 0;
	const isSelected = selectedNodeId === node.id;

	if (!hasChildren) {
		return (
			<SidebarMenuItem>
				<SidebarMenuButton
					className={cn("gap-1.5", isSelected && "font-medium")}
					isActive={isSelected}
					onClick={() => onSelectNode(node.id)}
				>
					<FileTextIcon />
					{node.title}
				</SidebarMenuButton>

				<DropdownMenu>
					<SidebarMenuAction render={<DropdownMenuTrigger />} showOnHover>
						<MoreHorizontalIcon />
					</SidebarMenuAction>
					<DropdownMenuContent align="start" side="right">
						<DropdownMenuItem onClick={() => setAddChildOpen(true)}>
							<PlusIcon />
							Add child
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={() => setDeleteOpen(true)}
							variant="destructive"
						>
							<Trash2Icon />
							Delete
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>

				<CreateNodeDialog
					isRoot={false}
					onOpenChange={setAddChildOpen}
					open={addChildOpen}
					parentId={node.id}
					workspaceId={workspaceId}
				/>

				<DeleteNodeDialog
					node={node}
					onOpenChange={setDeleteOpen}
					open={deleteOpen}
					workspaceId={workspaceId}
				/>
			</SidebarMenuItem>
		);
	}

	return (
		<SidebarMenuItem>
			<Collapsible className="group/collapsible [&[data-state=open]>button>svg:first-child]:rotate-90">
				<div className="flex w-full items-center">
					<CollapsibleTrigger className="flex size-4 items-center justify-center">
						<ChevronRightIcon className="size-4 transition-transform" />
					</CollapsibleTrigger>
					<SidebarMenuButton
						className={cn("flex-1 gap-1.5", isSelected && "font-medium")}
						isActive={isSelected}
						onClick={() => onSelectNode(node.id)}
					>
						<FolderIcon />
						{node.title}
					</SidebarMenuButton>
				</div>

				<DropdownMenu>
					<SidebarMenuAction render={<DropdownMenuTrigger />} showOnHover>
						<MoreHorizontalIcon />
					</SidebarMenuAction>
					<DropdownMenuContent align="start" side="right">
						<DropdownMenuItem onClick={() => setAddChildOpen(true)}>
							<PlusIcon />
							Add child
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={() => setDeleteOpen(true)}
							variant="destructive"
						>
							<Trash2Icon />
							Delete
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>

				<CollapsibleContent>
					<SidebarMenuSub>
						{node.children.map((child) => (
							<NodeRow
								key={child.id}
								node={child}
								onSelectNode={onSelectNode}
								selectedNodeId={selectedNodeId}
								tree={tree}
								workspaceId={workspaceId}
							/>
						))}
					</SidebarMenuSub>
				</CollapsibleContent>
			</Collapsible>

			<CreateNodeDialog
				isRoot={false}
				onOpenChange={setAddChildOpen}
				open={addChildOpen}
				parentId={node.id}
				workspaceId={workspaceId}
			/>

			<DeleteNodeDialog
				node={node}
				onOpenChange={setDeleteOpen}
				open={deleteOpen}
				workspaceId={workspaceId}
			/>
		</SidebarMenuItem>
	);
}

interface WorkspaceSidebarProps {
	workspaceId: string;
	selectedNodeId: string | null;
	onSelectNode: (nodeId: string) => void;
	workspaceName?: string;
}

export function WorkspaceSidebar({
	workspaceId,
	selectedNodeId,
	onSelectNode,
	workspaceName,
	...props
}: WorkspaceSidebarProps & React.ComponentProps<typeof Sidebar>) {
	const { data: tree, isLoading } = useNodeTree(workspaceId);
	const [createRootOpen, setCreateRootOpen] = useState(false);

	const nodes = tree ?? [];

	return (
		<>
			<Sidebar {...props}>
				<SidebarHeader>
					<Link
						className="flex items-center gap-2 px-2 py-2 transition-opacity hover:opacity-80"
						to="/"
					>
						<BookOpenIcon className="size-5 text-primary" />
						<span className="font-semibold text-base tracking-tight">
							Nexus
						</span>
					</Link>
					<div className="flex items-center gap-2 border-t px-2 py-2">
						<div className="flex flex-1 flex-col gap-0.5">
							<span className="font-semibold text-sm">
								{workspaceName || "Workspace"}
							</span>
							<span className="text-muted-foreground text-xs">
								{nodes.length} {nodes.length === 1 ? "node" : "nodes"}
							</span>
						</div>
					</div>
				</SidebarHeader>

				<SidebarContent>
					<SidebarGroup>
						<SidebarGroupLabel>Nodes</SidebarGroupLabel>
						<SidebarGroupAction
							aria-label="New root node"
							onClick={() => setCreateRootOpen(true)}
							title="New root node"
						>
							<PlusIcon className="size-4" />
						</SidebarGroupAction>

						<SidebarGroupContent>
							{isLoading && (
								<div className="px-2 py-4 text-center text-muted-foreground text-xs">
									Loading nodes…
								</div>
							)}

							{!isLoading && nodes.length === 0 && (
								<div className="flex flex-col items-center gap-3 px-2 py-6 text-center">
									<p className="text-muted-foreground text-xs">No nodes yet</p>
									<Button
										onClick={() => setCreateRootOpen(true)}
										size="sm"
										variant="outline"
									>
										<PlusIcon className="mr-1 size-3" />
										Create node
									</Button>
								</div>
							)}

							{!isLoading && nodes.length > 0 && (
								<SidebarMenu>
									{nodes.map((node) => (
										<NodeRow
											key={node.id}
											node={node}
											onSelectNode={onSelectNode}
											selectedNodeId={selectedNodeId}
											tree={nodes}
											workspaceId={workspaceId}
										/>
									))}
								</SidebarMenu>
							)}
						</SidebarGroupContent>
					</SidebarGroup>
				</SidebarContent>

				<SidebarFooter>
					<SidebarMenu>
						<SidebarMenuItem>
							<div className="flex items-center justify-between gap-2 px-2 py-2">
								<UserMenu />
								<ModeToggle />
							</div>
						</SidebarMenuItem>
					</SidebarMenu>
				</SidebarFooter>

				<SidebarRail />
			</Sidebar>

			<CreateNodeDialog
				isRoot
				onOpenChange={setCreateRootOpen}
				open={createRootOpen}
				workspaceId={workspaceId}
			/>
		</>
	);
}
