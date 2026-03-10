import type { NodeTree } from "@branchbook/types";
import type { UIMessage } from "ai";
import { isReasoningUIPart, isTextUIPart } from "ai";
import {
	Message,
	MessageActions,
	MessageContent,
	MessageResponse,
} from "@/components/ai-elements/message";
import {
	Reasoning,
	ReasoningContent,
	ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import {
	Source,
	Sources,
	SourcesContent,
	SourcesTrigger,
} from "@/components/ai-elements/sources";
import { cn } from "@/lib/utils";
import {
	BranchAction,
	BranchesDropdown,
	ConvertToNoteAction,
	CopyAction,
	SpeakButton,
} from "./chat-message-actions";

export function ChatMessage({
	msg,
	isLastStreaming,
	nodeId,
	workspaceId,
	branches = [],
	tree = [],
}: {
	msg: UIMessage;
	isLastStreaming: boolean;
	nodeId: string;
	workspaceId: string;
	branches?: { id: string; title: string }[];
	tree?: NodeTree[];
}) {
	const textPart = msg.parts.find(isTextUIPart);
	const content = textPart?.text ?? "";

	const reasoningPart = msg.parts.find(isReasoningUIPart);
	const reasoningText = reasoningPart?.text;
	const isReasoningStreaming =
		isLastStreaming && reasoningPart?.state === "streaming";

	const sourceParts = msg.parts.filter(
		(p) => p.type === "source-url"
	) as Array<{
		type: "source-url";
		sourceId: string;
		url: string;
		title?: string;
	}>;

	return (
		<Message from={msg.role} key={msg.id}>
			{reasoningText && msg.role === "assistant" && (
				<Reasoning isStreaming={isReasoningStreaming}>
					<ReasoningTrigger />
					<ReasoningContent>{reasoningText}</ReasoningContent>
				</Reasoning>
			)}

			<MessageContent>
				{msg.role === "assistant" ? (
					<MessageResponse>{content}</MessageResponse>
				) : (
					content
				)}
			</MessageContent>

			{sourceParts.length > 0 && (
				<Sources>
					<SourcesTrigger count={sourceParts.length} />
					<SourcesContent>
						{sourceParts.map((p) => (
							<Source href={p.url} key={p.sourceId} title={p.title ?? p.url} />
						))}
					</SourcesContent>
				</Sources>
			)}

			<MessageActions
				className={cn(
					"flex flex-row items-center justify-between gap-1",
					msg.role === "user" && "justify-end"
				)}
			>
				<div>
					<SpeakButton content={content} />
					<CopyAction content={content} />
				</div>
				{msg.role === "assistant" && (
					<div className="flex flex-row items-center gap-1">
						<ConvertToNoteAction content={content} nodeId={nodeId} />
						<BranchAction
							messageId={msg.id}
							nodeId={nodeId}
							workspaceId={workspaceId}
						/>
						{branches.length > 0 && (
							<BranchesDropdown
								branches={branches}
								tree={tree}
								workspaceId={workspaceId}
							/>
						)}
					</div>
				)}
			</MessageActions>
		</Message>
	);
}
