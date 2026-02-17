import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AtSignIcon, Share2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/")({
	component: HomeComponent,
});

function HomeComponent() {
	const navigate = useNavigate();
	const { data: session, isPending } = authClient.useSession();

	const handleGetStarted = () => {
		if (session) {
			navigate({ to: "/workspaces" });
		} else {
			navigate({ to: "/login" });
		}
	};

	return (
		<div className="flex h-full flex-col overflow-y-auto bg-background text-foreground">
			{/* Hero Section */}
			<header className="px-6 pt-6 pb-4">
				<div className="mx-auto max-w-3xl space-y-3 text-center">
					<h1 className="text-balance font-bold font-serif text-2xl text-primary leading-tight tracking-tight md:text-3xl">
						Where Intelligence Meets Insight
					</h1>
					<p className="mx-auto max-w-lg text-muted-foreground text-sm leading-relaxed">
						Experience the next generation of study. An interconnected ecosystem
						where AI chat transforms into structured notebooks seamlessly.
					</p>
					<div className="flex flex-col items-center justify-center gap-2 pt-1 sm:flex-row">
						<Button
							className="h-9 cursor-pointer rounded-lg px-4 py-2 font-medium text-sm transition-all sm:w-auto"
							disabled={isPending}
							onClick={handleGetStarted}
							size="sm"
						>
							{session ? "Workspaces" : "Get Started"}
						</Button>
						<Button
							className="h-9 cursor-pointer rounded-lg px-4 py-2 font-medium text-sm transition-all sm:w-auto"
							size="sm"
							variant="outline"
						>
							Demo
						</Button>
					</div>
				</div>
			</header>

			{/* Tool Mockup Section */}
			<section className="mx-auto w-full max-w-2xl px-6 pb-4">
				<div className="group relative">
					<div className="absolute -inset-1 rounded-2xl bg-primary/5 opacity-10 blur transition duration-1000" />
					<div className="relative flex aspect-video flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm">
						<div className="flex h-6 items-center justify-between border-border border-b bg-muted/10 px-2">
							<div className="flex gap-1">
								<div className="h-1.5 w-1.5 rounded-full bg-slate-200 dark:bg-slate-700" />
								<div className="h-1.5 w-1.5 rounded-full bg-slate-200 dark:bg-slate-700" />
							</div>
							<div className="font-medium text-[8px] text-muted-foreground uppercase tracking-widest">
								BranchBook
							</div>
							<div className="w-4" />
						</div>
						<div className="flex flex-1 overflow-hidden">
							{/* AI Chat Interface (Left) */}
							<div className="flex w-1/2 flex-col space-y-3 border-border border-r bg-muted/5 p-3">
								<div className="space-y-2">
									<div className="flex justify-end">
										<div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-primary px-2 py-1.5 text-[10px] text-primary-foreground shadow-sm">
											Explain the Citric Acid Cycle stage 1.
										</div>
									</div>
									<div className="flex justify-start">
										<div className="max-w-[90%] space-y-1 rounded-2xl rounded-tl-sm border border-border bg-card px-2 py-1.5 shadow-sm">
											<div className="h-1 w-12 rounded bg-primary/20" />
											<div className="space-y-1">
												<div className="h-1 w-full rounded bg-slate-50 dark:bg-slate-700/20" />
												<div className="h-1 w-full rounded bg-slate-50 dark:bg-slate-700/20" />
												<div className="h-1 w-2/3 rounded bg-slate-50 dark:bg-slate-700/20" />
											</div>
										</div>
									</div>
								</div>
								<div className="mt-auto h-7 w-full rounded-md border border-border bg-background p-1.5">
									<div className="h-full w-1/3 rounded bg-muted/50" />
								</div>
							</div>

							{/* Notes Interface (Right) */}
							<div className="flex-1 overflow-hidden bg-background p-4">
								<div className="h-full max-w-sm space-y-3">
									<div className="font-bold font-serif text-sm tracking-tight">
										Biochemistry Notes
									</div>
									<div className="space-y-2">
										<div className="space-y-1">
											<div className="flex items-center gap-1">
												<div className="h-2 w-2 rounded-full bg-primary" />
												<div className="h-1.5 w-24 rounded bg-slate-100 dark:bg-slate-800" />
											</div>
											<div className="space-y-1 pl-3">
												<div className="h-1 w-full rounded bg-slate-50 dark:bg-slate-700/10" />
												<div className="h-1 w-5/6 rounded bg-slate-50 dark:bg-slate-700/10" />
											</div>
										</div>
										<div className="border-border border-t pt-2">
											<div className="h-1 w-full rounded bg-slate-50 dark:bg-slate-700/10" />
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Footer */}
			<footer className="mt-auto border-border border-t bg-background py-4">
				<div className="mx-auto max-w-7xl px-6">
					<div className="flex items-center justify-between gap-4">
						<div className="flex items-center gap-1.5">
							<img
								alt="BranchBook"
								className="size-4 rounded-md bg-foreground"
								height={16}
								src="/images/BranchBook.png"
								width={16}
							/>
							<span className="font-semibold text-sm tracking-tight">
								BranchBook
							</span>
						</div>

						<nav className="flex gap-4">
							<Link
								className="text-[10px] text-muted-foreground transition-colors hover:text-primary"
								to="/"
							>
								Product
							</Link>
							<Link
								className="text-[10px] text-muted-foreground transition-colors hover:text-primary"
								to="/"
							>
								About
							</Link>
						</nav>

						<div className="flex gap-3">
							<a
								className="text-muted-foreground transition-colors hover:text-primary"
								href="/"
							>
								<AtSignIcon className="size-4" />
							</a>
							<a
								className="text-muted-foreground transition-colors hover:text-primary"
								href="/"
							>
								<Share2Icon className="size-4" />
							</a>
						</div>
					</div>
					<div className="pt-2 text-center">
						<p className="text-[9px] text-muted-foreground">
							© 2026 BranchBook Inc.
						</p>
					</div>
				</div>
			</footer>
		</div>
	);
}
