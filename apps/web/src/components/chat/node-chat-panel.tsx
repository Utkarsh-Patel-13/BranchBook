import { useChat } from "@ai-sdk/react";
import { env } from "@nexus/env/web";
import type { MessageType } from "@nexus/types";
import { useMutation } from "@tanstack/react-query";
import type { UIMessage } from "ai";
import { DefaultChatTransport, isReasoningUIPart, isTextUIPart } from "ai";
import { formatDistanceToNow } from "date-fns";
import {
	BookmarkIcon,
	CheckIcon,
	CopyIcon,
	GitBranchIcon,
	GlobeIcon,
	LightbulbIcon,
	MessageSquareIcon,
	Volume2Icon,
	VolumeXIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { useNodeById } from "@/hooks/use-nodes";
import { cn } from "@/lib/utils";
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
}

function CopyButton({ content }: { content: string }) {
	const [copied, setCopied] = useState(false);

	const handleCopy = useCallback(() => {
		navigator.clipboard.writeText(content);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	}, [content]);

	return (
		<MessageAction
			label={copied ? "Copied" : "Copy"}
			onClick={handleCopy}
			tooltip={copied ? "Copied!" : "Copy message"}
		>
			{copied ? (
				<CheckIcon className="size-3.5" />
			) : (
				<CopyIcon className="size-3.5" />
			)}
		</MessageAction>
	);
}

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
}: {
	msg: UIMessage;
	isLastStreaming: boolean;
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

	const meta = msg.metadata as { createdAt?: Date | string } | undefined;
	const createdAt = meta?.createdAt
		? formatDistanceToNow(new Date(meta.createdAt), { addSuffix: true })
		: undefined;

	return (
		<Message from={msg.role} key={msg.id}>
			{reasoningText && msg.role === "assistant" && (
				<Reasoning isStreaming={isReasoningStreaming}>
					<ReasoningTrigger />
					<ReasoningContent>{reasoningText}</ReasoningContent>
				</Reasoning>
			)}

			<MessageContent>
				<MessageResponse>{content}</MessageResponse>
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

			{msg.role === "assistant" ? (
				<div className="mt-1 flex items-center gap-3 border-t pt-3">
					<button
						className="group flex items-center gap-1.5 font-medium text-muted-foreground text-xs transition-colors hover:text-primary"
						type="button"
					>
						<BookmarkIcon className="size-3.5 shrink-0" />
						<span className="underline decoration-transparent underline-offset-4 transition-all group-hover:decoration-primary">
							Convert to Note
						</span>
					</button>
					<button
						className="group flex items-center gap-1.5 font-medium text-muted-foreground text-xs transition-colors hover:text-primary"
						type="button"
					>
						<GitBranchIcon className="size-3.5 shrink-0" />
						<span className="underline decoration-transparent underline-offset-4 transition-all group-hover:decoration-primary">
							Create Sub-topic
						</span>
					</button>
					<div className="ml-auto flex items-center gap-1">
						<SpeakButton content={content} />
						<CopyButton content={content} />
						{createdAt && (
							<span className="text-muted-foreground text-xs">{createdAt}</span>
						)}
					</div>
				</div>
			) : (
				<MessageActions className="flex flex-row items-center justify-end gap-1">
					<CopyButton content={content} />
					{createdAt && (
						<span className="text-muted-foreground text-xs">{createdAt}</span>
					)}
				</MessageActions>
			)}
		</Message>
	);
}

function ChatContent({ nodeId, dbMessages }: ChatContentProps) {
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
									isLastStreaming={isStreaming && i === messages.length - 1}
									key={msg.id}
									msg={msg}
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
								className={cn(thinking && "bg-primary/10 text-primary")}
								onClick={() => setThinking((v) => !v)}
								tooltip={{
									content: thinking ? "Thinking on" : "Enable thinking",
									side: "top",
								}}
							>
								<LightbulbIcon className="size-3.5" />
							</PromptInputButton>
							<PromptInputButton
								className={cn(webSearch && "bg-primary/10 text-primary")}
								onClick={() => setWebSearch((v) => !v)}
								tooltip={{
									content: webSearch ? "Web search on" : "Enable web search",
									side: "top",
								}}
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
			<div className="flex shrink-0 items-center gap-2 border-b px-3 py-2">
				<MessageSquareIcon className="size-3.5 shrink-0 text-muted-foreground" />
				<h3 className="truncate font-medium text-sm">
					{node?.title ?? "Chat"}
				</h3>
			</div>

			{isLoading || !dbMessages ? (
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
				<ChatContent dbMessages={dbMessages} key={nodeId} nodeId={nodeId} />
			)}
		</div>
	);
}
