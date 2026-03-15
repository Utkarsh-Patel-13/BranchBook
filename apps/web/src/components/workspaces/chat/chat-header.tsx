import { CheckIcon, ChevronDownIcon, SparklesIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { ChatPreset } from "./chat-models";
import { CHAT_PRESETS, getPresetLabel } from "./chat-models";

export function ChatHeader({
	handlePresetChange,
	handleSummarizeToNote,
	isStreaming,
	messagesLength,
	selectedPreset,
	summarized,
	summarizing,
}: {
	handlePresetChange: (id: string) => void;
	handleSummarizeToNote: () => void;
	isStreaming: boolean;
	messagesLength: number;
	selectedPreset: ChatPreset;
	summarized: boolean;
	summarizing: boolean;
}) {
	const Icon = selectedPreset.icon;
	return (
		<header className="sticky top-0 flex min-h-12 shrink-0 items-center justify-between border-b px-4 py-2">
			<div className="flex items-center gap-2">
				<span className="text-muted-foreground text-xs">Mode</span>
				<DropdownMenu>
					<DropdownMenuTrigger
						disabled={isStreaming}
						render={
							<Button
								aria-label="Response mode"
								className="min-w-0 border-border/60 font-normal"
								size="xs"
								variant="outline"
							>
								<Icon className="size-3.5" />
								{getPresetLabel(selectedPreset.id)}
								<ChevronDownIcon className="size-3.5 opacity-60" />
							</Button>
						}
					/>
					<DropdownMenuContent align="start" className="min-w-48">
						<DropdownMenuRadioGroup
							onValueChange={handlePresetChange}
							value={selectedPreset.id}
						>
							{CHAT_PRESETS.map(
								({ id, label, description, icon: PresetIcon }) => (
									<DropdownMenuRadioItem key={id} value={id}>
										<span className="flex flex-col items-start">
											<div className="flex flex-row items-center gap-1.5">
												<PresetIcon className="size-3.5" />
												{label}
											</div>
											<span className="font-normal text-muted-foreground text-xs">
												{description}
											</span>
										</span>
									</DropdownMenuRadioItem>
								)
							)}
						</DropdownMenuRadioGroup>
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
