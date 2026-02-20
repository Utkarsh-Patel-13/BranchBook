import { Queue } from "bullmq";
import type { ContextEngineJobData, ContextEngineJobName } from "./job-types";

const connection = {
	host: process.env.REDIS_HOST ?? "localhost",
	port: Number(process.env.REDIS_PORT ?? 6379),
};

export const contextEngineQueue = new Queue<
	ContextEngineJobData,
	unknown,
	ContextEngineJobName
>("context-engine", {
	connection,
	defaultJobOptions: {
		attempts: 3,
		backoff: { type: "exponential", delay: 2000 },
		removeOnComplete: { count: 200 },
		removeOnFail: { count: 100 },
	},
});

export type {
	AssembleInheritedContextJobData,
	ContextEngineJobData,
	ContextEngineJobName,
	RunFullSummarizationJobData,
	SummarizeMessageJobData,
	UpgradeChildContextsJobData,
} from "./job-types";
