import { z } from "zod";

export const conversationMessageSchema = z.object({
	role: z.enum(["user", "assistant"]),
	content: z.string().min(1).max(10_000),
});

/**
 * Input to suggestion.generate.
 * The client is responsible for filtering to the last 10 messages before sending,
 * and NOT calling this mutation when assistantMessageCount < 3.
 */
export const generateSuggestionsInputSchema = z.object({
	nodeId: z.string().uuid(),
	messages: z.array(conversationMessageSchema).min(1).max(10),
});

export type GenerateSuggestionsInput = z.infer<
	typeof generateSuggestionsInputSchema
>;

/**
 * Structured output the LLM must produce (validated via Output.object).
 * Also used as the tRPC mutation output schema.
 */
export const generateSuggestionsOutputSchema = z.object({
	followUps: z.array(z.string().min(1).max(100)).max(3),
	branchSuggestion: z
		.object({
			label: z.string().min(1).max(60),
			contextSeed: z.string().min(1).max(500),
		})
		.nullable(),
});
