import { google } from "@ai-sdk/google";
import type { SuggestionSet } from "@branchbook/types";
import {
	type GenerateSuggestionsInput,
	generateSuggestionsOutputSchema,
} from "@branchbook/validators";
import { generateText, Output } from "ai";

const SYSTEM_PROMPT = `You are a conversation analyst embedded in a knowledge workspace tool called BranchBook.
Users have hierarchical conversations organised into "nodes". Your job is to analyse
a recent conversation and suggest what the user might want to explore next.

You produce two types of suggestions:
1. **Follow-ups** — short questions or topic phrases the user can continue in the same chat.
2. **Branch suggestion** — a single sub-topic that has emerged and would benefit from its
   own dedicated conversation space (a new child node).

Rules:
- Only output follow-ups if the conversation is substantive enough to suggest clear next steps.
- Only output a branch suggestion if a DISTINCT sub-topic has genuinely emerged — not just a
  deeper question on the same topic. The sub-topic must be meaningful enough to stand alone.
- If the conversation is focused and on-track with no branching opportunities, return an
  empty followUps array and null branchSuggestion. DO NOT force suggestions.
- Follow-up text: ≤100 characters. Phrase as a question or short topic.
- Branch label: ≤60 characters. A concise sub-topic name.
- Branch contextSeed: ≤500 characters. A framing prompt that gives enough context to
  start a productive conversation in a new node without the full parent history.
- Output at most 3 follow-ups and at most 1 branch suggestion.
- Prefer quality over quantity — 1–2 excellent follow-ups beats 3 mediocre ones.`;

/**
 * Call the LLM to generate conversation suggestions.
 * On any error, returns an empty suggestion set — never throws.
 */
export const generateSuggestions = async (
	input: GenerateSuggestionsInput
): Promise<SuggestionSet> => {
	try {
		const formattedMessages = input.messages
			.map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
			.join("\n\n");

		const { output } = await generateText({
			model: google("gemini-2.5-flash"),
			output: Output.object({ schema: generateSuggestionsOutputSchema }),
			system: SYSTEM_PROMPT,
			prompt: `Here is the recent conversation (last ${input.messages.length} messages):\n\n${formattedMessages}\n\nBased on this conversation, generate suggestions according to your instructions.\nReturn only the JSON object matching the required schema.`,
		});

		return output;
	} catch {
		return { followUps: [], branchSuggestion: null };
	}
};
