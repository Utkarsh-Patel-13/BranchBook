import { google } from "@ai-sdk/google";
import {
	resetDraftAndUpdateSummaries,
	upgradeChildrenContext,
} from "@branchbook/api/summary.service";
import prisma from "@branchbook/db";
import { resummarizationOutputSchema } from "@branchbook/validators";
import { generateObject } from "ai";

/**
 * Load the node's accumulated summary draft, call Gemini to compress it
 * into detailed and high-level summaries, persist the result, and reset
 * the draft. Intended to be called fire-and-forget after the draft
 * threshold is reached.
 */
export const runResummarization = async (nodeId: string): Promise<void> => {
	const node = await prisma.node.findUnique({
		where: { id: nodeId },
		select: { summaryDraft: true },
	});

	if (!node?.summaryDraft) {
		return;
	}

	const { object } = await generateObject({
		model: google("gemini-2.0-flash"),
		schema: resummarizationOutputSchema,
		prompt: `You are a conversation summarizer. Compress the following accumulated per-message summaries into two forms:\n1. A detailed summary covering key topics, decisions, and conversation flow.\n2. A short high-level gist (1-2 sentences).\n\nAccumulated summaries:\n${node.summaryDraft}`,
	});

	await resetDraftAndUpdateSummaries(
		nodeId,
		object.detailedSummary,
		object.highLevelSummary
	);

	// Silently upgrade inherited context for all branched children now that
	// fresher summaries are available. Non-critical — errors are swallowed.
	upgradeChildrenContext(nodeId).catch(console.error);
};
