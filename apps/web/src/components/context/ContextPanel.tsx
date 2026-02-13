import type { GetContextForPanelOutput } from "@nexus/validators";
import {
	AlertCircleIcon,
	ChevronDownIcon,
	ChevronRightIcon,
	GitBranchIcon,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const SUMMARY_TYPE_LABELS: Record<
	GetContextForPanelOutput["ancestry"][number]["summaryTypeUsed"],
	string
> = {
	detailed: "detailed",
	highLevel: "high-level",
	draft: "draft",
};

const SUMMARY_TYPE_VARIANTS: Record<
	GetContextForPanelOutput["ancestry"][number]["summaryTypeUsed"],
	"default" | "secondary" | "outline"
> = {
	detailed: "default",
	highLevel: "secondary",
	draft: "outline",
};

interface ContextPanelProps {
	data: GetContextForPanelOutput;
}

export function ContextPanel({ data }: ContextPanelProps) {
	const [open, setOpen] = useState(false);

	return (
		<Collapsible onOpenChange={setOpen} open={open}>
			<CollapsibleTrigger className="flex w-full items-center gap-2 border-b bg-muted/40 px-4 py-2 text-left text-xs hover:bg-muted/60">
				<GitBranchIcon className="size-3.5 shrink-0 text-muted-foreground" />
				<span className="flex-1 font-medium text-muted-foreground">
					Inherited context
				</span>
				{data.assembledFromDraft && (
					<Badge className="h-4 text-[10px]" variant="outline">
						from draft
					</Badge>
				)}
				{open ? (
					<ChevronDownIcon className="size-3.5 text-muted-foreground" />
				) : (
					<ChevronRightIcon className="size-3.5 text-muted-foreground" />
				)}
			</CollapsibleTrigger>

			<CollapsibleContent className="border-b bg-muted/20">
				<div className="space-y-3 px-4 py-3">
					{data.assembledFromDraft && (
						<div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-amber-800 text-xs dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
							<AlertCircleIcon className="mt-0.5 size-3 shrink-0" />
							<span>
								Context was assembled from a summary draft. It will be upgraded
								automatically when fresh summaries are ready.
							</span>
						</div>
					)}

					{data.ancestry.length > 0 && (
						<div>
							<p className="mb-1.5 font-medium text-[11px] text-muted-foreground uppercase tracking-wide">
								Ancestry
							</p>
							<ol className="space-y-1">
								{data.ancestry.map((entry, i) => (
									<li
										className="flex items-center gap-2 text-xs"
										key={entry.nodeId}
									>
										<span
											className={cn(
												"font-mono text-[10px] text-muted-foreground",
												i === 0 && "font-semibold text-foreground"
											)}
										>
											{i === 0 ? "parent" : `↑ ${i}`}
										</span>
										<span className="flex-1 truncate">{entry.title}</span>
										<Badge
											className="h-4 text-[10px]"
											variant={SUMMARY_TYPE_VARIANTS[entry.summaryTypeUsed]}
										>
											{SUMMARY_TYPE_LABELS[entry.summaryTypeUsed]}
										</Badge>
									</li>
								))}
							</ol>
						</div>
					)}

					{data.lastRawMessagesFromBranchPoint.length > 0 && (
						<div>
							<Separator className="mb-2.5" />
							<p className="mb-1.5 font-medium text-[11px] text-muted-foreground uppercase tracking-wide">
								Last messages at branch point
							</p>
							<ol className="space-y-1.5">
								{data.lastRawMessagesFromBranchPoint.map((msg, i) => (
									// biome-ignore lint/suspicious/noArrayIndexKey: raw messages have no stable id
									<li className="text-xs" key={i}>
										<span className="font-medium text-muted-foreground">
											{msg.role === "USER" ? "You" : "AI"}:{" "}
										</span>
										<span className="line-clamp-2 text-foreground/80">
											{msg.content}
										</span>
									</li>
								))}
							</ol>
						</div>
					)}
				</div>
			</CollapsibleContent>
		</Collapsible>
	);
}
