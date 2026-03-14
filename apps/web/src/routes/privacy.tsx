import { createFileRoute, Link } from "@tanstack/react-router";

import Footer from "@/components/landing/footer";

export const Route = createFileRoute("/privacy")({
	component: PrivacyPage,
	head: () => ({
		meta: [
			{ title: "Privacy Policy | BranchBook" },
			{ name: "description", content: "BranchBook privacy policy." },
		],
	}),
});

function PrivacyPage() {
	return (
		<div className="min-h-screen bg-background text-foreground">
			<main className="mx-auto max-w-3xl px-6 py-12">
				<Link
					className="mb-8 inline-block text-muted-foreground text-sm transition-colors hover:text-foreground"
					to="/"
				>
					← Back to home
				</Link>
				<h1 className="mb-2 font-display font-semibold text-3xl">
					Privacy Policy
				</h1>
				<p className="mb-10 text-muted-foreground text-sm">
					Last updated: March 14, 2025
				</p>

				<div className="prose prose-neutral dark:prose-invert max-w-none">
					<section className="mb-8">
						<h2 className="mb-3 font-semibold text-xl">1. Introduction</h2>
						<p className="text-muted-foreground text-sm leading-relaxed">
							BranchBook (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;)
							respects your privacy. This policy describes how we collect, use,
							and protect your information when you use our workspace and
							conversation platform.
						</p>
					</section>

					<section className="mb-8">
						<h2 className="mb-3 font-semibold text-xl">
							2. Information We Collect
						</h2>
						<ul className="list-disc space-y-2 pl-5 text-muted-foreground text-sm leading-relaxed">
							<li>
								<strong className="text-foreground">Account data:</strong>{" "}
								email, password (hashed), and profile information you provide
								when signing up.
							</li>
							<li>
								<strong className="text-foreground">Content you create:</strong>{" "}
								workspaces, notes, messages, and other content you add to
								BranchBook.
							</li>
						</ul>
					</section>

					<section className="mb-8">
						<h2 className="mb-3 font-semibold text-xl">3. Data Sharing</h2>
						<p className="text-muted-foreground text-sm leading-relaxed">
							We do not sell your personal data. We do not share data with
							service any providers.
						</p>
					</section>

					<section className="mb-8">
						<h2 className="mb-3 font-semibold text-xl">
							5. Security &amp; Retention
						</h2>
						<p className="text-muted-foreground text-sm leading-relaxed">
							We use industry-standard measures to protect your data. We retain
							your information for as long as your account is active or as
							needed to provide the service and fulfill the purposes described
							in this policy.
						</p>
					</section>

					<section className="mb-8">
						<h2 className="mb-3 font-semibold text-xl">6. Your Rights</h2>
						<p className="text-muted-foreground text-sm leading-relaxed">
							Depending on your location, you may have the right to access,
							correct, delete, or export your data, or to object to or restrict
							certain processing. You can manage your account and many
							preferences in the product. Contact us to exercise your rights.
						</p>
					</section>

					<section className="mb-8">
						<h2 className="mb-3 font-semibold text-xl">7. Changes</h2>
						<p className="text-muted-foreground text-sm leading-relaxed">
							We may update this policy from time to time. We will notify you of
							material changes by posting the new policy and updating the
							&quot;Last updated&quot; date.
						</p>
					</section>

					<section className="mb-8">
						<h2 className="mb-3 font-semibold text-xl">8. Contact</h2>
						<p className="text-muted-foreground text-sm leading-relaxed">
							For privacy-related questions or requests, contact us at the
							address or email provided on our website or in the app.
						</p>
					</section>
				</div>
			</main>
			<Footer />
		</div>
	);
}
