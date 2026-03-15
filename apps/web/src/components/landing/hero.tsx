import { useNavigate } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";
import { Button } from "../ui/button";

const Hero = () => {
	const navigate = useNavigate();
	const { data: session } = authClient.useSession();

	const handleGetStarted = () => {
		if (session) {
			navigate({ to: "/workspaces" });
		} else {
			navigate({ to: "/login" });
		}
	};

	return (
		<section className="landing-hero-ambient pt-28 pb-16 md:col-span-1 md:pb-20">
			<div className="max-w-2xl">
				<h1 className="font-bold font-display text-4xl text-foreground leading-[1.1] tracking-tight md:text-5xl">
					Think in branches,
					<br />
					not threads.
				</h1>
				<p className="mt-6 max-w-lg font-body text-lg text-muted-foreground leading-relaxed">
					BranchBook turns AI conversations into navigable trees of knowledge.
					Branch off ideas. Summarize into notes. Build understanding—not chat
					logs.
				</p>
				<div className="mt-8 flex items-center gap-4">
					<Button
						className="inline-flex items-center gap-2 rounded-md bg-foreground px-5 py-2.5 font-medium text-background text-sm transition-colors hover:cursor-pointer hover:bg-foreground/90"
						onClick={handleGetStarted}
						size="lg"
						type="button"
					>
						{session ? "Go To Workspaces" : "Start Thinking"}
					</Button>
				</div>
			</div>
		</section>
	);
};

export default Hero;
