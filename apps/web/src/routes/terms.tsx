import { createFileRoute, Link } from "@tanstack/react-router";

import Footer from "@/components/landing/footer";

export const Route = createFileRoute("/terms")({
	component: TermsPage,
	head: () => ({
		meta: [
			{ title: "Terms of Service | BranchBook" },
			{ name: "description", content: "BranchBook terms of service." },
		],
	}),
});

function TermsPage() {
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
					Terms of Service
				</h1>
				<p className="mb-10 text-muted-foreground text-sm">
					Last updated: March 14, 2025
				</p>

				<div className="prose prose-neutral dark:prose-invert max-w-none">
					<section className="mb-8">
						<h2 className="mb-3 font-semibold text-xl">1. Acceptance</h2>
						<p className="text-muted-foreground text-sm leading-relaxed">
							By accessing or using BranchBook (&quot;Service&quot;), you agree
							to these Terms of Service. If you do not agree, do not use the
							Service.
						</p>
					</section>

					<section className="mb-8">
						<h2 className="mb-3 font-semibold text-xl">
							2. Description of Service
						</h2>
						<p className="text-muted-foreground text-sm leading-relaxed">
							BranchBook provides a workspace where note-taking and AI
							conversation coexist. You can create workspaces, organize content,
							and use AI-assisted features. We may change or discontinue
							features with reasonable notice where practicable.
						</p>
					</section>

					<section className="mb-8">
						<h2 className="mb-3 font-semibold text-xl">
							3. Account &amp; Eligibility
						</h2>
						<p className="text-muted-foreground text-sm leading-relaxed">
							You must be at least 13 years old (or the minimum age in your
							jurisdiction) to use the Service. You are responsible for
							maintaining the confidentiality of your account and for all
							activity under your account.
						</p>
					</section>

					<section className="mb-8">
						<h2 className="mb-3 font-semibold text-xl">4. Acceptable Use</h2>
						<p className="text-muted-foreground text-sm leading-relaxed">
							You agree not to use the Service to: violate any law or
							third-party rights; distribute malware or abuse systems; harass
							others; or scrape or automate access in ways that violate these
							terms or our technical limits. We may suspend or terminate
							accounts that violate acceptable use.
						</p>
					</section>

					<section className="mb-8">
						<h2 className="mb-3 font-semibold text-xl">5. Your Content</h2>
						<p className="text-muted-foreground text-sm leading-relaxed">
							You keep ownership of content you create. By using the Service,
							you grant us a limited license to host, store, and process your
							content as needed to provide and improve the Service (including AI
							features). You represent that you have the rights to post your
							content and that it does not infringe others&apos; rights.
						</p>
					</section>

					<section className="mb-8">
						<h2 className="mb-3 font-semibold text-xl">
							6. Our Intellectual Property
						</h2>
						<p className="text-muted-foreground text-sm leading-relaxed">
							BranchBook, our branding, and the technology underlying the
							Service are owned by us or our licensors. You may not copy,
							modify, or create derivative works of our service or branding
							without permission.
						</p>
					</section>

					<section className="mb-8">
						<h2 className="mb-3 font-semibold text-xl">7. Disclaimers</h2>
						<p className="text-muted-foreground text-sm leading-relaxed">
							The Service is provided &quot;as is&quot; and &quot;as
							available&quot;. We disclaim warranties of merchantability,
							fitness for a particular purpose, and non-infringement. We do not
							guarantee that the Service will be uninterrupted or error-free.
							AI-generated content may be inaccurate; do not rely on it for
							decisions where accuracy is critical.
						</p>
					</section>

					<section className="mb-8">
						<h2 className="mb-3 font-semibold text-xl">
							8. Limitation of Liability
						</h2>
						<p className="text-muted-foreground text-sm leading-relaxed">
							To the maximum extent permitted by law, we (and our affiliates and
							providers) are not liable for any indirect, incidental, special,
							consequential, or punitive damages, or for loss of data, revenue,
							or profits, arising from your use of the Service.
						</p>
					</section>

					<section className="mb-8">
						<h2 className="mb-3 font-semibold text-xl">9. Termination</h2>
						<p className="text-muted-foreground text-sm leading-relaxed">
							You may stop using the Service at any time. We may suspend or
							terminate your access for breach of these terms, for legal or
							operational reasons, or at our discretion. Provisions that by
							their nature should survive (e.g., disclaimers, limitations of
							liability) will survive termination.
						</p>
					</section>

					<section className="mb-8">
						<h2 className="mb-3 font-semibold text-xl">10. Changes to Terms</h2>
						<p className="text-muted-foreground text-sm leading-relaxed">
							We may update these terms. We will notify you of material changes
							(e.g., via the Service or email). Continued use after changes
							constitutes acceptance. If you do not agree, discontinue use.
						</p>
					</section>

					<section className="mb-8">
						<h2 className="mb-3 font-semibold text-xl">11. Contact</h2>
						<p className="text-muted-foreground text-sm leading-relaxed">
							For questions about these terms, contact us at the address or
							email provided on our website or in the app.
						</p>
					</section>
				</div>
			</main>
			<Footer />
		</div>
	);
}
