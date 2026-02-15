import type { NodeTree } from "@nexus/types";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { useListMessages } from "@/hooks/use-messages";
import { useNodeById } from "@/hooks/use-nodes";
import { ChatContent } from "./chat-content";

interface NodeChatPanelProps {
	nodeId: string;
	tree: NodeTree[];
}

export function NodeChatPanel({ nodeId, tree }: NodeChatPanelProps) {
	const { data: node } = useNodeById(nodeId);
	const { data: dbMessages, isLoading } = useListMessages(nodeId);

	if (isLoading || !dbMessages || !node) {
		return (
			<div className="flex flex-1 flex-col gap-6 p-4">
				<div className="ml-auto flex max-w-[60%] flex-col gap-2">
					<Shimmer as="span" className="h-4 text-sm">
						Loading message history…
					</Shimmer>
				</div>
				<div className="flex max-w-[75%] flex-col gap-2">
					<Shimmer as="span" className="h-4 text-sm">
						Loading message history…
					</Shimmer>
				</div>
				<div className="ml-auto flex max-w-[50%] flex-col gap-2">
					<Shimmer as="span" className="h-4 text-sm">
						Loading…
					</Shimmer>
				</div>
			</div>
		);
	}

	return (
		<div className="flex h-full flex-col overflow-hidden">
			<ChatContent
				dbMessages={dbMessages}
				key={nodeId}
				nodeId={nodeId}
				tree={tree}
				workspaceId={node.workspaceId}
			/>
		</div>
	);
}
