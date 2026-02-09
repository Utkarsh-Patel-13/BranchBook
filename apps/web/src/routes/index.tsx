import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";

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
		<div className="container mx-auto flex min-h-[80vh] max-w-4xl flex-col items-center justify-center gap-8 px-4 py-16">
			<div className="space-y-4 text-center">
				<h1 className="font-bold text-5xl tracking-tight sm:text-6xl">Nexus</h1>
				<p className="mx-auto max-w-2xl text-muted-foreground text-xl">
					Organize your work with workspaces. Create, manage, and navigate
					through your projects seamlessly.
				</p>
			</div>

			<div className="flex flex-col gap-3 sm:flex-row">
				{session ? (
					<Link to="/workspaces">
						<Button size="lg">Go to Workspaces</Button>
					</Link>
				) : (
					<>
						<Button disabled={isPending} onClick={handleGetStarted} size="lg">
							Get Started
						</Button>
						<Link to="/login">
							<Button size="lg" variant="outline">
								Sign In
							</Button>
						</Link>
					</>
				)}
			</div>

			{session && (
				<p className="text-muted-foreground text-sm">
					Welcome back, {session.user.name}!
				</p>
			)}
		</div>
	);
}
