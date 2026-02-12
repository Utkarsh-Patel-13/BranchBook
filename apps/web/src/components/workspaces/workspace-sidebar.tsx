import type { NodeTree } from "@nexus/types";
import {
	ChevronRightIcon,
	FileTextIcon,
	FolderIcon,
	MoreHorizontalIcon,
	PlusIcon,
	Trash2Icon,
} from "lucide-react";
import { useState } from "react";
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
	SidebarGroup,
	SidebarGroupAction,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuAction,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarRail,
} from "@/components/ui/sidebar";
import { useNodeTree } from "@/hooks/use-nodes";
import { cn } from "@/lib/utils";

interface NodeRowProps {
	node: NodeTree;
	workspaceId: string;
	selectedNodeId: string | null;
	onSelectNode: (nodeId: string) => void;
}

function NodeRow({
	node,
	workspaceId,
	selectedNodeId,
	onSelectNode,
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
				<SidebarMenuButton
					className={cn("gap-1.5", isSelected && "font-medium")}
					isActive={isSelected}
					onClick={() => onSelectNode(node.id)}
					render={<CollapsibleTrigger />}
				>
					<ChevronRightIcon className="transition-transform" />
					<FolderIcon />
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

				<CollapsibleContent>
					<SidebarMenuSub>
						{node.children.map((child) => (
							<NodeRow
								key={child.id}
								node={child}
								onSelectNode={onSelectNode}
								selectedNodeId={selectedNodeId}
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
}

export function WorkspaceSidebar({
	workspaceId,
	selectedNodeId,
	onSelectNode,
	...props
}: WorkspaceSidebarProps & React.ComponentProps<typeof Sidebar>) {
	const { data: tree, isLoading } = useNodeTree(workspaceId);
	const [createRootOpen, setCreateRootOpen] = useState(false);

	const nodes = tree ?? [];

	return (
		<>
			<Sidebar {...props}>
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
											workspaceId={workspaceId}
										/>
									))}
								</SidebarMenu>
							)}
						</SidebarGroupContent>
					</SidebarGroup>
				</SidebarContent>
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
