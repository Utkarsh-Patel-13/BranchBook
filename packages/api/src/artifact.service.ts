import { CONTEXT_STALENESS_HOURS } from "@branchbook/config";
import prisma from "@branchbook/db";
import type { ContextArtifact, ContextQualitySignal } from "@branchbook/types";

export interface UpsertArtifactData {
	nodeId: string;
	shortTitle: string;
	narrativeSummary: string;
	keyTopics: string[];
	keyDecisions: string[];
	promptReadyString: string;
	highLevelSummary: string;
	qualitySignal?: ContextQualitySignal;
}

/**
 * Create or update the ContextArtifact for a node.
 * On update, `artifactVersion` is incremented and `lastProcessedAt` is refreshed.
 */
export const upsertArtifact = (
	data: UpsertArtifactData
): Promise<ContextArtifact> => {
	const { nodeId, qualitySignal = "MINIMAL", ...rest } = data;
	return prisma.contextArtifact.upsert({
		where: { nodeId },
		update: {
			...rest,
			qualitySignal,
			lastProcessedAt: new Date(),
			artifactVersion: { increment: 1 },
		},
		create: {
			nodeId,
			...rest,
			qualitySignal,
		},
	}) as Promise<ContextArtifact>;
};

/**
 * Retrieve the ContextArtifact for a node.
 *
 * Side-effect: if the artifact was last processed more than
 * `CONTEXT_STALENESS_HOURS` ago and its signal is FRESH,
 * it is automatically downgraded to STALE before being returned.
 */
export const getArtifact = async (
	nodeId: string
): Promise<ContextArtifact | null> => {
	const artifact = await prisma.contextArtifact.findUnique({
		where: { nodeId },
	});

	if (!artifact) {
		return null;
	}

	const stalenessMs = CONTEXT_STALENESS_HOURS * 60 * 60 * 1000;
	const isStale = Date.now() - artifact.lastProcessedAt.getTime() > stalenessMs;

	if (isStale && artifact.qualitySignal === "FRESH") {
		return updateQualitySignal(nodeId, "STALE");
	}

	return artifact as ContextArtifact;
};

/**
 * Update only the quality signal on an existing artifact.
 */
export const updateQualitySignal = (
	nodeId: string,
	signal: ContextQualitySignal
): Promise<ContextArtifact> => {
	return prisma.contextArtifact.update({
		where: { nodeId },
		data: { qualitySignal: signal },
	}) as Promise<ContextArtifact>;
};

/**
 * Bulk-mark artifacts STALE where `lastProcessedAt` is older than the
 * staleness window and `qualitySignal` is currently FRESH.
 * Returns the number of records updated.
 * Optionally scoped to a single workspace via `workspaceId`.
 */
export const markStaleArtifacts = async (
	workspaceId?: string
): Promise<number> => {
	const cutoff = new Date(
		Date.now() - CONTEXT_STALENESS_HOURS * 60 * 60 * 1000
	);

	const { count } = await prisma.contextArtifact.updateMany({
		where: {
			qualitySignal: "FRESH",
			lastProcessedAt: { lt: cutoff },
			...(workspaceId ? { node: { workspaceId } } : {}),
		},
		data: { qualitySignal: "STALE" },
	});

	return count;
};
