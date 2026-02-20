import type {
	AssembleInheritedContextJobData,
	ContextEngineJobData,
	ContextEngineJobName,
	RunFullSummarizationJobData,
	SummarizeMessageJobData,
	UpgradeChildContextsJobData,
} from "@branchbook/queue";
import { type Job, Worker } from "bullmq";
import { handleAssembleInheritedContext } from "../jobs/assemble-inherited-context.job";
import { handleRunFullSummarization } from "../jobs/run-full-summarization.job";
import { handleSummarizeMessage } from "../jobs/summarize-message.job";
import { handleUpgradeChildContexts } from "../jobs/upgrade-child-contexts.job";

/**
 * Start the BullMQ worker for the `context-engine` queue.
 *
 * Dispatches jobs by name to the appropriate handler function.
 * Concurrency: 5 — processes up to 5 jobs simultaneously.
 *
 * @returns The running Worker instance (callers may await `waitUntilReady()`).
 */
export const startContextEngineWorker = () => {
	const connection = {
		host: process.env.REDIS_HOST ?? "localhost",
		port: Number(process.env.REDIS_PORT ?? 6379),
	};

	const worker = new Worker<ContextEngineJobData, void, ContextEngineJobName>(
		"context-engine",
		async (job: Job<ContextEngineJobData, void, ContextEngineJobName>) => {
			switch (job.name) {
				case "summarize-message":
					await handleSummarizeMessage(job.data as SummarizeMessageJobData);
					break;
				case "run-full-summarization":
					await handleRunFullSummarization(
						job.data as RunFullSummarizationJobData
					);
					break;
				case "assemble-inherited-context":
					await handleAssembleInheritedContext(
						job.data as AssembleInheritedContextJobData
					);
					break;
				case "upgrade-child-contexts":
					await handleUpgradeChildContexts(
						job.data as UpgradeChildContextsJobData
					);
					break;
				default:
					break;
			}
		},
		{ connection, concurrency: 5 }
	);

	worker.on("error", (err) => {
		console.error("[ERROR] context-engine worker error", err);
	});

	worker.on("failed", (job, err) => {
		console.warn("[WARN] context-engine job failed", {
			jobId: job?.id,
			jobName: job?.name,
			errMessage: err.message,
		});
	});

	return worker;
};
