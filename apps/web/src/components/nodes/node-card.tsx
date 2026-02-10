import type { NodeTree } from "@nexus/types";
import { Handle, Position } from "@xyflow/react";
import { Plus, Trash2 } from "lucide-react";
import { memo, useState } from "react";
import { toast } from "sonner";
import { useUpdateNode } from "../../hooks/use-nodes";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Input } from "../ui/input";
import { DeleteNodeDialog } from "./delete-node-dialog";

interface NodeCardProps {
	data: {
		node: NodeTree;
		isRoot: boolean;
		childCount: number;
		workspaceId: string;
		onAddChild: (parentId: string) => void;
	};
	selected?: boolean;
}

export const NodeCard = memo(({ data, selected }: NodeCardProps) => {
	const { node, isRoot, childCount, workspaceId, onAddChild } = data;
	const [isEditing, setIsEditing] = useState(false);
	const [editTitle, setEditTitle] = useState(node.title);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const updateNode = useUpdateNode(workspaceId);

	const handleTitleClick = () => {
		setIsEditing(true);
		setEditTitle(node.title);
	};

	const handleTitleSave = async () => {
		const trimmed = editTitle.trim();

		if (trimmed.length < 3) {
			toast.error("Title must be at least 3 characters");
			setEditTitle(node.title);
			setIsEditing(false);
			return;
		}

		if (trimmed.length > 100) {
			toast.error("Title must be at most 100 characters");
			setEditTitle(node.title);
			setIsEditing(false);
			return;
		}

		if (trimmed === node.title) {
			setIsEditing(false);
			return;
		}

		try {
			await updateNode.mutateAsync({
				nodeId: node.id,
				title: trimmed,
			});
			toast.success("Node updated");
			setIsEditing(false);
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to update title"
			);
			setEditTitle(node.title);
			setIsEditing(false);
		}
	};

	const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") {
			handleTitleSave();
		} else if (e.key === "Escape") {
			setEditTitle(node.title);
			setIsEditing(false);
		}
	};

	return (
		<div className="relative">
			{!isRoot && (
				<Handle
					className="!bg-primary !border-primary"
					position={Position.Top}
					type="target"
				/>
			)}

			<Card
				className={`min-w-[200px] max-w-[300px] transition-all ${
					selected ? "ring-2 ring-primary" : ""
				}`}
			>
				<CardHeader>
					<div className="flex items-center justify-between gap-2">
						{isEditing ? (
							<Input
								autoFocus
								className="h-auto px-0 py-0 font-medium text-sm"
								onBlur={handleTitleSave}
								onChange={(e) => setEditTitle(e.target.value)}
								onClick={(e) => e.stopPropagation()}
								onKeyDown={handleTitleKeyDown}
								value={editTitle}
							/>
						) : (
							<button
								className="min-w-0 flex-1 cursor-text truncate bg-transparent p-0 text-left font-medium text-sm"
								onClick={(e) => {
									e.stopPropagation();
									handleTitleClick();
								}}
								type="button"
							>
								{node.title}
							</button>
						)}
						{isRoot && (
							<span className="shrink-0 rounded-none bg-primary px-1.5 py-0.5 font-medium text-primary-foreground text-xs">
								Root
							</span>
						)}
					</div>
				</CardHeader>

				<CardContent>
					<div className="flex items-center justify-between gap-2">
						{childCount > 0 && (
							<span className="text-muted-foreground text-xs">
								{childCount} {childCount === 1 ? "child" : "children"}
							</span>
						)}
						<div className="ml-auto flex items-center gap-1">
							<Button
								onClick={(e) => {
									e.stopPropagation();
									onAddChild(node.id);
								}}
								size="xs"
								variant="outline"
							>
								<Plus className="size-3" />
								Add Child
							</Button>
							<Button
								className="text-destructive hover:text-destructive"
								onClick={(e) => {
									e.stopPropagation();
									setDeleteDialogOpen(true);
								}}
								size="xs"
								variant="ghost"
							>
								<Trash2 className="size-3" />
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>

			{childCount > 0 && (
				<Handle
					className="!bg-primary !border-primary"
					position={Position.Bottom}
					type="source"
				/>
			)}

			<DeleteNodeDialog
				node={node}
				onOpenChange={setDeleteDialogOpen}
				open={deleteDialogOpen}
				workspaceId={workspaceId}
			/>
		</div>
	);
});

NodeCard.displayName = "NodeCard";
