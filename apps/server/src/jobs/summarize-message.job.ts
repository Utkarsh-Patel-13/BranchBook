import { google } from "@ai-sdk/google";
import { getArtifact, upsertArtifact } from "@branchbook/api/artifact.service";
import {
	appendToDraftAndGetCount,
	loadMessageForJob,
	updateMessageSummary,
} from "@branchbook/api/summary.service";
import { SUMMARY_THRESHOLD } from "@branchbook/config";
import type {
	RunFullSummarizationJobData,
	SummarizeMessageJobData,
} from "@branchbook/queue";
import { contextEngineQueue } from "@branchbook/queue";
import { generateText } from "ai";

/**
 * Job handler: per-message summarization.
 *
 * 1. Load the assistant message from DB.
 * 2. Call Gemini to generate a 1–3 sentence per-message summary.
 * 3. Persist the summary on the Message record.
 * 4. Append to Node.summaryDraft; increment summaryDraftCount.
 * 5. If count ≥ SUMMARY_THRESHOLD → enqueue `run-full-summarization`.
 * 6. If no ContextArtifact exists yet → create a PARTIAL artifact.
 */
export const handleSummarizeMessage = async (
	data: SummarizeMessageJobData
): Promise<void> => {
	const { nodeId, messageId, workspaceId } = data;

	// 1. Load the assistant message
	const message = await loadMessageForJob(messageId);
	if (!message || message.role !== "ASSISTANT" || !message.content) {
		return;
	}

	// 2. Generate per-message summary via Gemini
	let perMessageSummary: string;
	try {
		const { text } = await generateText({
			model: google("gemini-2.5-flash"),
			prompt: `Summarize the following assistant response in 1-3 sentences. Capture the main topic and key points for future context compression. Be concise and avoid filler phrases.\n\n${message.content}`,
		});
		perMessageSummary = text.trim();
	} catch {
		// Non-critical: fall back to truncated content
		perMessageSummary = message.content.slice(0, 200);
	}

	// 3. Persist the per-message summary
	await updateMessageSummary(messageId, perMessageSummary);

	// 4. Append to Node.summaryDraft and get updated count
	const newCount = await appendToDraftAndGetCount(nodeId, perMessageSummary);

	// 5. Enqueue full summarization if threshold is reached
	if (newCount >= SUMMARY_THRESHOLD) {
		const jobData: RunFullSummarizationJobData = { nodeId, workspaceId };
		await contextEngineQueue.add("run-full-summarization", jobData);
	}

	// 6. Create a PARTIAL artifact if none exists yet
	const existingArtifact = await getArtifact(nodeId);
	if (!existingArtifact) {
		const shortTitle = perMessageSummary.split(" ").slice(0, 8).join(" ");
		await upsertArtifact({
			nodeId,
			shortTitle: shortTitle.slice(0, 150),
			narrativeSummary: perMessageSummary,
			keyTopics: [],
			keyDecisions: [],
			promptReadyString: perMessageSummary,
			highLevelSummary: perMessageSummary,
			qualitySignal: "PARTIAL",
		});
	}
};
