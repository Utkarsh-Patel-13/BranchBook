/**
 * Summary service — queue-based triggering (004 rewrite).
 *
 * All AI calls happen inside the context-engine worker (apps/server/src/jobs/).
 * This service only performs DB reads/writes and enqueues BullMQ jobs.
 */
import prisma from "@branchbook/db";
import type { SummarizeMessageJobData } from "@branchbook/queue";
import { contextEngineQueue } from "@branchbook/queue";

/**
 * Entry point from the chat route.
 * Enqueues a `summarize-message` job for the just-saved assistant message.
 * No AI calls happen here — all processing is async via the worker.
 */
export const appendToDraftAndEnqueue = async (
	nodeId: string,
	messageId: string,
	workspaceId: string
): Promise<void> => {
	const jobData: SummarizeMessageJobData = { nodeId, messageId, workspaceId };
	await contextEngineQueue.add("summarize-message", jobData);
};

/**
 * Load an assistant message by ID for use in the summarize-message job.
 */
export const loadMessageForJob = (
	messageId: string
): Promise<{
	id: string;
	nodeId: string;
	content: string | null;
	role: string;
} | null> => {
	return prisma.message.findUnique({
		where: { id: messageId },
		select: { id: true, nodeId: true, content: true, role: true },
	});
};

/**
 * Persist the per-message summary on a Message record.
 */
export const updateMessageSummary = async (
	messageId: string,
	perMessageSummary: string
): Promise<void> => {
	await prisma.message.update({
		where: { id: messageId },
		data: { perMessageSummary },
	});
};

/**
 * Append a per-message summary to the node's summary draft,
 * increment `summaryDraftCount`, and return the updated count.
 */
export const appendToDraftAndGetCount = async (
	nodeId: string,
	summary: string
): Promise<number> => {
	const node = await prisma.node.findUnique({
		where: { id: nodeId },
		select: { summaryDraft: true },
	});

	if (!node) {
		return 0;
	}

	const newDraft = node.summaryDraft
		? `${node.summaryDraft}\n\n${summary}`
		: summary;

	const updated = await prisma.node.update({
		where: { id: nodeId },
		data: {
			summaryDraft: newDraft,
			summaryDraftCount: { increment: 1 },
		},
		select: { summaryDraftCount: true },
	});

	return updated.summaryDraftCount;
};

/**
 * Load the current summary draft and metadata for a node.
 * Used by the run-full-summarization job handler.
 */
export const loadDraftForNode = (
	nodeId: string
): Promise<{
	id: string;
	workspaceId: string;
	summaryDraft: string | null;
	summaryDraftCount: number;
} | null> => {
	return prisma.node.findUnique({
		where: { id: nodeId },
		select: {
			id: true,
			workspaceId: true,
			summaryDraft: true,
			summaryDraftCount: true,
		},
	});
};

/**
 * Reset the node's summary draft and draft count to zero.
 * Called after a successful full summarization run.
 */
export const resetDraft = async (nodeId: string): Promise<void> => {
	await prisma.node.update({
		where: { id: nodeId },
		data: {
			summaryDraft: null,
			summaryDraftCount: 0,
		},
	});
};
