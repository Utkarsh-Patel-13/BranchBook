import type { NodeTree } from "@branchbook/types";
import { Link } from "@tanstack/react-router";
import {
	ChevronRightIcon,
	MinusIcon,
	MoreHorizontalIcon,
	Pencil,
	PlusIcon,
	SearchIcon,
	Trash2Icon,
} from "lucide-react";
import { motion } from "motion/react";
import type * as React from "react";
import { Fragment, memo, useMemo, useState } from "react";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuItem,
	SidebarRail,
} from "@/components/ui/sidebar";
import UserMenu from "@/components/user-menu";
import { CreateNodeDialog } from "@/components/workspaces/nodes/create-node-dialog";
import { DeleteNodeDialog } from "@/components/workspaces/nodes/delete-node-dialog";
import { cn } from "@/lib/utils";
import { Separator } from "../ui/separator";

function filterTree(nodes: NodeTree[], query: string): NodeTree[] {
	const q = query.trim().toLowerCase();
	if (!q) {
		return nodes;
	}

	return nodes
		.map((node) => {
			const matchesSelf = node.title.toLowerCase().includes(q);
			const filteredChildren = filterTree(node.children, query);
			const matchesChild = filteredChildren.length > 0;
			if (!(matchesSelf || matchesChild)) {
				return null;
			}
			return {
				...node,
				children: matchesSelf ? node.children : filteredChildren,
			};
		})
		.filter((n): n is NodeTree => n !== null);
}

interface NodeRowProps {
	node: NodeTree;
	workspaceId: string;
	selectedNodeId: string | null;
	onSelectNode: (nodeId: string) => void;
}

const NodeRow = memo(function NodeRow({
	node,
	workspaceId,
	selectedNodeId,
	onSelectNode,
}: NodeRowProps) {
	const [addChildOpen, setAddChildOpen] = useState(false);
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [editNode, setEditNode] = useState<{
		nodeId: string;
		title: string;
	} | null>(null);
	const [open, setOpen] = useState(true);

	const hasChildren = node.children.length > 0;
	const isSelected = selectedNodeId === node.id;

	const row = (
		<ButtonGroup
			className={cn(
				"group/node row relative w-full min-w-0 flex-1 rounded-lg [&:hover_.row-actions]:opacity-100 [&_.row-actions]:opacity-0",
				isSelected && "bg-primary/10 text-sidebar-foreground dark:bg-primary/15"
			)}
		>
			{hasChildren ? (
				<Button
					aria-label={open ? "Collapse" : "Expand"}
					className={cn(
						"shrink-0 cursor-pointer transition-colors",
						!isSelected && "hover:bg-sidebar-accent/50"
					)}
					onClick={() => setOpen((prev) => !prev)}
					size="icon-sm"
					variant="ghost"
				>
					<ChevronRightIcon
						className={cn(
							"size-4 shrink-0 transition-transform",
							open && "rotate-90"
						)}
					/>
				</Button>
			) : (
				<span
					aria-hidden
					className="flex size-7 shrink-0 items-center justify-center text-muted-foreground text-xs"
				>
					<MinusIcon className="size-4" />
				</span>
			)}
			<Button
				className={cn(
					"flex h-auto min-w-0 flex-1 cursor-pointer items-center justify-start gap-1.5 truncate rounded-none border-0 px-1 py-0.5 text-left text-sm transition-colors",
					!isSelected && "hover:bg-sidebar-accent/50",
					isSelected && "font-semibold"
				)}
				onClick={() => {
					if (selectedNodeId !== node.id) {
						onSelectNode(node.id);
					}
				}}
				size="sm"
				variant="ghost"
			>
				{node.title}
			</Button>

			<DropdownMenu>
				<DropdownMenuTrigger
					render={
						<Button
							aria-label="Node options"
							className="row-actions size-6 cursor-pointer rounded"
							onClick={(e) => e.stopPropagation()}
							size="icon"
							variant="ghost"
						>
							<MoreHorizontalIcon className="size-4" />
						</Button>
					}
				/>
				<DropdownMenuContent align="start" side="right">
					<DropdownMenuItem
						onClick={() => {
							setEditNode(null);
							setAddChildOpen(true);
						}}
					>
						<PlusIcon className="size-4" />
						Add child
					</DropdownMenuItem>
					<DropdownMenuItem
						onClick={() => {
							setEditNode({ nodeId: node.id, title: node.title });
							setAddChildOpen(true);
						}}
					>
						<Pencil className="size-4" />
						Edit
					</DropdownMenuItem>
					<DropdownMenuItem
						onClick={() => setDeleteOpen(true)}
						variant="destructive"
					>
						<Trash2Icon className="size-4" />
						Delete
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
			<CreateNodeDialog
				edit={editNode ?? undefined}
				isRoot={false}
				onOpenChange={(open) => {
					setAddChildOpen(open);
					if (!open) {
						setEditNode(null);
					}
				}}
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
		</ButtonGroup>
	);

	if (!hasChildren) {
		return <div className="relative flex min-w-0 items-center">{row}</div>;
	}

	return (
		<Collapsible
			className="relative mt-0.5 first:mt-0"
			onOpenChange={setOpen}
			open={open}
		>
			<div className="relative flex min-w-0 items-center">{row}</div>
			<CollapsibleContent>
				<motion.div
					animate={{ opacity: 1 }}
					className="relative ml-2 border-sidebar-border border-l"
					initial={{ opacity: 0 }}
					transition={{ duration: 0.15, ease: "easeOut" }}
				>
					{node.children.map((child) => (
						<NodeRow
							key={child.id}
							node={child}
							onSelectNode={onSelectNode}
							selectedNodeId={selectedNodeId}
							workspaceId={workspaceId}
						/>
					))}
				</motion.div>
			</CollapsibleContent>
		</Collapsible>
	);
});

interface WorkspaceSidebarProps {
	workspaceId: string;
	selectedNodeId: string | null;
	onSelectNode: (nodeId: string) => void;
	tree: NodeTree[];
	workspaceName?: string;
}

export function WorkspaceSidebar({
	workspaceId,
	selectedNodeId,
	onSelectNode,
	tree,
	workspaceName,
	...props
}: WorkspaceSidebarProps & React.ComponentProps<typeof Sidebar>) {
	const [createRootOpen, setCreateRootOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");

	const filteredNodes = useMemo(
		() => filterTree(tree, searchQuery),
		[tree, searchQuery]
	);

	return (
		<>
			<Sidebar {...props}>
				<SidebarHeader>
					<Link
						className="flex items-center gap-2 px-2 py-2 transition-opacity hover:opacity-80"
						to="/workspaces"
					>
						<svg
							aria-labelledby="branchbook-logo-title"
							fill="none"
							height="20"
							role="img"
							viewBox="0 0 20 20"
							width="20"
						>
							<title id="branchbook-logo-title">BranchBook Logo</title>
							<circle
								cx="10"
								cy="4"
								r="2.5"
								stroke="currentColor"
								strokeWidth="1.5"
							/>
							<circle
								cx="5"
								cy="16"
								r="2.5"
								stroke="currentColor"
								strokeWidth="1.5"
							/>
							<circle
								cx="15"
								cy="16"
								r="2.5"
								stroke="currentColor"
								strokeWidth="1.5"
							/>
							<line
								stroke="currentColor"
								strokeWidth="1.5"
								x1="10"
								x2="5"
								y1="6.5"
								y2="13.5"
							/>
							<line
								stroke="currentColor"
								strokeWidth="1.5"
								x1="10"
								x2="15"
								y1="6.5"
								y2="13.5"
							/>
						</svg>
						<span className="font-semibold text-base tracking-tight">
							BranchBook
						</span>
					</Link>
					<div className="flex items-center gap-2 border-t px-2 py-2">
						<div className="flex flex-1 flex-col gap-0.5">
							<span className="font-semibold text-sm">
								{workspaceName || "Workspace"}
							</span>
							<span className="text-muted-foreground text-xs">
								{tree.length} {tree.length === 1 ? "node" : "nodes"}
							</span>
						</div>
					</div>
				</SidebarHeader>

				<SidebarContent>
					<div className="flex flex-1 flex-col overflow-hidden">
						<div className="border-sidebar-border border-b bg-sidebar px-3 py-2">
							<div className="relative">
								<SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
								<Input
									className="h-8 pl-8"
									onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
										setSearchQuery(e.target.value)
									}
									placeholder="Search nodes..."
									type="search"
									value={searchQuery}
								/>
							</div>
						</div>
						<div className="flex flex-1 flex-col overflow-y-auto p-2">
							<div className="flex items-center justify-between px-3 py-2 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
								<span>Workspace</span>
								<Button
									aria-label="New root node"
									className="size-7 rounded-full p-0"
									onClick={() => setCreateRootOpen(true)}
									size="icon"
									title="New root node"
									variant="ghost"
								>
									<PlusIcon className="size-4" />
								</Button>
							</div>
							{filteredNodes.length === 0 && (
								<motion.div
									animate={{ opacity: 1, y: 0 }}
									className="flex flex-col items-center gap-3 px-3 py-6 text-center"
									initial={{ opacity: 0, y: 6 }}
									transition={{ duration: 0.2, ease: "easeOut" }}
								>
									<p className="text-muted-foreground text-xs">
										{tree.length === 0
											? "No nodes yet"
											: "No nodes match your search"}
									</p>
									{tree.length === 0 && (
										<Button
											onClick={() => setCreateRootOpen(true)}
											size="sm"
											variant="outline"
										>
											<PlusIcon className="mr-1 size-3" />
											Create node
										</Button>
									)}
								</motion.div>
							)}
							{filteredNodes.length > 0 && (
								<motion.div
									animate="visible"
									className="min-w-0 flex-1 space-y-4"
									initial="hidden"
									variants={{
										hidden: {},
										visible: {
											transition: {
												staggerChildren: 0.03,
												delayChildren: 0.02,
											},
										},
									}}
								>
									{filteredNodes.map((node, index) => (
										<Fragment key={node.id}>
											<motion.div
												variants={{
													hidden: { opacity: 0, x: -6 },
													visible: {
														opacity: 1,
														x: 0,
														transition: {
															duration: 0.2,
															ease: "easeOut",
														},
													},
												}}
											>
												<NodeRow
													node={node}
													onSelectNode={onSelectNode}
													selectedNodeId={selectedNodeId}
													workspaceId={workspaceId}
												/>
											</motion.div>
											{index < filteredNodes.length - 1 && (
												<Separator className="my-2" />
											)}
										</Fragment>
									))}
								</motion.div>
							)}
						</div>
					</div>
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
