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
