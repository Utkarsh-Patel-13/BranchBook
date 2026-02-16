import {
	CheckIcon,
	ChevronDownIcon,
	GlobeIcon,
	SparklesIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuPortal,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { ChatModelItem } from "./chat-models";
import { CHAT_MODELS, CHAT_MODES, getModeLabel } from "./chat-models";

export function ChatHeader({
	handleModelChange,
	handleSummarizeToNote,
	isStreaming,
	messagesLength,
	selectedModel,
	summarized,
	summarizing,
}: {
	handleModelChange: (value: string | null) => void;
	handleSummarizeToNote: () => void;
	isStreaming: boolean;
	messagesLength: number;
	selectedModel: ChatModelItem;
	summarized: boolean;
	summarizing: boolean;
}) {
	return (
		<header className="sticky top-0 flex min-h-12 shrink-0 items-center justify-between border-b px-4 py-2">
			<div className="flex items-center gap-2">
				<span className="text-muted-foreground text-xs">Mode</span>
				<DropdownMenu>
					<DropdownMenuTrigger
						disabled={isStreaming}
						render={
							<Button
								aria-label="Chat mode"
								className="min-w-0 border-border/60 font-normal"
								size="xs"
								variant="outline"
							>
								{getModeLabel(selectedModel.value)}
								<ChevronDownIcon className="size-3.5 opacity-60" />
							</Button>
						}
					/>
					<DropdownMenuContent align="start" className="min-w-48">
						<DropdownMenuGroup>
							<DropdownMenuRadioGroup
								onValueChange={(value) => handleModelChange(value)}
								value={selectedModel.value}
							>
								{CHAT_MODES.map(({ label, value, icon: Icon }) => (
									<DropdownMenuRadioItem key={value} value={value}>
										<Icon className="size-3.5" />
										{label}
									</DropdownMenuRadioItem>
								))}
							</DropdownMenuRadioGroup>
						</DropdownMenuGroup>
						<DropdownMenuSeparator />
						<DropdownMenuSub>
							<DropdownMenuSubTrigger>
								<GlobeIcon className="size-3.5" />
								Google
							</DropdownMenuSubTrigger>
							<DropdownMenuPortal>
								<DropdownMenuSubContent>
									{CHAT_MODELS.map((model) => (
										<DropdownMenuItem
											key={model.value}
											onClick={() => handleModelChange(model.value)}
										>
											{model.label}
										</DropdownMenuItem>
									))}
								</DropdownMenuSubContent>
							</DropdownMenuPortal>
						</DropdownMenuSub>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
			<Button
				aria-label={summarized ? "Added to note" : "Summarize chat to note"}
				className={cn(
					"flex flex-row items-center gap-1.5",
					summarized &&
						"border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
				)}
				disabled={messagesLength === 0 || isStreaming || summarizing}
				onClick={handleSummarizeToNote}
				size="xs"
				title="Summarize whole chat into note as study notes"
				variant={summarized ? "ghost" : "default"}
			>
				{summarized ? (
					<CheckIcon className="size-3.5" />
				) : (
					<SparklesIcon className="size-3.5" />
				)}
				<span className="text-xs">
					{summarized ? "Added to note" : "Summarize to note"}
				</span>
			</Button>
		</header>
	);
}
