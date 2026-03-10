import { google } from "@ai-sdk/google";
import { upsertArtifact } from "@branchbook/api/artifact.service";
import { loadDraftForNode, resetDraft } from "@branchbook/api/summary.service";
import type {
	RunFullSummarizationJobData,
	UpgradeChildContextsJobData,
} from "@branchbook/queue";
import { contextEngineQueue } from "@branchbook/queue";
import { generateText, Output } from "ai";
import { z } from "zod";

const artifactOutputSchema = z.object({
	shortTitle: z.string().max(150),
	narrativeSummary: z.string(),
	keyTopics: z.array(z.string()),
	keyDecisions: z.array(z.string()),
	promptReadyString: z.string(),
	highLevelSummary: z.string(),
});

/**
 * Job handler: full AI summarization cycle.
 *
 * 1. Load Node.summaryDraft.
 * 2. Call Gemini with structured output.
 * 3. Validate response with Zod; fall back to plain text on parse failure.
 * 4. Upsert ContextArtifact with qualitySignal=FRESH; increment artifactVersion.
 * 5. Reset Node.summaryDraft and summaryDraftCount to zero.
 * 6. Enqueue `upgrade-child-contexts` job.
 */
export const handleRunFullSummarization = async (
	data: RunFullSummarizationJobData
): Promise<void> => {
	const { nodeId, workspaceId } = data;

	// 1. Load the accumulated draft
	const nodeData = await loadDraftForNode(nodeId);
	if (!nodeData?.summaryDraft) {
		return;
	}

	const draft = nodeData.summaryDraft;
	let artifactData: z.infer<typeof artifactOutputSchema>;

	// 2 & 3. Call Gemini for structured output; fall back on failure
	try {
		const { output } = await generateText({
			model: google("gemini-2.5-flash"),
			output: Output.object({ schema: artifactOutputSchema }),
			prompt: `Based on these per-message summaries from a conversation node, produce a structured context artifact.

Per-message summaries:
${draft}

Generate:
- shortTitle: A concise title (max 10 words) capturing the main topic
- narrativeSummary: A 3-5 sentence flowing narrative summary of the conversation
- keyTopics: 3-7 key topics discussed, as short phrases
- keyDecisions: Notable decisions, conclusions, or action items (empty array if none)
- promptReadyString: A compact, self-contained paragraph (200-400 words) suitable for injecting as AI context in a new conversation branch. Should give the AI immediate awareness of what happened.
- highLevelSummary: A brief 1-2 sentence high-level summary`,
		});
		artifactData = output;
	} catch {
		// Fallback: use draft text directly without AI processing
		const shortTitle = draft.split(" ").slice(0, 8).join(" ").slice(0, 150);
		artifactData = {
			shortTitle,
			narrativeSummary: draft.slice(0, 2000),
			keyTopics: [],
			keyDecisions: [],
			promptReadyString: draft.slice(0, 1600),
			highLevelSummary: draft.slice(0, 500),
		};
	}

	// 4. Upsert the ContextArtifact with FRESH quality signal
	await upsertArtifact({
		nodeId,
		...artifactData,
		qualitySignal: "FRESH",
	});

	// 5. Reset the summary draft
	await resetDraft(nodeId);

	// 6. Enqueue upgrade-child-contexts job
	const upgradeData: UpgradeChildContextsJobData = {
		parentNodeId: nodeId,
		workspaceId,
	};
	await contextEngineQueue.add("upgrade-child-contexts", upgradeData);
};
