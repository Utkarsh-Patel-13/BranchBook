import { NetworkIcon, PlusIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CreateNodeDialog } from "@/components/workspaces/nodes/create-node-dialog";

interface WorkspaceEmptyViewProps {
	workspaceId: string;
}

export function WorkspaceEmptyView({ workspaceId }: WorkspaceEmptyViewProps) {
	const [createDialogOpen, setCreateDialogOpen] = useState(false);

	return (
		<div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
			<div className="rounded-full bg-muted p-4">
				<NetworkIcon className="size-8 text-muted-foreground" />
			</div>
			<div className="space-y-2">
				<h2 className="font-semibold text-base">No nodes yet</h2>
				<p className="max-w-xs text-muted-foreground text-sm">
					Create your first root node to start organising your workspace and
					begin a conversation.
				</p>
			</div>
			<Button onClick={() => setCreateDialogOpen(true)} size="sm">
				<PlusIcon className="mr-1 size-4" />
				Create first node
			</Button>

			<CreateNodeDialog
				isRoot
				onOpenChange={setCreateDialogOpen}
				open={createDialogOpen}
				workspaceId={workspaceId}
			/>
		</div>
	);
}
