import type { GetContextForPanelOutput } from "@branchbook/validators";
import { GitBranchIcon } from "lucide-react";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { useContextForPanel, useNodeArtifact } from "@/hooks/use-nodes";
import { useWorkspaceLayoutStore } from "@/stores/workspace-layout-store";

interface ContextModalProps {
	nodeId: string;
}

export function ContextModal({ nodeId }: ContextModalProps) {
	const { contextModalOpen, setContextModalOpen } = useWorkspaceLayoutStore();
	const { data: artifact } = useNodeArtifact(nodeId);
	const { data: contextData } = useContextForPanel(nodeId);

	const isLoading = artifact === undefined && contextData === undefined;
	const hasNoContent = artifact === null && contextData === null;

	const ancestryOldestFirst = contextData?.ancestry
		? [...contextData.ancestry].reverse()
		: [];

	return (
		<Dialog onOpenChange={setContextModalOpen} open={contextModalOpen}>
			<DialogContent className="max-h-[85vh] w-full overflow-y-auto sm:w-fit sm:max-w-2xl">
				<DialogHeader>
					<DialogTitle>Node Context</DialogTitle>
					{artifact?.shortTitle && (
						<DialogDescription>{artifact.shortTitle}</DialogDescription>
					)}
				</DialogHeader>

				{isLoading && (
					<div className="py-6 text-center text-muted-foreground text-sm">
						Loading context...
					</div>
				)}

				{hasNoContent && (
					<div className="py-6 text-center text-muted-foreground text-sm">
						No context available for this node.
					</div>
				)}

				{(artifact || contextData) && (
					<div className="space-y-4">
						{/* Topics */}
						{artifact && artifact.keyTopics.length > 0 && (
							<div className="flex flex-wrap gap-1.5">
								{artifact.keyTopics.map((topic) => (
									<Badge className="text-xs" key={topic} variant="secondary">
										{topic}
									</Badge>
								))}
							</div>
						)}

						{/* Summary */}
						{artifact?.narrativeSummary && (
							<p className="text-muted-foreground text-sm leading-relaxed">
								{artifact.narrativeSummary}
							</p>
						)}

						{/* Key decisions */}
						{artifact && artifact.keyDecisions.length > 0 && (
							<ul className="space-y-1 text-muted-foreground text-sm">
								{artifact.keyDecisions.map((decision, i) => (
									// biome-ignore lint/suspicious/noArrayIndexKey: decisions have no stable id
									<li className="flex items-start gap-1.5" key={i}>
										<span className="mt-1.5 size-1 shrink-0 rounded-full bg-muted-foreground" />
										<span>{decision}</span>
									</li>
								))}
							</ul>
						)}

						<Accordion className="space-y-1">
							{/* Ancestry / context chain */}
							{contextData && ancestryOldestFirst.length > 0 && (
								<AccordionItem
									className="rounded-md border px-3"
									value="ancestry"
								>
									<AccordionTrigger className="py-2 text-sm hover:no-underline">
										<div className="flex items-center gap-2">
											<GitBranchIcon className="size-3.5 text-muted-foreground" />
											<span>
												Context chain
												<span className="ml-1.5 text-muted-foreground text-xs">
													({ancestryOldestFirst.length} node
													{ancestryOldestFirst.length !== 1 ? "s" : ""})
												</span>
											</span>
										</div>
									</AccordionTrigger>
									<AccordionContent className="pb-3">
										<AncestryChain ancestry={ancestryOldestFirst} />
									</AccordionContent>
								</AccordionItem>
							)}

							{/* Last messages at branch point */}
							{contextData &&
								contextData.lastRawMessagesFromBranchPoint.length > 0 && (
									<AccordionItem
										className="rounded-md border px-3"
										value="messages"
									>
										<AccordionTrigger className="py-2 text-sm hover:no-underline">
											Messages at branch point
										</AccordionTrigger>
										<AccordionContent className="pb-3">
											<ol className="space-y-2">
												{contextData.lastRawMessagesFromBranchPoint.map(
													(msg, i) => (
														// biome-ignore lint/suspicious/noArrayIndexKey: raw messages have no stable id
														<li className="text-xs" key={i}>
															<span className="font-medium text-muted-foreground">
																{msg.role === "USER" ? "You" : "AI"}:{" "}
															</span>
															<span className="line-clamp-3 text-foreground/80">
																{msg.content}
															</span>
														</li>
													)
												)}
											</ol>
										</AccordionContent>
									</AccordionItem>
								)}
						</Accordion>
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}

type AncestryEntry = GetContextForPanelOutput["ancestry"][number];

function AncestryChain({ ancestry }: { ancestry: AncestryEntry[] }) {
	return (
		<ol className="space-y-2">
			{ancestry.map((entry, i) => {
				const isLast = i === ancestry.length - 1;
				return (
					<li className="flex gap-2.5" key={entry.nodeId}>
						{/* Connector line */}
						<div className="flex flex-col items-center">
							<div
								className={`mt-1 size-1.5 shrink-0 rounded-full ${isLast ? "bg-foreground" : "bg-muted-foreground/50"}`}
							/>
							{!isLast && <div className="mt-1 w-px flex-1 bg-border" />}
						</div>

						<div className="min-w-0 flex-1 pb-2">
							<p
								className={`truncate font-medium text-xs leading-tight ${isLast ? "text-foreground" : "text-muted-foreground"}`}
							>
								{entry.shortTitle ?? entry.nodeTitle}
							</p>
							{entry.keyTopics.length > 0 && (
								<div className="mt-1 flex flex-wrap gap-1">
									{entry.keyTopics.slice(0, 4).map((topic) => (
										<Badge
											className="h-3.5 px-1 text-[9px]"
											key={topic}
											variant="outline"
										>
											{topic}
										</Badge>
									))}
								</div>
							)}
						</div>
					</li>
				);
			})}
		</ol>
	);
}
