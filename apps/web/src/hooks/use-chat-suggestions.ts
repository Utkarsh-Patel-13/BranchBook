import type { useChat } from "@ai-sdk/react";
import type { SuggestionSet } from "@branchbook/types";
import { useMutation } from "@tanstack/react-query";
import type { UIMessage } from "ai";
import { useEffect, useRef, useState } from "react";
import { trpc } from "@/utils/trpc";

interface UseChatSuggestionsParams {
	nodeId: string;
	messages: UIMessage[];
	status: ReturnType<typeof useChat>["status"];
}

export function useChatSuggestions({
	nodeId,
	messages,
	status,
}: UseChatSuggestionsParams) {
	const [suggestions, setSuggestions] = useState<SuggestionSet | null>(null);
	const [isGenerating, setIsGenerating] = useState(false);

	const dismissedForExchangeRef = useRef(false);
	const prevStatusRef = useRef(status);
	const prevMessagesLengthRef = useRef(messages.length);

	// Derive isGenerating from mutation state to avoid callback type conflicts
	const generateMutation = useMutation(
		trpc.suggestion.generate.mutationOptions()
	);

	// Sync external isGenerating state from mutation pending flag
	const isPending = generateMutation.isPending;
	useEffect(() => {
		setIsGenerating(isPending);
	}, [isPending]);

	// Sync suggestions when mutation succeeds
	const mutationData = generateMutation.data;
	useEffect(() => {
		if (mutationData) {
			setSuggestions(mutationData);
		}
	}, [mutationData]);

	// Use a ref so the effect doesn't need generate in its deps array
	const generateRef = useRef(generateMutation.mutate);
	generateRef.current = generateMutation.mutate;

	useEffect(() => {
		const prevStatus = prevStatusRef.current;
		const prevLength = prevMessagesLengthRef.current;

		prevStatusRef.current = status;
		prevMessagesLengthRef.current = messages.length;

		// Reset dismiss flag when a new AI response arrives (messages grew)
		if (messages.length > prevLength) {
			dismissedForExchangeRef.current = false;
		}

		// Only act on the transition to ready (AI finished responding)
		if (prevStatus === status || status !== "ready") {
			return;
		}

		if (dismissedForExchangeRef.current) {
			return;
		}

		const assistantCount = messages.filter(
			(m) => m.role === "assistant"
		).length;
		if (assistantCount < 3) {
			return;
		}

		const windowMessages = messages
			.slice(-10)
			.map((m) => ({
				role: m.role as "user" | "assistant",
				content: m.parts
					.filter((p): p is { type: "text"; text: string } => p.type === "text")
					.map((p) => p.text)
					.join(""),
			}))
			.filter((m) => m.content.length > 0);

		if (windowMessages.length > 0) {
			generateRef.current({ nodeId, messages: windowMessages });
		}
	}, [status, messages, nodeId]);

	const dismiss = () => {
		dismissedForExchangeRef.current = true;
		setSuggestions(null);
	};

	const clear = () => setSuggestions(null);

	return { suggestions, isGenerating, dismiss, clear };
}
