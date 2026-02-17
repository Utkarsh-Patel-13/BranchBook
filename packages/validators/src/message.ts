import { z } from "zod";

export const listMessagesSchema = z.object({
	nodeId: z.string().min(1),
	cursor: z.string().optional(),
	limit: z.number().int().min(1).max(50).optional().default(50),
});

export const createMessageSchema = z.object({
	nodeId: z.string().min(1),
	content: z.string().min(1).max(4000),
});

/**
 * Structured output schema for AI chat responses.
 * Used so the model returns both the conversational reply
 * and a short per-message summary in a single call.
 */
export const aiChatResponseSchema = z.object({
	reply: z.string().describe("The full conversational assistant response"),
	perMessageSummary: z
		.string()
		.describe(
			"A short (1-3 sentence) summary of the key points in this response, for context compression"
		),
});

/**
 * Structured output schema for resummarization.
 * Used when the summary draft threshold is reached
 * to compress accumulated per-message summaries.
 */
export const resummarizationOutputSchema = z.object({
	detailedSummary: z
		.string()
		.describe(
			"A detailed summary covering key topics, decisions, and conversation flow"
		),
	highLevelSummary: z
		.string()
		.describe("A short topic-level gist of the conversation (1-2 sentences)"),
});

export type ListMessagesInput = z.infer<typeof listMessagesSchema>;
export type CreateMessageInput = z.infer<typeof createMessageSchema>;
export type AiChatResponse = z.infer<typeof aiChatResponseSchema>;
export type ResummarizationOutput = z.infer<typeof resummarizationOutputSchema>;
