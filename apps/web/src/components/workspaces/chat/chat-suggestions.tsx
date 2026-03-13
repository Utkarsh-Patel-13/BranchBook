import type { BranchSuggestion, SuggestionSet } from "@branchbook/types";
import { GitBranchIcon, XIcon } from "lucide-react";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface ChatSuggestionsProps {
	suggestions: SuggestionSet | null;
	onFollowUp: (text: string) => void;
	onBranch: (branch: BranchSuggestion) => void;
	onContinueHere: (text: string) => void;
	onDismiss: () => void;
	isLoading: boolean;
}

export function ChatSuggestions({
	suggestions,
	onFollowUp,
	onBranch,
	onContinueHere,
	onDismiss,
	isLoading,
}: ChatSuggestionsProps) {
	if (isLoading) {
		return (
			<output
				aria-label="Loading suggestions"
				className="flex items-center gap-2 px-1 py-2"
			>
				<Skeleton className="h-7 w-24 rounded-full" />
				<Skeleton className="h-7 w-32 rounded-full" />
				<Skeleton className="h-7 w-20 rounded-full" />
			</output>
		);
	}

	const hasFollowUps = suggestions && suggestions.followUps.length > 0;
	const branch = suggestions?.branchSuggestion ?? null;

	if (!(hasFollowUps || branch)) {
		return null;
	}

	return (
		<div className="relative space-y-2 py-2">
			<Button
				aria-label="Dismiss suggestions"
				className="absolute top-2 right-0 size-6"
				onClick={onDismiss}
				size="icon"
				type="button"
				variant="ghost"
			>
				<XIcon className="size-3" />
			</Button>

			{hasFollowUps && (
				<Suggestions>
					{suggestions.followUps.map((text) => (
						<Suggestion key={text} onClick={onFollowUp} suggestion={text} />
					))}
				</Suggestions>
			)}

			{branch && (
				<div className="flex items-start gap-3 rounded-lg border bg-muted/40 p-3">
					<GitBranchIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
					<div className="min-w-0 flex-1 space-y-2">
						<p className="font-medium text-sm leading-tight">{branch.label}</p>
						<div className="flex flex-wrap gap-2">
							<Button
								className="h-7 gap-1.5 rounded-full text-xs"
								onClick={() => onBranch(branch)}
								size="sm"
								type="button"
								variant="default"
							>
								<GitBranchIcon className="size-3" />
								Explore in new branch
							</Button>
							<Button
								className="h-7 rounded-full text-xs"
								onClick={() => onContinueHere(branch.contextSeed)}
								size="sm"
								type="button"
								variant="outline"
							>
								Continue here
							</Button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

export type { ChatSuggestionsProps };
