import type { NodeTree } from "@nexus/types";
import { toast } from "sonner";
import { useDeleteNode } from "../../hooks/use-nodes";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "../ui/alert-dialog";

function countDescendants(node: NodeTree): number {
	let count = 0;
	for (const child of node.children) {
		count += 1 + countDescendants(child);
	}
	return count;
}

interface DeleteNodeDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	node: NodeTree;
	workspaceId: string;
	onDeleted?: () => void;
}

export function DeleteNodeDialog({
	open,
	onOpenChange,
	node,
	workspaceId,
	onDeleted,
}: DeleteNodeDialogProps) {
	const deleteNode = useDeleteNode(workspaceId);
	const descendantCount = countDescendants(node);
	const totalCount = 1 + descendantCount;

	const handleConfirm = async () => {
		try {
			await deleteNode.mutateAsync({ nodeId: node.id });
			toast.success(
				totalCount === 1 ? "Node deleted" : `Deleted ${totalCount} nodes`
			);
			onOpenChange(false);
			onDeleted?.();
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to delete node"
			);
		}
	};

	return (
		<AlertDialog onOpenChange={onOpenChange} open={open}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Delete node?</AlertDialogTitle>
					<AlertDialogDescription>
						{descendantCount > 0
							? `This will permanently delete "${node.title}" and all ${descendantCount} of its descendant${descendantCount === 1 ? "" : "s"} (${totalCount} nodes total). This action cannot be undone.`
							: `This will permanently delete "${node.title}". This action cannot be undone.`}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel onClick={() => onOpenChange(false)}>
						Cancel
					</AlertDialogCancel>
					<AlertDialogAction
						className="bg-destructive text-white/90 hover:bg-destructive/90"
						disabled={deleteNode.isPending}
						onClick={handleConfirm}
					>
						{deleteNode.isPending ? "Deleting…" : "Delete"}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
