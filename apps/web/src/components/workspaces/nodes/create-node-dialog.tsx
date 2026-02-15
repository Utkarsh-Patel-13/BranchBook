import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
	useBranchFromMessage,
	useCreateNode,
	useUpdateNode,
} from "../../../hooks/use-nodes";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "../../ui/alert-dialog";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";

function validateTitle(value: string): string | null {
	if (value.trim().length < 3) {
		return "Title must be at least 3 characters";
	}
	if (value.trim().length > 100) {
		return "Title must be at most 100 characters";
	}
	return null;
}

function getDialogTitle(
	isEdit: boolean,
	isRoot: boolean,
	isBranch: boolean
): string {
	if (isBranch) {
		return "Create Branch";
	}
	if (isEdit) {
		return "Edit Node";
	}
	if (isRoot) {
		return "Create Root Node";
	}
	return "Add Child Node";
}

function getDialogDescription(
	isEdit: boolean,
	isRoot: boolean,
	isBranch: boolean
): string {
	if (isBranch) {
		return "Give a title to the new branch.";
	}
	if (isEdit) {
		return "Update the node title.";
	}
	if (isRoot) {
		return "Create a new root node in your workspace.";
	}
	return "Add a child node to the selected parent.";
}

function getSubmitLabel(
	isEdit: boolean,
	isBranch: boolean,
	createPending: boolean,
	updatePending: boolean,
	branchPending: boolean
): string {
	if (isBranch) {
		return branchPending ? "Creating..." : "Create branch";
	}
	if (isEdit) {
		return updatePending ? "Saving..." : "Save";
	}
	return createPending ? "Creating..." : "Create";
}

interface CreateNodeDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	workspaceId: string;
	parentId?: string | null;
	isRoot?: boolean;
	/** When set, dialog is in edit mode with pre-filled title */
	edit?: { nodeId: string; title: string };
	/** When set, dialog creates a branch from message; title is required */
	branch?: { nodeId: string; messageId: string };
	/** Called when branch is created (with new node id) */
	onBranchCreated?: (node: { id: string }) => void;
}

export function CreateNodeDialog({
	open,
	onOpenChange,
	workspaceId,
	parentId = null,
	isRoot = true,
	edit,
	branch,
	onBranchCreated,
}: CreateNodeDialogProps) {
	const [title, setTitle] = useState("");
	const [titleError, setTitleError] = useState<string | null>(null);
	const createNode = useCreateNode(workspaceId);
	const updateNode = useUpdateNode(workspaceId);
	const branchFromMessage = useBranchFromMessage(workspaceId);

	const isEdit = Boolean(edit);
	const isBranch = Boolean(branch);

	useEffect(() => {
		if (open) {
			setTitle(edit?.title ?? "");
			setTitleError(null);
		}
	}, [open, edit?.title]);

	const handleSubmit = async () => {
		const error = validateTitle(title);
		if (error) {
			setTitleError(error);
			return;
		}

		try {
			if (isBranch && branch) {
				const childNode = await branchFromMessage.mutateAsync({
					nodeId: branch.nodeId,
					messageId: branch.messageId,
					title: title.trim(),
				});
				onBranchCreated?.(childNode);
				toast.success("Branch created successfully");
			} else if (isEdit && edit) {
				await updateNode.mutateAsync({
					nodeId: edit.nodeId,
					title: title.trim(),
				});
				toast.success("Node updated successfully");
			} else {
				await createNode.mutateAsync({
					workspaceId,
					title: title.trim(),
					parentId,
				});
				toast.success(
					isRoot
						? "Root node created successfully"
						: "Child node created successfully"
				);
			}
			setTitle("");
			setTitleError(null);
			onOpenChange(false);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Failed to save node");
		}
	};

	const handleCancel = () => {
		setTitle("");
		setTitleError(null);
		onOpenChange(false);
	};

	return (
		<AlertDialog onOpenChange={onOpenChange} open={open}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>
						{getDialogTitle(isEdit, isRoot, isBranch)}
					</AlertDialogTitle>
					<AlertDialogDescription>
						{getDialogDescription(isEdit, isRoot, isBranch)}
					</AlertDialogDescription>
				</AlertDialogHeader>

				<div className="space-y-2">
					<Label htmlFor="node-title">Title</Label>
					<Input
						autoFocus
						id="node-title"
						onChange={(e) => {
							setTitle(e.target.value);
							if (titleError) {
								setTitleError(null);
							}
						}}
						onKeyDown={(e) => {
							if (e.key === "Enter") {
								handleSubmit();
							}
						}}
						placeholder="Enter node title (3-100 characters)"
						value={title}
					/>
					{titleError && (
						<p className="text-destructive text-sm">{titleError}</p>
					)}
				</div>

				<AlertDialogFooter>
					<AlertDialogCancel onClick={handleCancel}>Cancel</AlertDialogCancel>
					<AlertDialogAction
						disabled={
							createNode.isPending ||
							updateNode.isPending ||
							branchFromMessage.isPending
						}
						onClick={handleSubmit}
					>
						{getSubmitLabel(
							isEdit,
							isBranch,
							createNode.isPending,
							updateNode.isPending,
							branchFromMessage.isPending
						)}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
