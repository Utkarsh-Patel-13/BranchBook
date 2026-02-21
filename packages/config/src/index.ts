/**
 * Single source of truth for application configuration constants.
 * All services that need configurable values should import from here.
 */

/**
 * Number of per-message summaries to accumulate before triggering
 * a full resummarization of the node's conversation history.
 * Override with CONTEXT_SUMMARY_THRESHOLD env var.
 */
export const SUMMARY_THRESHOLD: number = (() => {
	const raw = process.env.CONTEXT_SUMMARY_THRESHOLD;
	if (!raw) {
		return 5;
	}
	const parsed = Number.parseInt(raw, 10);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : 5;
})();

/**
 * Maximum token budget for assembled inherited context on a child node.
 * The assembled prompt-ready string will never exceed this limit.
 * Override with CONTEXT_TOKEN_BUDGET env var.
 */
export const CONTEXT_TOKEN_BUDGET: number = (() => {
	const raw = process.env.CONTEXT_TOKEN_BUDGET;
	if (!raw) {
		return 2000;
	}
	const parsed = Number.parseInt(raw, 10);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : 2000;
})();

/**
 * Number of hours after which a ContextArtifact is considered stale.
 * Stale artifacts trigger re-summarization on next branch creation.
 * Override with CONTEXT_STALENESS_HOURS env var.
 */
export const CONTEXT_STALENESS_HOURS: number = (() => {
	const raw = process.env.CONTEXT_STALENESS_HOURS;
	if (!raw) {
		return 24;
	}
	const parsed = Number.parseInt(raw, 10);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : 24;
})();
