// Context Engine types for ancestry-aware chat context

import { z } from "zod";

// ---------------------------------------------------------------------------
// Quality signal
// ---------------------------------------------------------------------------

export const ContextQualitySignalSchema = z.enum([
	"FRESH",
	"PARTIAL",
	"STALE",
	"MINIMAL",
]);

/**
 * Reflects how complete and fresh a node's ContextArtifact is.
 * - FRESH   : Full summarization completed; no new messages since.
 * - PARTIAL : Per-message summaries exist; full summarization not yet run.
 * - STALE   : Full summarization ran but the artifact is older than the staleness window.
 * - MINIMAL : Fewer messages than the threshold; only raw messages available.
 */
export type ContextQualitySignal = z.infer<typeof ContextQualitySignalSchema>;

// ---------------------------------------------------------------------------
// Context artifact
// ---------------------------------------------------------------------------

export const ContextArtifactSchema = z.object({
	id: z.string(),
	nodeId: z.string(),
	/** ≤10-word semantic topic for the node's conversation. */
	shortTitle: z.string(),
	/** Prose paragraph summary for use as the immediate parent's context contribution. */
	narrativeSummary: z.string(),
	/** 3–7 topic tags extracted from the conversation. */
	keyTopics: z.array(z.string()),
	/** 0–N key decisions captured during the conversation. */
	keyDecisions: z.array(z.string()),
	/** Pre-computed, token-budgeted string for AI prompt injection. */
	promptReadyString: z.string(),
	/** 1–2 sentence gist for use as a distant ancestor's contribution. */
	highLevelSummary: z.string(),
	qualitySignal: ContextQualitySignalSchema,
	artifactVersion: z.number().int(),
	lastProcessedAt: z.date(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export type ContextArtifact = z.infer<typeof ContextArtifactSchema>;

// ---------------------------------------------------------------------------
// Context panel / ancestry chain
// ---------------------------------------------------------------------------

/** Which kind of summary was used for an ancestor in the context panel. */
export type SummaryTypeUsed =
	| "promptReady"
	| "highLevel"
	| "draft"
	| "raw"
	| "none";

/** Per-ancestor entry used in the Context panel. */
export interface AncestorContextEntry {
	nodeId: string;
	nodeTitle: string;
	/** shortTitle from the node's artifact, if available. */
	shortTitle: string | null;
	/** keyTopics from the node's artifact, if available. */
	keyTopics: string[];
	summaryTypeUsed: SummaryTypeUsed;
	qualitySignal: ContextQualitySignal | null;
}

/** Full data returned by node.getContextPanel. */
export interface GetContextPanelOutput {
	hasInheritedContext: boolean;
	inheritedContextQuality: ContextQualitySignal;
	ancestry: AncestorContextEntry[];
	lastRawMessagesFromBranchPoint: Array<{
		role: "USER" | "ASSISTANT";
		content: string;
	}>;
	/** true if any ancestor fell back to draft/raw data instead of a full artifact. */
	assembledFromFallback: boolean;
}

// ---------------------------------------------------------------------------
// Branch metadata
// ---------------------------------------------------------------------------

/** Metadata captured when a node is created via "Branch from here". */
export interface BranchMetadata {
	branchPointMessageId: string;
	parentId: string;
}

/** Status of context availability when a branch is created. */
export type ContextStatus = "ready" | "assembling" | "fallback";

/** Assembled ancestry context payload stored on a branched child node. */
export type ContextPayload = string;
