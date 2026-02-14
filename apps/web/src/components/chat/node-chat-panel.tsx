import { useChat } from "@ai-sdk/react";
import { env } from "@nexus/env/web";
import type { MessageType, NodeTree } from "@nexus/types";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import type { UIMessage } from "ai";
import { DefaultChatTransport, isReasoningUIPart, isTextUIPart } from "ai";
import {
	CheckIcon,
	ChevronDownIcon,
	CopyIcon,
	FileTextIcon,
	GitBranchIcon,
	GlobeIcon,
	LightbulbIcon,
	Volume2Icon,
	VolumeXIcon,
} from "lucide-react";
import { parse } from "marked";
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
import { CreateNodeDialog } from "@/components/nodes/create-node-dialog";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useListMessages } from "@/hooks/use-messages";
import { useBranchesForNode, useNodeById } from "@/hooks/use-nodes";
import { cn } from "@/lib/utils";
import { buildNodePath } from "@/lib/workspace-navigation";
import { useWorkspaceLayoutStore } from "@/stores/workspace-layout-store";
import { trpc } from "@/utils/trpc";

interface ChatModelItem {
	label: string;
	value: string;
	supportsWeb: boolean;
	supportsThinking: boolean;
}

const CHAT_MODELS: ChatModelItem[] = [
	{
		label: "Gemini 2.0 Flash",
		value: "gemini-2.0-flash",
		supportsWeb: true,
		supportsThinking: true,
	},
	{
		label: "Gemini 2.5 Pro",
		value: "gemini-2.5-pro",
		supportsWeb: true,
		supportsThinking: true,
	},
	{
		label: "Gemini 2.5 Flash Lite",
		value: "gemini-2.5-flash-lite-preview-09-2025",
		supportsWeb: true,
		supportsThinking: true,
	},
	{
		label: "Gemini 2.5 Flash",
		value: "gemini-2.5-flash-preview-09-2025",
		supportsWeb: true,
		supportsThinking: true,
	},
	{
		label: "Gemini 3 Flash",
		value: "gemini-3-flash-preview",
		supportsWeb: true,
		supportsThinking: true,
	},
	{
		label: "Gemini 3 Preview",
		value: "gemini-3-pro-preview",
		supportsWeb: true,
		supportsThinking: true,
	},
];

const DEFAULT_CHAT_MODEL =
	CHAT_MODELS.find(
		(m) => m.value === "gemini-2.5-flash-lite-preview-09-2025"
	) ?? CHAT_MODELS[0];

interface ChatContentProps {
	nodeId: string;
	dbMessages: MessageType[];
	workspaceId: string;
	tree: NodeTree[];
}

interface CopyActionProps {
	content: string;
}

async function copyToClipboard(content: string) {
	const htmlBody = (await parse(content, { gfm: true })) as string;
	const htmlDocument = `<meta charset='utf-8'><html><head></head><body>${htmlBody}</body></html>`;

	await navigator.clipboard.write([
		new ClipboardItem({
			"text/plain": new Blob([content], { type: "text/plain" }),
			"text/html": new Blob([htmlDocument], { type: "text/html" }),
		}),
	]);
}

const CopyAction = memo(({ content }: CopyActionProps) => {
	const [copied, setCopied] = useState(false);
	const handleClick = useCallback(() => {
		copyToClipboard(content);
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
			label="Add to Note"
			onClick={handleClick}
			tooltip="Add to Note"
		>
			<FileTextIcon className="size-3.5" />
			<span className="text-xs">Add to Note</span>
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
		const [branchDialogOpen, setBranchDialogOpen] = useState(false);
		const setSelectedNodeId = useWorkspaceLayoutStore(
			(s) => s.setSelectedNodeId
		);

		const handleBranchCreated = useCallback(
			(node: { id: string }) => {
				setSelectedNodeId(node.id);
			},
			[setSelectedNodeId]
		);

		return (
			<>
				<MessageAction
					className="flex w-full flex-row items-center gap-1 p-2"
					label="Branch from here"
					onClick={() => setBranchDialogOpen(true)}
					tooltip="Branch from here"
				>
					<GitBranchIcon className="size-3.5" />
					<span className="text-xs">Branch</span>
				</MessageAction>
				<CreateNodeDialog
					branch={{ messageId, nodeId }}
					onBranchCreated={handleBranchCreated}
					onOpenChange={setBranchDialogOpen}
					open={branchDialogOpen}
					workspaceId={workspaceId}
				/>
			</>
		);
	}
);

BranchAction.displayName = "BranchAction";

interface BranchesDropdownProps {
	branches: { id: string; title: string }[];
	workspaceId: string;
	tree: NodeTree[];
}

const BranchesDropdown = memo(
	({ branches, workspaceId, tree }: BranchesDropdownProps) => {
		const router = useRouter();

		if (branches.length === 0) {
			return null;
		}

		const handleSelectBranch = (branchId: string) => {
			const path = buildNodePath(tree, branchId);
			if (path) {
				router.navigate({
					to: `/workspaces/${workspaceId}/${path.join("/")}` as never,
				});
			}
		};

		return (
			<DropdownMenu>
				<DropdownMenuTrigger
					render={
						<Button
							aria-label={`${branches.length} branch${branches.length === 1 ? "" : "es"} from this message`}
							className="flex flex-row items-center gap-1 p-2"
							size="icon-sm"
							title={`${branches.length} branch${branches.length === 1 ? "" : "es"} from this message`}
							variant="ghost"
						>
							<ChevronDownIcon className="size-3.5" />
						</Button>
					}
				/>
				<DropdownMenuContent align="end">
					<DropdownMenuItem disabled>Branches</DropdownMenuItem>
					{branches.map((branch) => (
						<DropdownMenuItem
							key={branch.id}
							onClick={() => handleSelectBranch(branch.id)}
						>
							{branch.title}
						</DropdownMenuItem>
					))}
				</DropdownMenuContent>
			</DropdownMenu>
		);
	}
);
BranchesDropdown.displayName = "BranchesDropdown";

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
						<ConvertToNoteAction />
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

function ChatContent({
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

	const { mutateAsync: createMessage } = useMutation(
		trpc.message.create.mutationOptions()
	);

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
						placeholder="Ask me anything ..."
					/>
					<PromptInputFooter className="px-2 pb-1.5">
						<PromptInputTools>
							<Select
								disabled={isStreaming}
								onValueChange={handleModelChange}
								value={selectedModel.value}
							>
								<SelectTrigger className="" size="sm">
									<SelectValue placeholder="Model">
										{selectedModel.label}
									</SelectValue>
								</SelectTrigger>
								<SelectContent>
									{CHAT_MODELS.map((model) => (
										<SelectItem key={model.value} value={model.value}>
											{model.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							{selectedModel.supportsThinking && (
								<PromptInputButton
									aria-pressed={thinking}
									className={cn(
										"rounded-[4px] transition-colors",
										thinking &&
											"border-primary bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
									)}
									onClick={() => setThinking((v) => !v)}
									tooltip={{
										content: thinking ? "Thinking on" : "Enable thinking",
										side: "top",
									}}
									variant="outline"
								>
									<LightbulbIcon className="size-3.5" />
								</PromptInputButton>
							)}
							{selectedModel.supportsWeb && (
								<PromptInputButton
									aria-pressed={webSearch}
									className={cn(
										"rounded-[4px] transition-colors",
										webSearch &&
											"border-primary bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
									)}
									onClick={() => setWebSearch((v) => !v)}
									tooltip={{
										content: webSearch ? "Web search on" : "Enable web search",
										side: "top",
									}}
									variant="outline"
								>
									<GlobeIcon className="size-3.5" />
								</PromptInputButton>
							)}
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
	tree: NodeTree[];
}

export function NodeChatPanel({ nodeId, tree }: NodeChatPanelProps) {
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
					tree={tree}
					workspaceId={node.workspaceId}
				/>
			)}
		</div>
	);
}
