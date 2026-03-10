/** Payload for per-message summarization jobs. */
export interface SummarizeMessageJobData {
	nodeId: string;
	/** The assistant Message.id to summarize. */
	messageId: string;
	workspaceId: string;
}

/** Payload for full AI summarization jobs (produces a ContextArtifact). */
export interface RunFullSummarizationJobData {
	nodeId: string;
	workspaceId: string;
}

/** Payload for assembling inherited context on a newly created child node. */
export interface AssembleInheritedContextJobData {
	childNodeId: string;
	parentNodeId: string;
	/** The message the child was branched from; null means use the latest message. */
	branchPointMessageId: string | null;
	workspaceId: string;
}

/** Payload for fan-out job that re-assembles context for all direct children. */
export interface UpgradeChildContextsJobData {
	/** The node whose artifact was just updated. */
	parentNodeId: string;
	workspaceId: string;
}

export type ContextEngineJobName =
	| "summarize-message"
	| "run-full-summarization"
	| "assemble-inherited-context"
	| "upgrade-child-contexts";

export type ContextEngineJobData =
	| SummarizeMessageJobData
	| RunFullSummarizationJobData
	| AssembleInheritedContextJobData
	| UpgradeChildContextsJobData;
