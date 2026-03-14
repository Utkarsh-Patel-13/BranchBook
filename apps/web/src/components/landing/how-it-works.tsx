const steps = [
	{
		num: "1",
		action: "Create a workspace",
		detail: "One per project, subject, or curiosity.",
	},
	{
		num: "2",
		action: "Start a conversation",
		detail: "Pick a node and talk to AI. Switch models anytime.",
	},
	{
		num: "3",
		action: "Branch when it gets deep",
		detail: "Sub-topics get their own nodes. The main thread stays clean.",
	},
	{
		num: "4",
		action: "Summarize into notes",
		detail:
			"One click turns a conversation into structured, exportable knowledge.",
	},
];

const HowItWorks = () => {
	return (
		<section
			className="landing-section-alt mx-auto max-w-7xl px-6 py-20"
			id="how"
		>
			<h2 className="mb-12 font-bold font-display text-2xl text-foreground tracking-tight">
				How it works
			</h2>
			<div className="grid grid-cols-1 gap-6 md:grid-cols-4">
				{steps.map((s) => (
					<div className="relative" key={s.num}>
						<span className="font-bold font-display text-3xl">{s.num}</span>
						<h3 className="mt-1 mb-1.5 font-display font-semibold text-foreground text-sm">
							{s.action}
						</h3>
						<p className="font-body text-muted-foreground text-sm leading-relaxed">
							{s.detail}
						</p>
					</div>
				))}
			</div>
		</section>
	);
};

export default HowItWorks;
