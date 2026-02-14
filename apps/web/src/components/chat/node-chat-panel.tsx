import { useChat } from "@ai-sdk/react";
import { env } from "@nexus/env/web";
import type { MessageType } from "@nexus/types";
import { useMutation } from "@tanstack/react-query";
import type { UIMessage } from "ai";
import { DefaultChatTransport, isReasoningUIPart, isTextUIPart } from "ai";
import {
	CheckIcon,
	CopyIcon,
	FileTextIcon,
	GitBranchIcon,
	GlobeIcon,
	LightbulbIcon,
	Volume2Icon,
	VolumeXIcon,
} from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	Conversation,
	ConversationContent,
	ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
	Message,
	MessageAction,
	MessageActions,
	MessageContent,
	MessageResponse,
} from "@/components/ai-elements/message";
import {
	PromptInput,
	PromptInputButton,
	PromptInputFooter,
	PromptInputSubmit,
	PromptInputTextarea,
	PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import {
	Reasoning,
	ReasoningContent,
	ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import { Shimmer } from "@/components/ai-elements/shimmer";
import {
	Source,
	Sources,
	SourcesContent,
	SourcesTrigger,
} from "@/components/ai-elements/sources";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import { useListMessages } from "@/hooks/use-messages";
import { useBranchFromMessage, useNodeById } from "@/hooks/use-nodes";
import { cn } from "@/lib/utils";
import { useWorkspaceLayoutStore } from "@/stores/workspace-layout-store";
import { trpc } from "@/utils/trpc";

const CHAT_SUGGESTIONS = [
	"Summarize this topic",
	"What are the key concepts?",
	"Give me related questions to explore",
	"Create a study outline",
];

interface ChatContentProps {
	nodeId: string;
	dbMessages: MessageType[];
	workspaceId: string;
}

interface CopyActionProps {
	content: string;
}

const CopyAction = memo(({ content }: CopyActionProps) => {
	const [copied, setCopied] = useState(false);
	const handleClick = useCallback(() => {
		navigator.clipboard.writeText(content);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	}, [content]);

	return (
		<MessageAction
			label="Copy"
			onClick={handleClick}
			tooltip="Copy to clipboard"
		>
			{copied ? (
				<CheckIcon className="size-3.5" />
			) : (
				<CopyIcon className="size-3.5" />
			)}
		</MessageAction>
	);
});

CopyAction.displayName = "CopyAction";

const ConvertToNoteAction = memo(() => {
	const handleClick = useCallback(() => {
		// TODO: Implement convert to note functionality
	}, []);

	return (
		<MessageAction
			className="flex w-full flex-row items-center gap-1 p-2"
			label="Convert to Note"
			onClick={handleClick}
			tooltip="Convert to Note"
		>
			<FileTextIcon className="size-3.5" />
			<span className="text-xs">Convert to Note</span>
		</MessageAction>
	);
});

ConvertToNoteAction.displayName = "ConvertToNoteAction";

interface BranchActionProps {
	messageId: string;
	nodeId: string;
	workspaceId: string;
}

const BranchAction = memo(
	({ messageId, nodeId, workspaceId }: BranchActionProps) => {
		const setSelectedNodeId = useWorkspaceLayoutStore(
			(s) => s.setSelectedNodeId
		);
		const { mutate, isPending } = useBranchFromMessage(workspaceId);

		const handleClick = useCallback(() => {
			mutate(
				{ nodeId, messageId },
				{ onSuccess: (childNode) => setSelectedNodeId(childNode.id) }
			);
		}, [mutate, nodeId, messageId, setSelectedNodeId]);

		return (
			<MessageAction
				className="flex w-full flex-row items-center gap-1 p-2"
				disabled={isPending}
				label="Branch from here"
				onClick={handleClick}
				tooltip="Branch from here"
			>
				<GitBranchIcon className="size-3.5" />
				<span className="text-xs">Branch</span>
			</MessageAction>
		);
	}
);

BranchAction.displayName = "BranchAction";

function SpeakButton({ content }: { content: string }) {
	const [speaking, setSpeaking] = useState(false);

	const handleSpeak = useCallback(() => {
		if (!("speechSynthesis" in window)) {
			return;
		}

		if (speaking) {
			window.speechSynthesis.cancel();
			setSpeaking(false);
			return;
		}

		const utterance = new SpeechSynthesisUtterance(content);
		utterance.onstart = () => setSpeaking(true);
		utterance.onend = () => setSpeaking(false);
		utterance.onerror = () => setSpeaking(false);
		window.speechSynthesis.speak(utterance);
	}, [content, speaking]);

	useEffect(() => {
		return () => {
			window.speechSynthesis.cancel();
		};
	}, []);

	return (
		<MessageAction
			label={speaking ? "Stop speaking" : "Read aloud"}
			onClick={handleSpeak}
			tooltip={speaking ? "Stop" : "Read aloud"}
		>
			{speaking ? (
				<VolumeXIcon className="size-3.5" />
			) : (
				<Volume2Icon className="size-3.5" />
			)}
		</MessageAction>
	);
}

function ChatMessage({
	msg,
	isLastStreaming,
	nodeId,
	workspaceId,
}: {
	msg: UIMessage;
	isLastStreaming: boolean;
	nodeId: string;
	workspaceId: string;
	// isDbMessage: boolean;
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
						<ConvertToNoteAction />

						<BranchAction
							messageId={msg.id}
							nodeId={nodeId}
							workspaceId={workspaceId}
						/>
					</div>
				)}
			</MessageActions>
		</Message>
	);
}

function ChatContent({ nodeId, dbMessages, workspaceId }: ChatContentProps) {
	// const dbMessageIds = useMemo(
	// 	() => new Set(dbMessages.map((m) => m.id)),
	// 	[dbMessages]
	// );

	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional snapshot — useChat initialises state once at mount
	const initialMessages = useMemo<UIMessage[]>(
		() =>
			dbMessages.map((msg) => {
				const parts: UIMessage["parts"] = [];

				if (msg.role === "ASSISTANT" && msg.reasoning) {
					parts.push({ type: "reasoning", text: msg.reasoning, state: "done" });
				}

				parts.push({ type: "text", text: msg.content });

				if (msg.role === "ASSISTANT" && msg.sources) {
					for (const s of msg.sources) {
						parts.push({
							type: "source-url",
							sourceId: s.sourceId,
							url: s.url,
							title: s.title,
						});
					}
				}

				return {
					id: msg.id,
					role:
						msg.role === "USER" ? ("user" as const) : ("assistant" as const),
					parts,
					metadata: { createdAt: msg.createdAt },
				};
			}),
		[]
	);

	const { mutateAsync: createMessage } = useMutation(
		trpc.message.create.mutationOptions()
	);

	const [thinking, setThinking] = useState(false);
	const [webSearch, setWebSearch] = useState(false);
	const chatOptionsRef = useRef({ thinking: false, webSearch: false });
	chatOptionsRef.current = { thinking, webSearch };

	const transport = useMemo(
		() =>
			new DefaultChatTransport({
				api: `${env.VITE_SERVER_URL}/api/chat`,
				credentials: "include",
				body: () => ({ nodeId, options: chatOptionsRef.current }),
			}),
		[nodeId]
	);

	const { messages, status, sendMessage, error } = useChat({
		messages: initialMessages,
		transport,
	});

	const isStreaming = status === "streaming" || status === "submitted";

	const handleSubmit = async (text: string) => {
		await createMessage({ nodeId, content: text });
		sendMessage({ text });
	};

	return (
		<div className="flex min-h-0 flex-1 flex-col">
			<Conversation>
				<ConversationContent
					className={cn(
						messages.length === 0 &&
							!isStreaming &&
							"min-h-full items-center justify-center"
					)}
				>
					{messages.length === 0 && !isStreaming ? (
						<>
							<div className="space-y-1 text-center">
								<h3 className="font-medium text-sm">Start a conversation</h3>
								<p className="text-muted-foreground text-xs">
									Ask anything about this topic
								</p>
							</div>
							<Suggestions className="mt-2">
								{CHAT_SUGGESTIONS.map((s) => (
									<Suggestion key={s} onClick={handleSubmit} suggestion={s} />
								))}
							</Suggestions>
						</>
					) : (
						<>
							{messages.map((msg, i) => (
								<ChatMessage
									// isDbMessage={dbMessageIds.has(msg.id)}
									isLastStreaming={isStreaming && i === messages.length - 1}
									key={msg.id}
									msg={msg}
									nodeId={nodeId}
									workspaceId={workspaceId}
								/>
							))}
							{status === "submitted" && (
								<Message from="assistant">
									<MessageContent>
										<Shimmer as="span" className="text-sm">
											{webSearch ? "Searching the web…" : "Thinking…"}
										</Shimmer>
									</MessageContent>
								</Message>
							)}
						</>
					)}
				</ConversationContent>
				<ConversationScrollButton />
			</Conversation>

			{error && (
				<div className="flex shrink-0 items-center gap-2 border-t bg-destructive/10 px-3 py-2 text-destructive text-xs">
					<span>Something went wrong. Please try again.</span>
				</div>
			)}

			<div className="shrink-0 border-t bg-background px-3 pt-2 pb-3">
				<PromptInput
					onSubmit={({ text }) => {
						if (text.trim()) {
							handleSubmit(text);
						}
					}}
				>
					<PromptInputTextarea
						className="max-h-32 min-h-10 text-sm"
						disabled={isStreaming}
						maxLength={4000}
						placeholder="Ask a follow up…"
					/>
					<PromptInputFooter className="px-2 pb-1.5">
						<PromptInputTools>
							<PromptInputButton
								className={cn(thinking && "bg-background text-primary")}
								onClick={() => setThinking((v) => !v)}
								tooltip={{
									content: thinking ? "Thinking on" : "Enable thinking",
									side: "top",
								}}
								variant="default"
							>
								<LightbulbIcon className="size-3.5" />
							</PromptInputButton>
							<PromptInputButton
								className={cn(webSearch && "bg-background text-primary")}
								onClick={() => setWebSearch((v) => !v)}
								tooltip={{
									content: webSearch ? "Web search on" : "Enable web search",
									side: "top",
								}}
								variant="default"
							>
								<GlobeIcon className="size-3.5" />
							</PromptInputButton>
						</PromptInputTools>
						<PromptInputSubmit status={status} />
					</PromptInputFooter>
				</PromptInput>
			</div>
		</div>
	);
}

interface NodeChatPanelProps {
	nodeId: string;
}

export function NodeChatPanel({ nodeId }: NodeChatPanelProps) {
	const { data: node } = useNodeById(nodeId);
	const { data: dbMessages, isLoading } = useListMessages(nodeId);

	return (
		<div className="flex h-full flex-col overflow-hidden">
			{isLoading || !dbMessages || !node ? (
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
			) : (
				<ChatContent
					dbMessages={dbMessages}
					key={nodeId}
					nodeId={nodeId}
					workspaceId={node.workspaceId}
				/>
			)}
		</div>
	);
}
