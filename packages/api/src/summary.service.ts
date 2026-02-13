import { SUMMARY_THRESHOLD } from "@nexus/config";
import prisma from "@nexus/db";
import { assembleContextPayload } from "./context-engine.service";

/**
 * Append a per-message summary to the node's summary draft
 * and increment the draft count atomically.
 */
export const appendToDraft = async (
	nodeId: string,
	perMessageSummary: string
): Promise<void> => {
	const node = await prisma.node.findUnique({
		where: { id: nodeId },
		select: { summaryDraft: true },
	});

	if (!node) {
		return;
	}

	const newDraft = node.summaryDraft
		? `${node.summaryDraft}\n\n${perMessageSummary}`
		: perMessageSummary;

	await prisma.node.update({
		where: { id: nodeId },
		data: {
			summaryDraft: newDraft,
			summaryDraftCount: { increment: 1 },
		},
	});
};

/**
 * Check if the node's summary draft count has reached the threshold.
 * If so, call the provided enqueue function to trigger resummarization.
 *
 * @param nodeId - The node to check
 * @param enqueue - Callback invoked (fire-and-forget) if threshold is met
 */
export const checkThresholdAndQueueResummarization = async (
	nodeId: string,
	enqueue: (nodeId: string) => void
): Promise<void> => {
	const node = await prisma.node.findUnique({
		where: { id: nodeId },
		select: { summaryDraftCount: true },
	});

	if (node && node.summaryDraftCount >= SUMMARY_THRESHOLD) {
		enqueue(nodeId);
	}
};

/**
 * After a node's summaries are updated (e.g. after resummarization), find all
 * direct children that have inherited context from this node and re-assemble
 * their context payload so the next chat interaction uses the fresher summaries.
 *
 * Runs fire-and-forget style — errors are non-fatal.
 */
export const upgradeChildrenContext = async (nodeId: string): Promise<void> => {
	const children = await prisma.node.findMany({
		where: {
			parentId: nodeId,
			deletedAt: null,
			inheritedContext: { not: null },
			branchPointMessageId: { not: null },
		},
		select: { id: true, branchPointMessageId: true },
	});

	for (const child of children) {
		if (!child.branchPointMessageId) {
			continue;
		}

		const newContext = await assembleContextPayload(
			nodeId,
			child.branchPointMessageId
		);

		await prisma.node.update({
			where: { id: child.id },
			data: { inheritedContext: newContext },
		});
	}
};

/**
 * Replace the node's draft with final detailed and high-level summaries
 * and reset the draft count to zero.
 */
export const resetDraftAndUpdateSummaries = async (
	nodeId: string,
	detailedSummary: string,
	highLevelSummary: string
): Promise<void> => {
	await prisma.node.update({
		where: { id: nodeId },
		data: {
			detailedSummary,
			highLevelSummary,
			summaryDraft: null,
			summaryDraftCount: 0,
		},
	});
};
