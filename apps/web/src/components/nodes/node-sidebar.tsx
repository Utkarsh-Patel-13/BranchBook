import { X } from "lucide-react";
import { NodeChatPanel } from "../chat/node-chat-panel";
import { Button } from "../ui/button";

interface NodeSidebarProps {
	nodeId: string;
	nodeTitle: string;
	onClose: () => void;
}

export function NodeSidebar({ nodeId, nodeTitle, onClose }: NodeSidebarProps) {
	return (
		<div className="flex h-full flex-col border-l">
			<div className="flex shrink-0 items-center justify-between border-b p-4">
				<h2 className="truncate font-semibold text-base" title={nodeTitle}>
					{nodeTitle}
				</h2>
				<Button onClick={onClose} size="xs" variant="ghost">
					<X className="size-3.5" />
				</Button>
			</div>

			<div className="min-h-0 flex-1 overflow-hidden">
				<NodeChatPanel nodeId={nodeId} />
			</div>
		</div>
	);
}
