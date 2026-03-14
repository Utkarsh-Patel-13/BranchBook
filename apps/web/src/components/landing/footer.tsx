const Footer = () => {
	return (
		<footer className="mt-16 border-border border-t bg-background">
			<div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-6 py-10 md:flex-row md:items-center">
				<div>
					<div className="mb-1 flex items-center gap-2">
						<svg
							aria-labelledby="branchbook-logo-title"
							fill="none"
							height="20"
							role="img"
							viewBox="0 0 20 20"
							width="20"
						>
							<title id="branchbook-logo-title">BranchBook Logo</title>
							<circle
								cx="10"
								cy="4"
								r="2.5"
								stroke="currentColor"
								strokeWidth="1.5"
							/>
							<circle
								cx="5"
								cy="16"
								r="2.5"
								stroke="currentColor"
								strokeWidth="1.5"
							/>
							<circle
								cx="15"
								cy="16"
								r="2.5"
								stroke="currentColor"
								strokeWidth="1.5"
							/>
							<line
								stroke="currentColor"
								strokeWidth="1.5"
								x1="10"
								x2="5"
								y1="6.5"
								y2="13.5"
							/>
							<line
								stroke="currentColor"
								strokeWidth="1.5"
								x1="10"
								x2="15"
								y1="6.5"
								y2="13.5"
							/>
						</svg>
						<span className="font-display font-semibold text-foreground text-sm">
							BranchBook
						</span>
					</div>
					<p className="text-muted-foreground text-xs">
						Think in branches, not threads.
					</p>
					<p className="mt-2 text-muted-foreground text-xs">
						© {new Date().getFullYear()} BranchBook. All rights reserved.
					</p>
				</div>
				<nav className="flex items-center gap-6">
					{[
						{ name: "Privacy", link: "/privacy" },
						{ name: "Terms", link: "/terms" },
						{
							name: "GitHub",
							link: "https://github.com/Utkarsh-Patel-13/BranchBook",
						},
					].map((item) => (
						<a
							className="text-muted-foreground text-xs transition-colors hover:text-foreground"
							href={item.link}
							key={item.name}
							{...(item.link.startsWith("http") && {
								rel: "noopener",
								target: "_blank",
							})}
						>
							{item.name}
						</a>
					))}
				</nav>
			</div>
		</footer>
	);
};

export default Footer;
