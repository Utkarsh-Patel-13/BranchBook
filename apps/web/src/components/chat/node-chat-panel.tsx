import { useChat } from "@ai-sdk/react";
import { env } from "@nexus/env/web";
import type { MessageType } from "@nexus/types";
import { useMutation } from "@tanstack/react-query";
import type { UIMessage } from "ai";
import { DefaultChatTransport } from "ai";
import { formatDistanceToNow } from "date-fns";
import {
	CheckIcon,
	CopyIcon,
	MessageSquareIcon,
	RefreshCwIcon,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import {
	Conversation,
	ConversationContent,
	ConversationEmptyState,
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
	PromptInputFooter,
	PromptInputSubmit,
	PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { useListMessages } from "@/hooks/use-messages";
import { useNodeById } from "@/hooks/use-nodes";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";

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

function ChatContent({ nodeId, dbMessages }: ChatContentProps) {
	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional snapshot — useChat initialises state once at mount
	const initialMessages = useMemo<UIMessage[]>(
		() =>
			dbMessages.map((msg) => ({
				id: msg.id,
				role: msg.role === "USER" ? ("user" as const) : ("assistant" as const),
				parts: [{ type: "text" as const, text: msg.content }],
				metadata: { createdAt: msg.createdAt },
			})),
		[]
	);

	const { mutateAsync: createMessage } = useMutation(
		trpc.message.create.mutationOptions()
	);

	const { messages, status, sendMessage, error } = useChat({
		messages: initialMessages,
		transport: new DefaultChatTransport({
			api: `${env.VITE_SERVER_URL}/api/chat`,
			body: { nodeId },
			credentials: "include",
		}),
	});

	const isStreaming = status === "streaming" || status === "submitted";

	const handleSubmit = async (text: string) => {
		await createMessage({ nodeId, content: text });
		sendMessage({ text });
	};

	return (
		<div className="flex min-h-0 flex-1 flex-col">
			<Conversation>
				{messages.length === 0 && !isStreaming ? (
					<ConversationEmptyState
						description="Ask anything about this topic"
						title="Start a conversation"
					/>
				) : (
					<ConversationContent>
						{messages.map((msg) => {
							const textPart = msg.parts.find((p) => p.type === "text");
							const content =
								textPart && "text" in textPart ? textPart.text : "";
							const meta = msg.metadata as
								| { createdAt?: Date | string }
								| undefined;
							const createdAt = meta?.createdAt
								? formatDistanceToNow(new Date(meta.createdAt), {
										addSuffix: true,
									})
								: undefined;

							return (
								<Message from={msg.role} key={msg.id}>
									<MessageContent>
										<MessageResponse>{content}</MessageResponse>
									</MessageContent>
									<MessageActions
										className={cn(
											"flex flex-row items-center gap-2",
											msg.role === "user" ? "justify-end" : "justify-start"
										)}
									>
										<CopyButton content={content} />
										{createdAt && (
											<span className="text-muted-foreground text-xs">
												{createdAt}
											</span>
										)}
									</MessageActions>
								</Message>
							);
						})}
						{isStreaming && (
							<Message from="assistant">
								<MessageContent>
									<Shimmer as="span" className="text-sm">
										Thinking…
									</Shimmer>
								</MessageContent>
							</Message>
						)}
					</ConversationContent>
				)}
				<ConversationScrollButton />
			</Conversation>

			{error && (
				<div className="flex shrink-0 items-center gap-2 border-t bg-destructive/10 px-3 py-2 text-destructive text-xs">
					<RefreshCwIcon className="size-3 shrink-0" />
					<span>Something went wrong. Please try again.</span>
				</div>
			)}

			<PromptInput
				className="shrink-0 rounded-none border-0 border-t shadow-none"
				onSubmit={({ text }) => {
					if (text.trim()) {
						handleSubmit(text);
					}
				}}
			>
				<PromptInputTextarea
					className="max-h-32 min-h-10 px-3 py-2 text-sm"
					disabled={isStreaming}
					maxLength={4000}
					placeholder="Ask anything…"
				/>
				<PromptInputFooter className="px-2 pb-2">
					<div />
					<PromptInputSubmit status={status} />
				</PromptInputFooter>
			</PromptInput>
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
				<ChatContent dbMessages={dbMessages} nodeId={nodeId} />
			)}
		</div>
	);
}
