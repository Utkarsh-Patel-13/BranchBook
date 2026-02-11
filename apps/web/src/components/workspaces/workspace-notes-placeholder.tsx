import { NotebookIcon } from "lucide-react";

export function WorkspaceNotesPlaceholder() {
	return (
		<div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
			<div className="rounded-full bg-muted p-3">
				<NotebookIcon className="size-6 text-muted-foreground" />
			</div>
			<div className="space-y-1">
				<h3 className="font-medium text-sm">Notes coming soon</h3>
				<p className="text-muted-foreground text-xs">
					Node notes will appear here in a future update.
				</p>
			</div>
		</div>
	);
}
