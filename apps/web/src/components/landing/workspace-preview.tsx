import { Button } from "../ui/button";

const WorkspacePreview = () => {
	return (
		<section className="landing-section-alt mt-12 w-full py-16 pb-20 md:col-span-2 md:py-0 md:pb-0">
			<div className="overflow-hidden rounded-lg border border-border bg-background shadow-sm">
				{/* Window chrome */}
				<div className="flex items-center gap-1.5 border-border border-b bg-muted/50 px-4 py-2.5">
					<div className="h-2.5 w-2.5 rounded-full bg-border" />
					<div className="h-2.5 w-2.5 rounded-full bg-border" />
					<div className="h-2.5 w-2.5 rounded-full bg-border" />
					<span className="ml-3 font-display text-muted-foreground text-xs">
						Research Project — BranchBook
					</span>
				</div>

				<div className="flex min-h-[340px] md:min-h-[400px]">
					{/* Node tree sidebar */}
					<div className="hidden w-40 border-border border-r bg-muted/30 p-4 md:block">
						<p className="mb-3 font-display text-[10px] text-muted-foreground uppercase tracking-wider">
							Node tree
						</p>
						<div className="space-y-0.5 font-display text-xs">
							<div className="flex items-center gap-2 rounded bg-accent/10 px-2 py-1.5 font-medium">
								<svg
									aria-labelledby="quantum-computing-icon-title"
									fill="none"
									height="12"
									viewBox="0 0 12 12"
									width="12"
								>
									<title id="quantum-computing-icon-title">
										Quantum computing icon
									</title>
									<circle
										cx="6"
										cy="6"
										r="4"
										stroke="currentColor"
										strokeWidth="1.2"
									/>
								</svg>
								Quantum computing
							</div>
							<div className="space-y-0.5 pl-5">
								<div className="flex items-center gap-2 px-2 py-1.5">
									<svg
										aria-labelledby="qubit-types-icon-title"
										fill="none"
										height="10"
										viewBox="0 0 10 10"
										width="10"
									>
										<title id="qubit-types-icon-title">Qubit types icon</title>
										<circle
											cx="5"
											cy="5"
											r="3"
											stroke="currentColor"
											strokeWidth="1"
										/>
									</svg>
									Qubit types
								</div>
								<div className="flex items-center gap-2 px-2 py-1.5 text-muted-foreground">
									<svg
										aria-labelledby="surface-codes-icon-title"
										fill="none"
										height="10"
										viewBox="0 0 10 10"
										width="10"
									>
										<title id="surface-codes-icon-title">
											Surface codes icon
										</title>
										<circle
											cx="5"
											cy="5"
											r="3"
											stroke="currentColor"
											strokeWidth="1"
										/>
									</svg>
									Surface codes
								</div>
							</div>
							<div className="flex items-center gap-2 px-2 py-1.5 text-muted-foreground">
								<svg
									aria-labelledby="error-correction-icon-title"
									fill="none"
									height="12"
									viewBox="0 0 12 12"
									width="12"
								>
									<title id="error-correction-icon-title">
										Error correction icon
									</title>
									<circle
										cx="6"
										cy="6"
										r="4"
										stroke="currentColor"
										strokeWidth="1.2"
									/>
								</svg>
								Error correction
							</div>
							<div className="flex items-center gap-2 px-2 py-1.5 text-muted-foreground">
								<svg
									aria-labelledby="applications-timeline-icon-title"
									fill="none"
									height="12"
									viewBox="0 0 12 12"
									width="12"
								>
									<title id="applications-timeline-icon-title">
										Applications timeline icon
									</title>
									<circle
										cx="6"
										cy="6"
										r="4"
										stroke="currentColor"
										strokeWidth="1.2"
									/>
								</svg>
								Applications timeline
							</div>
						</div>
					</div>

					{/* Main content: chat + note */}
					<div className="flex flex-1">
						{/* Chat area */}
						<div className="flex flex-1 flex-col">
							<div className="flex items-center justify-between border-border border-b px-4 py-2">
								<div className="flex items-center gap-2">
									<span className="font-display font-medium text-foreground text-xs">
										Quantum computing
									</span>
									<span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
										Deep
									</span>
								</div>
								<Button
									className="rounded border border-accent px-2 py-1 font-display font-medium text-[10px]"
									size="xs"
									type="button"
								>
									Summarize to note
								</Button>
							</div>
							<div className="flex-1 space-y-3 overflow-hidden p-4">
								<div className="flex justify-end">
									<div className="max-w-[75%] rounded-lg bg-muted px-3 py-2 font-body text-foreground text-xs">
										What are the main types of qubits used today?
									</div>
								</div>
								<div className="flex justify-start">
									<div className="max-w-[80%] rounded-lg border border-border px-3 py-2 font-body text-foreground text-xs leading-relaxed">
										The three main types are superconducting qubits, trapped ion
										qubits, and photonic qubits. Each has trade-offs in
										coherence time, gate speed, and scalability…
									</div>
								</div>
								{/* Suggestion chips */}
								<div className="flex items-center gap-2 pt-1">
									<span className="cursor-pointer rounded-full border border-accent/30 px-2.5 py-1 font-display text-[10px] transition-colors hover:bg-accent/5">
										Compare coherence times
									</span>
									<span className="cursor-pointer rounded-full border border-accent/30 px-2.5 py-1 font-display text-[10px] transition-colors hover:bg-accent/5">
										Which is most scalable?
									</span>
								</div>
								{/* Branch suggestion */}
								<div className="flex items-center gap-2 rounded border border-accent/20 bg-primary/5 px-3 py-2 text-[10px]">
									<svg
										aria-labelledby="branch-suggestion-icon-title"
										className="shrink-0"
										fill="none"
										height="12"
										viewBox="0 0 12 12"
										width="12"
									>
										<title id="branch-suggestion-icon-title">
											Branch suggestion icon
										</title>
										<path
											d="M6 1v4M6 5L3 9M6 5l3 4"
											stroke="currentColor"
											strokeLinecap="round"
											strokeWidth="1.2"
										/>
									</svg>
									<span className="font-display">
										<span className="font-medium text-foreground">
											Superconducting vs trapped ion
										</span>
									</span>
									<span className="ml-auto cursor-pointer font-display font-medium">
										Branch →
									</span>
								</div>
							</div>
							{/* Input area */}
							<div className="border-border border-t p-3">
								<div className="flex items-center gap-2 rounded-md border border-border px-3 py-2">
									<span className="flex-1 font-body text-muted-foreground text-xs">
										Ask anything…
									</span>
									<div className="flex items-center gap-1.5">
										<span className="rounded bg-muted px-1.5 py-0.5 font-display text-[9px] text-muted-foreground">
											Think
										</span>
										<span className="rounded bg-muted px-1.5 py-0.5 font-display text-[9px] text-muted-foreground">
											Web
										</span>
									</div>
								</div>
							</div>
						</div>

						{/* Note panel */}
						<div className="hidden flex-1 border-border border-l bg-muted/20 p-4 lg:block">
							<div className="mb-3 flex items-center justify-between">
								<p className="font-display text-[10px] text-muted-foreground uppercase tracking-wider">
									Note
								</p>
								<span className="rounded bg-muted px-1.5 py-0.5 font-display text-[9px] text-muted-foreground">
									Edit
								</span>
							</div>
							<div className="space-y-2 font-body text-[11px] text-muted-foreground leading-relaxed">
								<p className="font-semibold text-foreground text-xs">
									Quantum Computing Overview
								</p>
								<p>
									Three main qubit architectures dominate current research, each
									with distinct advantages.
									<br />
									The most scalable architecture is the superconducting qubit.
								</p>
								<br />
								<table className="mt-2 w-full border-collapse overflow-hidden rounded bg-background text-left shadow-sm">
									<thead>
										<tr className="border-border border-b bg-muted/40">
											<th className="px-2 py-1 font-display font-medium text-[10px] text-muted-foreground uppercase tracking-wider">
												Qubit Type
											</th>
											<th className="px-2 py-1 font-display font-medium text-[10px] text-muted-foreground uppercase tracking-wider">
												Coherence Time
											</th>
											<th className="px-2 py-1 font-display font-medium text-[10px] text-muted-foreground uppercase tracking-wider">
												Scalability
											</th>
										</tr>
									</thead>
									<tbody>
										<tr className="border-border border-b">
											<td className="px-2 py-1 font-body text-foreground text-xs">
												Superconducting
											</td>
											<td className="px-2 py-1 font-body text-xs">Short</td>
											<td className="px-2 py-1 font-body text-xs">High</td>
										</tr>
										<tr className="border-border border-b">
											<td className="px-2 py-1 font-body text-foreground text-xs">
												Trapped Ion
											</td>
											<td className="px-2 py-1 font-body text-xs">Long</td>
											<td className="px-2 py-1 font-body text-xs">Medium</td>
										</tr>
										<tr>
											<td className="px-2 py-1 font-body text-foreground text-xs">
												Topological
											</td>
											<td className="px-2 py-1 font-body text-xs">Very Long</td>
											<td className="px-2 py-1 font-body text-xs">
												Potentially Very High
											</td>
										</tr>
									</tbody>
								</table>
							</div>
						</div>
					</div>
				</div>
			</div>
			<p className="mt-3 text-center text-muted-foreground text-xs">
				A workspace with branching conversations and living notes
			</p>
		</section>
	);
};

export default WorkspacePreview;
