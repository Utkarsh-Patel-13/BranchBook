import { getDirectChildrenWithContext } from "@branchbook/api/context-engine.service";
import type {
	AssembleInheritedContextJobData,
	UpgradeChildContextsJobData,
} from "@branchbook/queue";
import { contextEngineQueue } from "@branchbook/queue";

/**
 * Job handler: fan-out context reassembly to all direct children of a node.
 *
 * After a parent node's artifact is updated (FRESH), this enqueues
 * assemble-inherited-context for each direct child that already has
 * an inheritedContext — upgrading their context with the new parent artifact.
 *
 * No recursive cascading: each child triggers its own upgrade when its
 * artifact updates.
 */
export const handleUpgradeChildContexts = async (
	data: UpgradeChildContextsJobData
): Promise<void> => {
	const { parentNodeId, workspaceId } = data;

	const children = await getDirectChildrenWithContext(parentNodeId);

	for (const child of children) {
		const jobData: AssembleInheritedContextJobData = {
			childNodeId: child.id,
			parentNodeId,
			branchPointMessageId: child.branchPointMessageId,
			workspaceId,
		};
		await contextEngineQueue.add("assemble-inherited-context", jobData);
	}
};
