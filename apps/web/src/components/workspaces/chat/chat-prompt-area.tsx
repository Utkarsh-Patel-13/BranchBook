import type { useChat } from "@ai-sdk/react";
import { CheckIcon, GlobeIcon, PlusIcon } from "lucide-react";
import {
	PromptInput,
	PromptInputButton,
	PromptInputFooter,
	PromptInputSubmit,
	PromptInputTextarea,
	PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ChatPromptArea({
	handleSubmit,
	isStreaming,
	setWebSearch,
	status,
	webSearch,
}: {
	handleSubmit: (text: string) => void;
	isStreaming: boolean;
	setWebSearch: (fn: (v: boolean) => boolean) => void;
	status: ReturnType<typeof useChat>["status"];
	webSearch: boolean;
}) {
	return (
		<div className="shrink-0 border-t bg-background px-4 pt-4 pb-6">
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
					<PromptInputTools className="flex-1 flex-wrap gap-1.5">
						{webSearch && (
							<Button
								aria-label="Remove Web search"
								className="gap-1.5 rounded-full"
								onClick={() => setWebSearch(() => false)}
								size="xs"
								type="button"
								variant="outline"
							>
								<GlobeIcon className="size-3.5" />
								Web search
							</Button>
						)}
						<DropdownMenu>
							<DropdownMenuTrigger
								render={
									<PromptInputButton
										aria-label="Add option"
										size="icon-sm"
										variant="ghost"
									>
										<PlusIcon className="size-4" />
									</PromptInputButton>
								}
							/>
							<DropdownMenuContent align="start" className="min-w-48">
								<DropdownMenuItem
									onClick={() => setWebSearch((v) => !v)}
									onSelect={(e) => e.preventDefault()}
								>
									<GlobeIcon className="size-4" />
									Web search
									{webSearch && (
										<CheckIcon className="ml-auto size-4 text-primary" />
									)}
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</PromptInputTools>
					<PromptInputSubmit
						className="transition-transform hover:scale-105 active:scale-95"
						status={status}
					/>
				</PromptInputFooter>
			</PromptInput>
		</div>
	);
}
