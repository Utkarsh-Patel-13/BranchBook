// Suggestion engine types — 005-convo-branch-suggest
// Suggestions are ephemeral client state; no DB schema involved.

export type FollowUpSuggestion = string;

export interface BranchSuggestion {
	label: string;
	contextSeed: string;
}

export interface SuggestionSet {
	followUps: FollowUpSuggestion[];
	branchSuggestion: BranchSuggestion | null;
}
