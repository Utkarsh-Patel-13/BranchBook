import {
	assembleInheritedContext,
	buildRawMessageFallback,
	setInheritedContext,
} from "@branchbook/api/context-engine.service";
import type { AssembleInheritedContextJobData } from "@branchbook/queue";

/**
 * Job handler: assemble inherited context for a newly branched child node.
 *
 * 1. Calls assembleInheritedContext to build the context string.
 * 2. Stores the result on childNode.inheritedContext.
 * 3. Sets childNode.inheritedContextQuality based on worst quality source used.
 *
 * FR-013a: On any failure, falls back to raw messages from the branch point.
 * The child node is NEVER left without an inheritedContext.
 */
export const handleAssembleInheritedContext = async (
	data: AssembleInheritedContextJobData
): Promise<void> => {
	const { childNodeId, parentNodeId, branchPointMessageId } = data;

	try {
		const { context, worstQuality } = await assembleInheritedContext(
			childNodeId,
			parentNodeId,
			branchPointMessageId
		);
		await setInheritedContext(childNodeId, context, worstQuality);
	} catch {
		// FR-013a: fall back to raw messages on assembly failure
		let fallbackContext = "[context assembly failed]";
		try {
			fallbackContext = await buildRawMessageFallback(
				parentNodeId,
				branchPointMessageId
			);
		} catch {
			// keep placeholder; child node must never remain without inheritedContext
		}
		await setInheritedContext(childNodeId, fallbackContext, "MINIMAL");
	}
};
