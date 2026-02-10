import { useState } from "react";
import { toast } from "sonner";
import { useCreateNode } from "../../hooks/use-nodes";
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
import { Input } from "../ui/input";
import { Label } from "../ui/label";

function validateTitle(value: string): string | null {
	if (value.trim().length < 3) {
		return "Title must be at least 3 characters";
	}
	if (value.trim().length > 100) {
		return "Title must be at most 100 characters";
	}
	return null;
}

interface CreateNodeDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	workspaceId: string;
	parentId?: string | null;
	isRoot?: boolean;
}

export function CreateNodeDialog({
	open,
	onOpenChange,
	workspaceId,
	parentId = null,
	isRoot = true,
}: CreateNodeDialogProps) {
	const [title, setTitle] = useState("");
	const [titleError, setTitleError] = useState<string | null>(null);
	const createNode = useCreateNode(workspaceId);

	const handleSubmit = async () => {
		const error = validateTitle(title);
		if (error) {
			setTitleError(error);
			return;
		}

		try {
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
			setTitle("");
			setTitleError(null);
			onOpenChange(false);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Failed to create node");
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
						{isRoot ? "Create Root Node" : "Add Child Node"}
					</AlertDialogTitle>
					<AlertDialogDescription>
						{isRoot
							? "Create a new root node in your workspace."
							: "Add a child node to the selected parent."}
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
						disabled={createNode.isPending}
						onClick={handleSubmit}
					>
						{createNode.isPending ? "Creating..." : "Create"}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
