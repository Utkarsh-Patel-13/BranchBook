import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
	server: {
		DATABASE_URL: z.string().min(1),
		BETTER_AUTH_SECRET: z.string().min(32),
		BETTER_AUTH_URL: z.url(),
		CORS_ORIGIN: z.url(),
		GOOGLE_GENERATIVE_AI_API_KEY: z.string().min(1),
		NODE_ENV: z
			.enum(["development", "production", "test"])
			.default("development"),
		CONTEXT_SUMMARY_THRESHOLD: z.coerce
			.number()
			.int()
			.positive()
			.default(5)
			.optional(),
		REDIS_HOST: z.string().default("localhost"),
		REDIS_PORT: z.coerce.number().int().positive().default(6379),
		CONTEXT_TOKEN_BUDGET: z.coerce.number().int().positive().default(2000),
		CONTEXT_STALENESS_HOURS: z.coerce.number().int().positive().default(24),
	},
	runtimeEnv: process.env,
	emptyStringAsUndefined: true,
});
