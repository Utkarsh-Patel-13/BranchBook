import { useChat } from "@ai-sdk/react";
import { env } from "@nexus/env/web";
import type { MessageType, NodeTree } from "@nexus/types";
import { isTRPCClientError } from "@trpc/client";
import type { UIMessage } from "ai";
import { DefaultChatTransport } from "ai";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
	Conversation,
	ConversationContent,
	ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { useBranchesForNode } from "@/hooks/use-nodes";
import { useNote, useUpsertNote } from "@/hooks/use-note";
import { cn } from "@/lib/utils";
import { formatTRPCErrorMessage } from "@/utils/trpc";
import { ChatHeader } from "./chat-header";
import { ChatMessage } from "./chat-message";
import {
	CHAT_MODELS,
	type ChatModelItem,
	DEFAULT_CHAT_MODEL,
} from "./chat-models";
import { ChatPromptArea } from "./chat-prompt-area";

export interface ChatContentProps {
	nodeId: string;
	dbMessages: MessageType[];
	workspaceId: string;
	tree: NodeTree[];
}

export function ChatContent({
	nodeId,
	dbMessages,
	workspaceId,
	tree,
}: ChatContentProps) {
	const { data: branchesByMessageId = {} } = useBranchesForNode(nodeId);

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

	const { data: note } = useNote(nodeId);
	const { mutate: upsertNote } = useUpsertNote(nodeId);
	const [summarizing, setSummarizing] = useState(false);
	const [summarized, setSummarized] = useState(false);

	const handleSummarizeToNote = useCallback(async () => {
		setSummarizing(true);
		try {
			const res = await fetch(`${env.VITE_SERVER_URL}/api/chat/summarize`, {
				method: "POST",
				credentials: "include",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ nodeId }),
			});
			if (!res.ok) {
				const data = (await res.json().catch(() => ({}))) as {
					error?: string;
				};
				throw new Error(data.error ?? "Summarization failed");
			}
			const { html } = (await res.json()) as { html: string };
			const current = note?.content ?? "";
			upsertNote(
				{ nodeId, content: current + html },
				{
					onSuccess: () => {
						setSummarized(true);
						setTimeout(() => setSummarized(false), 3000);
					},
				}
			);
		} catch (err) {
			toast.error(
				formatTRPCErrorMessage(
					isTRPCClientError(err) ? err.message : undefined,
					"Failed to summarize chat to note"
				)
			);
		} finally {
			setSummarizing(false);
		}
	}, [nodeId, note?.content, upsertNote]);

	const [selectedModel, setSelectedModel] =
		useState<ChatModelItem>(DEFAULT_CHAT_MODEL);
	const [thinking, setThinking] = useState(false);
	const [webSearch, setWebSearch] = useState(false);
	const chatOptionsRef = useRef({
		model: DEFAULT_CHAT_MODEL.value,
		thinking: false,
		webSearch: false,
	});
	chatOptionsRef.current = {
		model: selectedModel.value,
		thinking,
		webSearch,
	};

	useEffect(() => {
		if (!selectedModel.supportsThinking) {
			setThinking(false);
		}
		if (!selectedModel.supportsWeb) {
			setWebSearch(false);
		}
	}, [selectedModel]);

	const handleModelChange = useCallback((value: string | null) => {
		if (!value) {
			return;
		}
		const model = CHAT_MODELS.find((m) => m.value === value);
		if (model) {
			setSelectedModel(model);
		}
	}, []);

	const transport = useMemo(
		() =>
			new DefaultChatTransport({
				api: `${env.VITE_SERVER_URL}/api/chat`,
				credentials: "include",
				prepareSendMessagesRequest: ({ messages, id }) => ({
					body: {
						message: messages.at(-1),
						id: id ?? nodeId,
						options: chatOptionsRef.current,
					},
				}),
			}),
		[nodeId]
	);

	const { messages, status, sendMessage, error } = useChat({
		id: nodeId,
		messages: initialMessages,
		transport,
	});

	const isStreaming = status === "streaming" || status === "submitted";

	const handleSubmit = useCallback(
		(text: string) => {
			sendMessage({ text });
		},
		[sendMessage]
	);

	const showEmptyState = messages.length === 0 && !isStreaming;

	return (
		<div className="flex min-h-0 flex-1 flex-col">
			<ChatHeader
				handleModelChange={handleModelChange}
				handleSummarizeToNote={handleSummarizeToNote}
				isStreaming={isStreaming}
				messagesLength={messages.length}
				selectedModel={selectedModel}
				summarized={summarized}
				summarizing={summarizing}
			/>
			<Conversation>
				<ConversationContent
					className={cn(
						showEmptyState && "min-h-full items-center justify-center"
					)}
				>
					{showEmptyState ? (
						<div className="space-y-1 text-center">
							<h3 className="font-medium text-sm">Start a conversation</h3>
							<p className="text-muted-foreground text-xs">
								Ask anything about this topic
							</p>
						</div>
					) : (
						<>
							{messages.map((msg, i) => (
								<ChatMessage
									branches={branchesByMessageId[msg.id] ?? []}
									isLastStreaming={isStreaming && i === messages.length - 1}
									key={msg.id}
									msg={msg}
									nodeId={nodeId}
									tree={tree}
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

			<ChatPromptArea
				handleSubmit={handleSubmit}
				isStreaming={isStreaming}
				selectedModel={selectedModel}
				setThinking={setThinking}
				setWebSearch={setWebSearch}
				status={status}
				thinking={thinking}
				webSearch={webSearch}
			/>
		</div>
	);
}
