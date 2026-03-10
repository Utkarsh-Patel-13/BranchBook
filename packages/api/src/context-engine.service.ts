/**
 * Context Engine service — Phase 4 implementation.
 *
 * Exports:
 *   T019 — Token budget utilities: approximateTokenCount, truncateToTokenBudget, allocateBudgets
 *   T020 — Context assembly:       assembleInheritedContext, buildRawMessageFallback
 *          Service helpers:         setInheritedContext, getDirectChildrenWithContext
 *          Panel data:              buildContextPanelData
 */
import { CONTEXT_TOKEN_BUDGET } from "@branchbook/config";
import prisma from "@branchbook/db";
import type {
	AncestorContextEntry,
	ContextQualitySignal,
	GetContextPanelOutput,
} from "@branchbook/types";
import { getArtifact } from "./artifact.service";

const RAW_MESSAGE_COUNT = 3;
const ANCESTOR_BUDGET_FRACTION = 0.75;

interface AncestryNode {
	id: string;
	title: string;
	parentId: string | null;
	summaryDraft: string | null;
	deletedAt: Date | null;
}

// ---------------------------------------------------------------------------
// T019: Token budget utilities
// ---------------------------------------------------------------------------

/**
 * Approximate token count using the 1-token-per-4-chars heuristic.
 */
export const approximateTokenCount = (text: string): number =>
	Math.ceil(text.length / 4);

/**
 * Truncate text to fit within the given token budget.
 * Appends '...' when truncated.
 */
export const truncateToTokenBudget = (text: string, budget: number): string => {
	const maxChars = budget * 4 - 3;
	if (text.length <= maxChars + 3) {
		return text;
	}
	return `${text.slice(0, maxChars)}...`;
};

/**
 * Allocate per-ancestor token budgets using geometric decay.
 *
 * - weights[i] = 0.5^i (nearest ancestor = index 0 = largest share)
 * - Floor-allocates proportional shares; remainder goes to the nearest ancestor.
 *
 * @param ancestorCount - number of ancestors to allocate for
 * @param totalBudget   - total token budget to distribute
 * @returns Array of token budgets, index 0 = nearest ancestor
 */
export const allocateBudgets = (
	ancestorCount: number,
	totalBudget: number
): number[] => {
	if (ancestorCount <= 0) {
		return [];
	}

	const weights = Array.from({ length: ancestorCount }, (_, i) => 0.5 ** i);
	const totalWeight = weights.reduce((sum, w) => sum + w, 0);
	const budgets = weights.map((w) =>
		Math.floor((totalBudget * w) / totalWeight)
	);

	// Give any remainder (from flooring) to the nearest ancestor
	const allocated = budgets.reduce((sum, b) => sum + b, 0);
	budgets[0] = (budgets[0] ?? 0) + (totalBudget - allocated);

	return budgets;
};

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Walk the ancestry chain from `startNodeId` up to the root.
 * Returns nodes ordered from root → startNode (inclusive).
 */
const walkAncestry = async (startNodeId: string): Promise<AncestryNode[]> => {
	const chain: AncestryNode[] = [];
	let currentId: string | null = startNodeId;

	while (currentId) {
		const node: AncestryNode | null = await prisma.node.findUnique({
			where: { id: currentId },
			select: {
				id: true,
				title: true,
				parentId: true,
				summaryDraft: true,
				deletedAt: true,
			},
		});

		if (!node) {
			break;
		}

		chain.unshift(node);
		currentId = node.parentId;
	}

	return chain;
};

const QUALITY_RANK: Record<ContextQualitySignal, number> = {
	FRESH: 0,
	PARTIAL: 1,
	STALE: 2,
	MINIMAL: 3,
};

const QUALITY_SIGNALS: ContextQualitySignal[] = [
	"FRESH",
	"PARTIAL",
	"STALE",
	"MINIMAL",
];

// ---------------------------------------------------------------------------
// T020: assembleInheritedContext
// ---------------------------------------------------------------------------

/** Load the best available summary text and quality rank for a single ancestor. */
const loadAncestorTextAndQuality = async (
	ancestor: AncestryNode
): Promise<{ text: string; qualityRank: number }> => {
	const artifact = await getArtifact(ancestor.id);
	if (artifact?.promptReadyString) {
		return {
			text: artifact.promptReadyString,
			qualityRank: QUALITY_RANK[artifact.qualitySignal],
		};
	}
	if (artifact?.highLevelSummary) {
		return {
			text: artifact.highLevelSummary,
			qualityRank: QUALITY_RANK[artifact.qualitySignal],
		};
	}
	if (ancestor.summaryDraft) {
		return { text: ancestor.summaryDraft, qualityRank: QUALITY_RANK.MINIMAL };
	}
	return { text: "[no summary available]", qualityRank: QUALITY_RANK.MINIMAL };
};

/** Load and format the last N raw messages up to the branch point as output lines. */
const loadRawMessageLines = async (
	parentNodeId: string,
	branchPointMessageId: string | null
): Promise<string[]> => {
	const effectiveBranchPoint = branchPointMessageId
		? await prisma.message.findUnique({
				where: { id: branchPointMessageId },
				select: { createdAt: true },
			})
		: await prisma.message.findFirst({
				where: { nodeId: parentNodeId },
				orderBy: { createdAt: "desc" },
				select: { createdAt: true },
			});

	if (!effectiveBranchPoint) {
		return [];
	}

	const rawMessages = await prisma.message.findMany({
		where: {
			nodeId: parentNodeId,
			createdAt: { lte: effectiveBranchPoint.createdAt },
		},
		orderBy: { createdAt: "desc" },
		take: RAW_MESSAGE_COUNT,
		select: { role: true, content: true },
	});

	if (rawMessages.length === 0) {
		return [];
	}

	const lines: string[] = ["\n# Recent Messages\n"];
	for (const msg of rawMessages.reverse()) {
		lines.push(`**${msg.role}**: ${msg.content}\n`);
	}
	return lines;
};

/**
 * Assemble the inherited context payload for a child node being branched.
 *
 * 1. Walks ancestry from parentNodeId to root.
 * 2. For each ancestor: prefers promptReadyString → highLevelSummary → summaryDraft → '[no summary available]'.
 * 3. Allocates token budgets geometrically (nearest ancestor = largest share).
 * 4. Appends last N raw messages from the immediate parent up to branchPointMessageId.
 * 5. Returns assembled context string and the worst quality signal encountered.
 *
 * @param _childNodeId         - ID of the child node being assembled for (reserved for future use)
 * @param parentNodeId         - ID of the immediate parent node
 * @param branchPointMessageId - Message to branch from; null means use the latest message
 */
export const assembleInheritedContext = async (
	_childNodeId: string,
	parentNodeId: string,
	branchPointMessageId: string | null
): Promise<{ context: string; worstQuality: ContextQualitySignal }> => {
	const ancestry = await walkAncestry(parentNodeId);
	// ancestry: root → parent (inclusive); reverse so index 0 = immediate parent
	const ancestorsNearestFirst = [...ancestry].reverse();

	let worstQualityRank = QUALITY_RANK.FRESH;
	const ancestorTexts: string[] = [];

	for (const ancestor of ancestorsNearestFirst) {
		const { text, qualityRank } = await loadAncestorTextAndQuality(ancestor);
		ancestorTexts.push(text);
		if (qualityRank > worstQualityRank) {
			worstQualityRank = qualityRank;
		}
	}

	// Allocate 75% of budget to ancestor summaries; 25% reserved for raw messages
	const ancestorBudget = Math.floor(
		CONTEXT_TOKEN_BUDGET * ANCESTOR_BUDGET_FRACTION
	);
	const budgets = allocateBudgets(ancestorsNearestFirst.length, ancestorBudget);

	const parts: string[] = ["# Ancestry Context\n"];
	for (let i = 0; i < ancestorsNearestFirst.length; i++) {
		const ancestor = ancestorsNearestFirst[i];
		const budget = budgets[i] ?? 0;
		const text = truncateToTokenBudget(ancestorTexts[i] ?? "", budget);
		const depthLabel = i === 0 ? "immediate parent" : `depth ${i + 1}`;
		parts.push(`## ${ancestor?.title ?? "Unknown"} (${depthLabel})\n${text}\n`);
	}

	const rawLines = await loadRawMessageLines(
		parentNodeId,
		branchPointMessageId
	);
	parts.push(...rawLines);

	const worstQuality = QUALITY_SIGNALS[worstQualityRank] ?? "MINIMAL";
	return { context: parts.join("\n"), worstQuality };
};

// ---------------------------------------------------------------------------
// FR-013a: Raw message fallback
// ---------------------------------------------------------------------------

/**
 * Build a minimal context string from raw messages only.
 * Used as a last-resort fallback when full assembly fails (FR-013a).
 */
export const buildRawMessageFallback = async (
	parentNodeId: string,
	branchPointMessageId: string | null
): Promise<string> => {
	const effectiveBranchPoint = branchPointMessageId
		? await prisma.message.findUnique({
				where: { id: branchPointMessageId },
				select: { createdAt: true },
			})
		: await prisma.message.findFirst({
				where: { nodeId: parentNodeId },
				orderBy: { createdAt: "desc" },
				select: { createdAt: true },
			});

	if (!effectiveBranchPoint) {
		return "[no context available]";
	}

	const rawMessages = await prisma.message.findMany({
		where: {
			nodeId: parentNodeId,
			createdAt: { lte: effectiveBranchPoint.createdAt },
		},
		orderBy: { createdAt: "desc" },
		take: RAW_MESSAGE_COUNT,
		select: { role: true, content: true },
	});

	if (rawMessages.length === 0) {
		return "[no messages available]";
	}

	const parts: string[] = ["# Recent Messages (fallback)\n"];
	for (const msg of rawMessages.reverse()) {
		parts.push(`**${msg.role}**: ${msg.content}\n`);
	}
	return parts.join("\n");
};

// ---------------------------------------------------------------------------
// Service helpers for job handlers
// ---------------------------------------------------------------------------

/**
 * Persist the assembled inherited context and quality signal on a child node.
 */
export const setInheritedContext = async (
	childNodeId: string,
	context: string,
	quality: ContextQualitySignal
): Promise<void> => {
	await prisma.node.update({
		where: { id: childNodeId },
		data: {
			inheritedContext: context,
			inheritedContextQuality: quality,
		},
	});
};

/**
 * Return direct children of `parentNodeId` that already have an inheritedContext.
 * Used by `upgrade-child-contexts` to fan out reassembly jobs.
 */
export const getDirectChildrenWithContext = (
	parentNodeId: string
): Promise<Array<{ id: string; branchPointMessageId: string | null }>> => {
	return prisma.node.findMany({
		where: {
			parentId: parentNodeId,
			deletedAt: null,
			inheritedContext: { not: null },
		},
		select: { id: true, branchPointMessageId: true },
	});
};

// ---------------------------------------------------------------------------
// Context panel data (updated for artifact-based selection)
// ---------------------------------------------------------------------------

/**
 * Build the data needed for the Context panel on a branched node.
 * Uses ContextArtifacts for each ancestor where available.
 */
export const buildContextPanelData = async (
	nodeId: string
): Promise<GetContextPanelOutput | null> => {
	const node = await prisma.node.findUnique({
		where: { id: nodeId },
		select: {
			inheritedContext: true,
			inheritedContextQuality: true,
			parentId: true,
			branchPointMessageId: true,
		},
	});

	if (!(node?.inheritedContext && node.parentId)) {
		return null;
	}

	const ancestry = await walkAncestry(node.parentId);
	const ancestorsNearestFirst = [...ancestry].reverse();

	let assembledFromFallback = false;
	const ancestryEntries: AncestorContextEntry[] = [];

	for (const ancestor of ancestorsNearestFirst) {
		const artifact = await getArtifact(ancestor.id);
		if (artifact?.promptReadyString) {
			ancestryEntries.push({
				nodeId: ancestor.id,
				nodeTitle: ancestor.title,
				shortTitle: artifact.shortTitle,
				keyTopics: artifact.keyTopics,
				summaryTypeUsed: "promptReady",
				qualitySignal: artifact.qualitySignal,
			});
		} else if (artifact?.highLevelSummary) {
			ancestryEntries.push({
				nodeId: ancestor.id,
				nodeTitle: ancestor.title,
				shortTitle: artifact.shortTitle,
				keyTopics: artifact.keyTopics,
				summaryTypeUsed: "highLevel",
				qualitySignal: artifact.qualitySignal,
			});
		} else if (ancestor.summaryDraft) {
			assembledFromFallback = true;
			ancestryEntries.push({
				nodeId: ancestor.id,
				nodeTitle: ancestor.title,
				shortTitle: null,
				keyTopics: [],
				summaryTypeUsed: "draft",
				qualitySignal: null,
			});
		} else {
			assembledFromFallback = true;
			ancestryEntries.push({
				nodeId: ancestor.id,
				nodeTitle: ancestor.title,
				shortTitle: null,
				keyTopics: [],
				summaryTypeUsed: "none",
				qualitySignal: null,
			});
		}
	}

	const lastRawMessages: GetContextPanelOutput["lastRawMessagesFromBranchPoint"] =
		[];

	if (node.branchPointMessageId) {
		const branchPointMessage = await prisma.message.findUnique({
			where: { id: node.branchPointMessageId },
			select: { createdAt: true },
		});

		if (branchPointMessage) {
			const rawMessages = await prisma.message.findMany({
				where: {
					nodeId: node.parentId,
					createdAt: { lte: branchPointMessage.createdAt },
				},
				orderBy: { createdAt: "desc" },
				take: RAW_MESSAGE_COUNT,
				select: { role: true, content: true },
			});

			for (const msg of rawMessages.reverse()) {
				lastRawMessages.push({ role: msg.role, content: msg.content });
			}
		}
	}

	return {
		hasInheritedContext: true,
		inheritedContextQuality: node.inheritedContextQuality,
		ancestry: ancestryEntries,
		lastRawMessagesFromBranchPoint: lastRawMessages,
		assembledFromFallback,
	};
};
