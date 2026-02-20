import { google } from "@ai-sdk/google";
import {
	appendToDraft,
	checkThresholdAndQueueResummarization,
} from "@branchbook/api/summary.service";
import { auth } from "@branchbook/auth";
import prisma from "@branchbook/db";
import { env } from "@branchbook/env/server";
import type { UIMessage } from "ai";
import {
	convertToModelMessages,
	createIdGenerator,
	generateText,
	streamText,
	TypeValidationError,
	validateUIMessages,
} from "ai";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { runResummarization } from "../jobs/resummarize";

const CHAT_MODEL_IDS = [
	"gemini-2.0-flash",
	"gemini-2.5-pro",
	"gemini-2.5-flash-lite-preview-09-2025",
	"gemini-2.5-flash-preview-09-2025",
	"gemini-3-flash-preview",
	"gemini-3-pro-preview",
] as const;

const DEFAULT_CHAT_MODEL = "gemini-2.5-flash-lite-preview-09-2025";

const chatOptionsSchema = z
	.object({
		model: z
			.string()
			.refine((id) =>
				CHAT_MODEL_IDS.includes(id as (typeof CHAT_MODEL_IDS)[number])
			)
			.optional()
			.default(DEFAULT_CHAT_MODEL),
		thinking: z.boolean().optional().default(false),
		webSearch: z.boolean().optional().default(false),
	})
	.optional();

const incomingUserMessagePartSchema = z.object({
	type: z.literal("text"),
	text: z.string(),
});

const chatBodySchema = z.object({
	id: z.string().min(1),
	message: z.object({
		role: z.literal("user"),
		parts: z
			.array(incomingUserMessagePartSchema)
			.min(1, "At least one text part required"),
	}),
	options: chatOptionsSchema,
});

const summarizeBodySchema = z.object({
	nodeId: z.string().min(1),
});

const inlineEditBodySchema = z.object({
	selectedHtml: z.string().min(1).max(25_000),
	instruction: z.string().max(500).optional(),
});

const INLINE_EDIT_SYSTEM = `You are editing a note fragment. Output ONLY a raw HTML fragment.
Use ONLY these tags: <p>, <h1>, <h2>, <h3>, <blockquote>, <ul>, <ol>, <li>, <a href="...">, <code>, <pre>, <strong>, <em>, <u>, <s>, <span>.
Do NOT use: <html>, <body>, <head>, <meta>, or any document wrappers.
Preserve the original formatting where it makes sense. Output just the fragment with no extra explanation.`;

const LEXICAL_HTML_INSTRUCTIONS = `Generate study notes from the discussion. Output ONLY a raw HTML fragment.
Use ONLY these tags: <p>, <h1>, <h2>, <h3>, <blockquote>, <ul>, <ol>, <li>, <a href="...">, <code>, <pre>, <strong>, <em>, <u>, <s>, <span>.
Do NOT use: <html>, <body>, <head>, <meta>, or any other tags.
Structure the content with headings and paragraphs for clarity. Output just the fragment, no document wrapper. The text should be only the note text, no additional info text or markup. Direct notes.`;

function stripDocumentWrapper(html: string): string {
	let out = html.trim();
	out = out.replace(/<\/?html[^>]*>/gi, "");
	out = out.replace(/<\/?body[^>]*>/gi, "");
	out = out.replace(/<head[^>]*>[\s\S]*?<\/head>/gi, "");
	out = out.replace(/<meta[^>]*>/gi, "");
	return out.trim();
}

async function loadChat(nodeId: string): Promise<UIMessage[]> {
	const rows = await prisma.message.findMany({
		where: { nodeId },
		orderBy: { createdAt: "asc" },
		select: {
			id: true,
			role: true,
			content: true,
			reasoning: true,
			sources: true,
			createdAt: true,
		},
	});
	return rows.map((m) => {
		const parts: UIMessage["parts"] = [];
		if (m.role === "ASSISTANT" && m.reasoning) {
			parts.push({ type: "reasoning", text: m.reasoning, state: "done" });
		}
		parts.push({ type: "text", text: m.content, state: "done" });
		if (m.role === "ASSISTANT" && m.sources && Array.isArray(m.sources)) {
			for (const s of m.sources as Array<{
				sourceId: string;
				url: string;
				title?: string | null;
			}>) {
				parts.push({
					type: "source-url",
					sourceId: s.sourceId,
					url: s.url,
					title: s.title ?? undefined,
				});
			}
		}
		return {
			id: m.id,
			role: m.role === "USER" ? ("user" as const) : ("assistant" as const),
			parts,
			metadata: { createdAt: m.createdAt },
		};
	});
}

type UIMessagePart = UIMessage["parts"][number];

async function persistNewMessages(
	nodeId: string,
	previousCount: number,
	finishedMessages: UIMessage[]
): Promise<void> {
	const toPersist = finishedMessages.slice(previousCount);
	if (toPersist.length < 2) {
		return;
	}
	const userMsg = toPersist[0];
	const assistantMsg = toPersist[1];
	if (!(userMsg && assistantMsg)) {
		return;
	}
	if (userMsg.role !== "user" || assistantMsg.role !== "assistant") {
		return;
	}

	const userContent = userMsg.parts
		.map((p: UIMessagePart) => (p.type === "text" ? p.text : ""))
		.join("");
	await prisma.message.create({
		data: {
			id: userMsg.id,
			nodeId,
			role: "USER",
			content: userContent,
		},
	});

	const assistantText = assistantMsg.parts
		.map((p: UIMessagePart) => (p.type === "text" ? p.text : ""))
		.join("");
	const reasoningPart = assistantMsg.parts.find(
		(p: UIMessagePart) => p.type === "reasoning"
	);
	const reasoningText =
		reasoningPart && reasoningPart.type === "reasoning"
			? reasoningPart.text
			: null;
	const sourceParts = assistantMsg.parts.filter(
		(
			p: UIMessagePart
		): p is {
			type: "source-url";
			sourceId: string;
			url: string;
			title?: string;
		} => p.type === "source-url"
	);
	const sourcesData =
		sourceParts.length > 0
			? sourceParts.map(
					(s: { sourceId: string; url: string; title?: string }) => ({
						sourceId: s.sourceId,
						url: s.url,
						title: s.title ?? null,
					})
				)
			: null;

	let perMessageSummary: string | null = null;
	if (assistantText) {
		try {
			const { text: summary } = await generateText({
				model: google("gemini-2.0-flash"),
				prompt: `Summarize the following assistant response in 1-3 sentences, 
							try to capture the topic and the gist of the message, 
							if message is simple such as greetings or simple questions, just summarize the message as a whole. 
							Keep it short and concise, do not include any other information such as the user's name or anything personal.
							Avoid using any emojis or special characters. 
							Do not include things like "the assistant" or "the user" or "the repsonse is about" in the summary.
							Just capture the summary of the message as if writing in a notebook.
							Capturing the key points for future context compression:\n\n${assistantText}`,
			});
			perMessageSummary = summary;
		} catch {
			// Non-critical
		}
	}

	await prisma.message.create({
		data: {
			id: assistantMsg.id,
			nodeId,
			role: "ASSISTANT",
			content: assistantText,
			reasoning: reasoningText ?? null,
			// biome-ignore lint/suspicious/noExplicitAny: Prisma Json type requires cast
			sources: sourcesData as any,
			perMessageSummary,
		},
	});

	if (perMessageSummary) {
		await appendToDraft(nodeId, perMessageSummary);
		await checkThresholdAndQueueResummarization(nodeId, (id) => {
			runResummarization(id).catch(console.error);
		});
	}
}

type ChatOptions = z.infer<typeof chatOptionsSchema>;
type IncomingUserMessage = z.infer<typeof chatBodySchema>["message"];

async function prepareChatRequest(
	nodeId: string,
	incomingMessage: IncomingUserMessage,
	options: ChatOptions | undefined,
	node: { inheritedContext: string | null }
): Promise<{
	validatedMessages: UIMessage[];
	previousCount: number;
	generateMessageId: ReturnType<typeof createIdGenerator>;
	modelId: string;
	systemPrompt: string;
	useWebSearch: boolean;
	useThinking: boolean;
}> {
	const userText = incomingMessage.parts
		.map((p) => (p.type === "text" ? p.text : ""))
		.join("")
		.trim();
	if (!userText) {
		throw new Error("Message text is required");
	}
	const generateMessageId = createIdGenerator({ size: 16 });
	const previousMessages = await loadChat(nodeId);
	const newUserMessage: UIMessage = {
		id: generateMessageId(),
		role: "user",
		parts: [{ type: "text", text: userText, state: "done" }],
	};
	const messages: UIMessage[] = [...previousMessages, newUserMessage];
	const useThinking = options?.thinking ?? false;
	const useWebSearch = options?.webSearch ?? false;
	const modelId = options?.model ?? DEFAULT_CHAT_MODEL;
	let validatedMessages: UIMessage[];
	try {
		validatedMessages = await validateUIMessages({ messages });
	} catch (err) {
		if (err instanceof TypeValidationError) {
			validatedMessages = messages;
		} else {
			throw err;
		}
	}
	const baseSystem =
		"You are a helpful assistant in branchbook, a knowledge workspace app. Be concise and accurate.";
	const systemPrompt = node.inheritedContext
		? `${node.inheritedContext}\n\n---\n\n${baseSystem}`
		: baseSystem;
	return {
		validatedMessages,
		previousCount: previousMessages.length,
		generateMessageId,
		modelId,
		systemPrompt,
		useWebSearch,
		useThinking,
	};
}

export const registerChatRoute = (fastify: FastifyInstance): void => {
	fastify.post("/api/chat/summarize", async (request, reply) => {
		const session = await auth.api.getSession({
			headers: new Headers(
				Object.entries(request.headers).flatMap(([k, v]) => {
					if (Array.isArray(v)) {
						return v.map((val): [string, string] => [k, val]);
					}
					return v ? [[k, v] as [string, string]] : [];
				})
			),
		});

		if (!session?.user?.id) {
			return reply.status(401).send({ error: "Unauthorized" });
		}

		const parsed = summarizeBodySchema.safeParse(request.body);
		if (!parsed.success) {
			return reply.status(400).send({ error: "Invalid request body" });
		}

		const { nodeId } = parsed.data;

		const node = await prisma.node.findFirst({
			where: { id: nodeId, deletedAt: null },
			include: { workspace: { select: { ownerId: true } } },
		});

		if (!node || node.workspace.ownerId !== session.user.id) {
			return reply.status(403).send({ error: "Forbidden" });
		}

		const messages = await prisma.message.findMany({
			where: { nodeId },
			orderBy: { createdAt: "asc" },
			select: { role: true, content: true },
		});

		if (messages.length === 0) {
			return reply.status(400).send({ error: "No messages to summarize" });
		}

		const conversationText = messages
			.map((m) => {
				const label = m.role === "USER" ? "User" : "Assistant";
				return `${label}:\n${m.content}`;
			})
			.join("\n\n---\n\n");

		try {
			const { text } = await generateText({
				model: google("gemini-2.5-flash-lite-preview-09-2025"),
				system: LEXICAL_HTML_INSTRUCTIONS,
				prompt: `Discussion:\n\n${conversationText}`,
			});

			const html = stripDocumentWrapper(text);
			reply.raw.setHeader(
				"Access-Control-Allow-Origin",
				request.headers.origin ?? env.CORS_ORIGIN
			);
			reply.raw.setHeader("Access-Control-Allow-Credentials", "true");
			return reply.send({ html });
		} catch (err) {
			fastify.log.error({ err }, "Chat summarize failed");
			return reply.status(500).send({ error: "Summarization failed" });
		}
	});

	fastify.post("/api/chat/inline-edit", async (request, reply) => {
		const session = await auth.api.getSession({
			headers: new Headers(
				Object.entries(request.headers).flatMap(([k, v]) => {
					if (Array.isArray(v)) {
						return v.map((val): [string, string] => [k, val]);
					}
					return v ? [[k, v] as [string, string]] : [];
				})
			),
		});

		if (!session?.user?.id) {
			return reply.status(401).send({ error: "Unauthorized" });
		}

		const parsed = inlineEditBodySchema.safeParse(request.body);
		if (!parsed.success) {
			return reply.status(400).send({ error: "Invalid request body" });
		}

		const { selectedHtml, instruction } = parsed.data;

		const prompt = instruction
			? `Rewrite the following text according to this instruction: "${instruction}"\n\nText to rewrite:\n${selectedHtml}`
			: `Rephrase the following text:\n\n${selectedHtml}`;

		try {
			const { text } = await generateText({
				model: google("gemini-2.5-flash-lite-preview-09-2025"),
				system: INLINE_EDIT_SYSTEM,
				prompt,
			});

			const html = stripDocumentWrapper(text);
			reply.raw.setHeader(
				"Access-Control-Allow-Origin",
				request.headers.origin ?? env.CORS_ORIGIN
			);
			reply.raw.setHeader("Access-Control-Allow-Credentials", "true");
			return reply.send({ html });
		} catch (err) {
			fastify.log.error({ err }, "Inline edit failed");
			return reply.status(500).send({ error: "Inline edit failed" });
		}
	});

	fastify.post("/api/chat", async (request, reply) => {
		const session = await auth.api.getSession({
			headers: new Headers(
				Object.entries(request.headers).flatMap(([k, v]) => {
					if (Array.isArray(v)) {
						return v.map((val): [string, string] => [k, val]);
					}
					return v ? [[k, v] as [string, string]] : [];
				})
			),
		});

		if (!session?.user?.id) {
			return reply.status(401).send({ error: "Unauthorized" });
		}

		const parsed = chatBodySchema.safeParse(request.body);
		if (!parsed.success) {
			return reply.status(400).send({ error: "Invalid request body" });
		}

		const { id: nodeId, message: incomingMessage, options } = parsed.data;

		const node = await prisma.node.findFirst({
			where: { id: nodeId, deletedAt: null },
			include: { workspace: { select: { ownerId: true } } },
		});

		if (!node || node.workspace.ownerId !== session.user.id) {
			return reply.status(403).send({ error: "Forbidden" });
		}

		let prepared: Awaited<ReturnType<typeof prepareChatRequest>>;
		try {
			prepared = await prepareChatRequest(
				nodeId,
				incomingMessage,
				options,
				node
			);
		} catch (err) {
			if (err instanceof Error && err.message === "Message text is required") {
				return reply.status(400).send({ error: err.message });
			}
			throw err;
		}

		const {
			validatedMessages,
			previousCount,
			generateMessageId,
			modelId,
			systemPrompt,
			useWebSearch,
			useThinking,
		} = prepared;

		const modelMessages = await convertToModelMessages(validatedMessages);
		const model = google(modelId);
		const tools = useWebSearch
			? { google_search: google.tools.googleSearch({}) }
			: undefined;
		const result = streamText({
			model,
			system: systemPrompt,
			messages: modelMessages,
			...(useWebSearch && { tools }),
			...(useThinking && {
				providerOptions: {
					google: {
						thinkingConfig: {
							thinkingBudget: 8192,
							includeThoughts: true,
						},
					},
				},
			}),
		});

		result.consumeStream();

		reply.hijack();
		reply.raw.setHeader(
			"Access-Control-Allow-Origin",
			request.headers.origin ?? env.CORS_ORIGIN
		);
		reply.raw.setHeader("Access-Control-Allow-Credentials", "true");
		result.pipeUIMessageStreamToResponse(reply.raw, {
			originalMessages: validatedMessages,
			generateMessageId,
			sendSources: true,
			sendReasoning: true,
			onFinish: async ({ messages: finishedMessages, isAborted }) => {
				if (!isAborted) {
					await persistNewMessages(nodeId, previousCount, finishedMessages);
				}
			},
		});
	});
};
