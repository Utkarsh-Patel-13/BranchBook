import prisma from "@branchbook/db";
import type { AncestorContextEntry, ContextPanelData } from "@branchbook/types";

const RAW_MESSAGE_COUNT = 3;

interface AncestryNode {
	id: string;
	title: string;
	parentId: string | null;
	detailedSummary: string | null;
	highLevelSummary: string | null;
	summaryDraft: string | null;
	deletedAt: Date | null;
}

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
				detailedSummary: true,
				highLevelSummary: true,
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

/**
 * Determine which summary text and type to use for an ancestor at a given
 * depth-from-child (1 = direct parent/N-1, 2 = grandparent/N-2, 3+ = N-3+).
 */
const pickSummary = (
	node: Pick<
		AncestryNode,
		"detailedSummary" | "highLevelSummary" | "summaryDraft"
	>,
	depthFromChild: number
): { text: string; type: AncestorContextEntry["summaryTypeUsed"] } | null => {
	if (depthFromChild <= 2) {
		// N-1 and N-2: prefer detailed, fall back to draft
		if (node.detailedSummary) {
			return { text: node.detailedSummary, type: "detailed" };
		}
		if (node.summaryDraft) {
			return { text: node.summaryDraft, type: "draft" };
		}
		return null;
	}

	// N-3+: prefer high-level only
	if (node.highLevelSummary) {
		return { text: node.highLevelSummary, type: "highLevel" };
	}
	return null;
};

/**
 * Assemble the inherited context payload for a child node being branched.
 *
 * @param parentNodeId - The node being branched from (direct parent of child)
 * @param branchPointMessageId - The message the branch was created from, or null to branch from parent (use latest message)
 * @returns The formatted context string to store on the child node
 */
export const assembleContextPayload = async (
	parentNodeId: string,
	branchPointMessageId: string | null
): Promise<string> => {
	// Walk from root down to the parent node
	const ancestry = await walkAncestry(parentNodeId);

	// Ancestry ordered root → parent; we need depth from child (parent = 1)
	const parts: string[] = [];
	parts.push("# Ancestry Context\n");

	const ancestorsFromParent = [...ancestry].reverse(); // parent first

	for (let i = 0; i < ancestorsFromParent.length; i++) {
		const ancestor = ancestorsFromParent[i];
		if (!ancestor) {
			continue;
		}
		const depthFromChild = i + 1;
		const summary = pickSummary(ancestor, depthFromChild);

		if (summary) {
			parts.push(
				`## ${ancestor.title} (depth ${depthFromChild})\n${summary.text}\n`
			);
		}
	}

	// Resolve branch point: explicit message id or latest message in parent (branch from parent)
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

	if (effectiveBranchPoint) {
		const rawMessages = await prisma.message.findMany({
			where: {
				nodeId: parentNodeId,
				createdAt: { lte: effectiveBranchPoint.createdAt },
			},
			orderBy: { createdAt: "desc" },
			take: RAW_MESSAGE_COUNT,
			select: { role: true, content: true },
		});

		if (rawMessages.length > 0) {
			parts.push("\n# Recent Messages\n");
			for (const msg of rawMessages.reverse()) {
				parts.push(`**${msg.role}**: ${msg.content}\n`);
			}
		}
	}

	return parts.join("\n");
};

/**
 * Build the data needed for the Context panel on a branched node.
 */
export const buildContextPanelData = async (
	nodeId: string
): Promise<ContextPanelData | null> => {
	const node = await prisma.node.findUnique({
		where: { id: nodeId },
		select: {
			inheritedContext: true,
			parentId: true,
			branchPointMessageId: true,
		},
	});

	if (!(node?.inheritedContext && node.parentId)) {
		return null;
	}

	const ancestry = await walkAncestry(node.parentId);
	const ancestorsFromParent = [...ancestry].reverse();

	let assembledFromDraft = false;
	const ancestryEntries: AncestorContextEntry[] = [];

	for (let i = 0; i < ancestorsFromParent.length; i++) {
		const ancestor = ancestorsFromParent[i];
		if (!ancestor) {
			continue;
		}
		const depthFromChild = i + 1;
		const summary = pickSummary(ancestor, depthFromChild);
		if (summary) {
			if (summary.type === "draft") {
				assembledFromDraft = true;
			}
			ancestryEntries.push({
				nodeId: ancestor.id,
				title: ancestor.title,
				summaryTypeUsed: summary.type,
			});
		}
	}

	const lastRawMessages: ContextPanelData["lastRawMessagesFromBranchPoint"] =
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
		ancestry: ancestryEntries,
		lastRawMessagesFromBranchPoint: lastRawMessages,
		assembledFromDraft,
	};
};
