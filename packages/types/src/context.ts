// Context Engine types for ancestry-aware chat context

/** Which kind of summary was used for an ancestor in the context panel. */
export type SummaryTypeUsed = "detailed" | "highLevel" | "draft";

/** Assembled ancestry context payload stored on a branched child node. */
export type ContextPayload = string;

/** Metadata captured when a node is created via "Branch from here". */
export interface BranchMetadata {
	branchPointMessageId: string;
	parentId: string;
}

/** Per-ancestor entry used in the Context panel. */
export interface AncestorContextEntry {
	nodeId: string;
	title: string;
	summaryTypeUsed: SummaryTypeUsed;
}

/** Full data for the Context panel on a branched node. */
export interface ContextPanelData {
	ancestry: AncestorContextEntry[];
	lastRawMessagesFromBranchPoint: Array<{
		role: "USER" | "ASSISTANT";
		content: string;
	}>;
	assembledFromDraft: boolean;
}
