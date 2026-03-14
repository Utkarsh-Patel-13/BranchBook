import { createFileRoute } from "@tanstack/react-router";
import Features from "@/components/landing/features";
import Footer from "@/components/landing/footer";
import Hero from "@/components/landing/hero";
import HowItWorks from "@/components/landing/how-it-works";
import WorkspacePreview from "@/components/landing/workspace-preview";

export const Route = createFileRoute("/")({
	component: HomeComponent,
});

function HomeComponent() {
	return (
		<div className="min-h-screen bg-background text-foreground">
			<main>
				<div className="mx-auto max-w-7xl px-6">
					<div className="grid grid-cols-1 md:grid-cols-3 md:gap-10">
						<Hero />
						<WorkspacePreview />
					</div>
				</div>
				<Features />
				<HowItWorks />
			</main>
			<Footer />
		</div>
	);
}
