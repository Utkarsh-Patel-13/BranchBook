const features = [
	{
		title: "Split workspace",
		description: "Conversation on the left and notes on the right.",
		icon: (
			<svg
				aria-labelledby="split-workspace-icon-title"
				className=""
				fill="none"
				height="20"
				viewBox="0 0 20 20"
				width="20"
			>
				<title id="split-workspace-icon-title">Split workspace icon</title>
				<rect
					height="18"
					rx="1"
					stroke="currentColor"
					strokeWidth="1.5"
					width="7"
					x="1"
					y="1"
				/>
				<rect
					height="18"
					rx="1"
					stroke="currentColor"
					strokeWidth="1.5"
					width="9"
					x="10"
					y="1"
				/>
			</svg>
		),
	},
	{
		title: "Chat + Notes, side by side",
		description:
			"Every node pairs a running AI conversation with a living note. Talk to think. Summarize to remember.",
		icon: (
			<svg
				aria-labelledby="chat-notes-side-by-side-icon-title"
				className=""
				fill="none"
				height="20"
				viewBox="0 0 20 20"
				width="20"
			>
				<title id="chat-notes-side-by-side-icon-title">
					Chat notes side by side icon
				</title>
				<rect
					height="12"
					rx="1"
					stroke="currentColor"
					strokeWidth="1.5"
					width="18"
					x="1"
					y="1"
				/>
				<line
					stroke="currentColor"
					strokeLinecap="round"
					strokeWidth="1.5"
					x1="3"
					x2="17"
					y1="16"
					y2="16"
				/>
				<line
					stroke="currentColor"
					strokeLinecap="round"
					strokeWidth="1.5"
					x1="3"
					x2="12"
					y1="19"
					y2="19"
				/>
			</svg>
		),
	},
	{
		title: "Branch when it matters",
		description:
			"BranchBook detects when a sub-topic deserves its own space and suggests spinning it off—zero context lost.",
		icon: (
			<svg
				aria-labelledby="branch-when-it-matters-icon-title"
				className=""
				fill="none"
				height="20"
				viewBox="0 0 20 20"
				width="20"
			>
				<title id="branch-when-it-matters-icon-title">
					Branch when it matters icon
				</title>
				<path
					d="M10 2v8M10 10L4 18M10 10l6 8"
					stroke="currentColor"
					strokeLinecap="round"
					strokeWidth="1.5"
				/>
			</svg>
		),
	},
	{
		title: "Smart follow-ups",
		description:
			"After a few turns, see contextual suggestion chips that push the conversation deeper. Dismiss or use them—they never interrupt.",
		icon: (
			<svg
				aria-labelledby="smart-follow-ups-icon-title"
				className=""
				fill="none"
				height="20"
				viewBox="0 0 20 20"
				width="20"
			>
				<title id="smart-follow-ups-icon-title">Smart follow-ups icon</title>
				<circle cx="5" cy="10" r="2" stroke="currentColor" strokeWidth="1.5" />
				<circle cx="10" cy="10" r="2" stroke="currentColor" strokeWidth="1.5" />
				<circle cx="15" cy="10" r="2" stroke="currentColor" strokeWidth="1.5" />
			</svg>
		),
	},
	{
		title: "One-click summaries",
		description:
			"Turn any conversation into structured prose inside the note. Your future self gets clean knowledge, not raw transcripts.",
		icon: (
			<svg
				aria-labelledby="one-click-summaries-icon-title"
				className=""
				fill="none"
				height="20"
				viewBox="0 0 20 20"
				width="20"
			>
				<title id="one-click-summaries-icon-title">
					One-click summaries icon
				</title>
				<path
					d="M3 4h14M3 8h10M3 12h14M3 16h8"
					stroke="currentColor"
					strokeLinecap="round"
					strokeWidth="1.5"
				/>
			</svg>
		),
	},
	{
		title: "Context engine",
		description:
			"Each node carries a running summary of its parent history, so branched conversations always know where they came from.",
		icon: (
			<svg
				aria-labelledby="context-engine-icon-title"
				className=""
				fill="none"
				height="20"
				viewBox="0 0 20 20"
				width="20"
			>
				<title id="context-engine-icon-title">Context engine icon</title>
				<circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
				<circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="1.5" />
			</svg>
		),
	},
];

const Features = () => {
	return (
		<section
			className="mx-auto max-w-7xl bg-background px-6 py-20"
			id="features"
		>
			<div className="mb-12">
				<h2 className="font-bold font-display text-2xl text-foreground tracking-tight">
					Built for how you actually think
				</h2>
				<p className="mt-2 max-w-lg font-body text-muted-foreground text-sm">
					Not another chat wrapper. BranchBook is a workspace designed around
					non-linear exploration.
				</p>
			</div>
			<div className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-2 lg:grid-cols-3">
				{features.map((f) => (
					<div className="bg-background p-6" key={f.title}>
						<div className="mb-3">{f.icon}</div>
						<h3 className="mb-1.5 font-display font-semibold text-foreground text-sm">
							{f.title}
						</h3>
						<p className="font-body text-muted-foreground text-sm leading-relaxed">
							{f.description}
						</p>
					</div>
				))}
			</div>
		</section>
	);
};

export default Features;
