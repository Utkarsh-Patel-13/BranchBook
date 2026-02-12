import type { NodeTree } from "@nexus/types";
import {
	ChevronRightIcon,
	FileTextIcon,
	FolderIcon,
	FolderOpenIcon,
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
	SidebarGroup,
	SidebarGroupAction,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
} from "@/components/ui/sidebar";
import { useNodeTree } from "@/hooks/use-nodes";
import { cn } from "@/lib/utils";

interface NodeRowProps {
	node: NodeTree;
	workspaceId: string;
	selectedNodeId: string | null;
	onSelectNode: (nodeId: string) => void;
	depth: number;
}

function NodeRow({
	node,
	workspaceId,
	selectedNodeId,
	onSelectNode,
	depth,
}: NodeRowProps) {
	const [open, setOpen] = useState(false);
	const [addChildOpen, setAddChildOpen] = useState(false);
	const [deleteOpen, setDeleteOpen] = useState(false);

	const hasChildren = node.children.length > 0;
	const isSelected = selectedNodeId === node.id;

	let NodeIcon = FileTextIcon;
	if (hasChildren) {
		NodeIcon = open ? FolderOpenIcon : FolderIcon;
	}

	return (
		<>
			<Collapsible onOpenChange={setOpen} open={open}>
				<SidebarMenuItem>
					<div className="group/row flex items-center">
						<CollapsibleTrigger
							aria-label={open ? "Collapse" : "Expand"}
							className={cn(
								"flex size-4 shrink-0 items-center justify-center rounded text-muted-foreground transition-transform",
								!hasChildren && "pointer-events-none opacity-0",
								open && "rotate-90"
							)}
						>
							<ChevronRightIcon className="size-3" />
						</CollapsibleTrigger>

						<SidebarMenuButton
							className={cn(
								"flex-1 gap-1.5",
								isSelected && "bg-sidebar-accent font-medium"
							)}
							onClick={() => onSelectNode(node.id)}
						>
							<NodeIcon
								className={cn(
									"size-3.5 shrink-0",
									hasChildren
										? "text-muted-foreground"
										: "text-muted-foreground/60"
								)}
							/>
							<span className="truncate text-sm">{node.title}</span>
						</SidebarMenuButton>

						<div className="flex shrink-0 items-center opacity-0 transition-opacity group-hover/row:opacity-100">
							<button
								aria-label="Add child node"
								className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
								onClick={() => setAddChildOpen(true)}
								type="button"
							>
								<PlusIcon className="size-3" />
							</button>
							<button
								aria-label="Delete node"
								className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
								onClick={() => setDeleteOpen(true)}
								type="button"
							>
								<Trash2Icon className="size-3" />
							</button>
						</div>
					</div>

					{hasChildren && (
						<CollapsibleContent>
							<SidebarMenuSub>
								{node.children.map((child) => (
									<NodeRow
										depth={depth + 1}
										key={child.id}
										node={child}
										onSelectNode={onSelectNode}
										selectedNodeId={selectedNodeId}
										workspaceId={workspaceId}
									/>
								))}
							</SidebarMenuSub>
						</CollapsibleContent>
					)}
				</SidebarMenuItem>
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
		</>
	);
}

interface WorkspaceNodeTreeProps {
	workspaceId: string;
	selectedNodeId: string | null;
	onSelectNode: (nodeId: string) => void;
}

export function WorkspaceNodeTree({
	workspaceId,
	selectedNodeId,
	onSelectNode,
}: WorkspaceNodeTreeProps) {
	const { data: tree, isLoading } = useNodeTree(workspaceId);
	const [createRootOpen, setCreateRootOpen] = useState(false);

	const nodes = tree ?? [];

	return (
		<>
			<SidebarGroup className="group-data-[collapsible=icon]:hidden">
				<SidebarGroupLabel>Nodes</SidebarGroupLabel>
				<SidebarGroupAction
					aria-label="New root node"
					onClick={() => setCreateRootOpen(true)}
					title="New root node"
				>
					<PlusIcon className="size-4" />
				</SidebarGroupAction>

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
								depth={0}
								key={node.id}
								node={node}
								onSelectNode={onSelectNode}
								selectedNodeId={selectedNodeId}
								workspaceId={workspaceId}
							/>
						))}
					</SidebarMenu>
				)}
			</SidebarGroup>

			<CreateNodeDialog
				isRoot
				onOpenChange={setCreateRootOpen}
				open={createRootOpen}
				workspaceId={workspaceId}
			/>
		</>
	);
}
