const DemoVideo = () => {
	return (
		<section className="mx-auto max-w-6xl px-6 py-20" id="demo">
			<h2 className="mb-2 font-bold font-display text-2xl text-foreground tracking-tight">
				See it in action
			</h2>
			<p className="mb-8 font-body text-muted-foreground text-sm">
				A 2-minute walkthrough of workspaces, branching, and summarization.
			</p>
			<div className="group relative flex aspect-video cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-border bg-muted/30">
				<div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-foreground/20 transition-all group-hover:border-accent group-hover:bg-accent/5">
					<svg
						aria-labelledby="demo-video-play-title"
						className="ml-1 text-foreground/40 transition-colors"
						height="20"
						role="img"
						viewBox="0 0 18 20"
						width="18"
					>
						<title id="demo-video-play-title">Play demo video</title>
						<polygon fill="currentColor" points="0,0 18,10 0,20" />
					</svg>
				</div>
				<span className="absolute right-4 bottom-4 font-display text-muted-foreground text-xs">
					2:12
				</span>
			</div>
		</section>
	);
};

export default DemoVideo;
