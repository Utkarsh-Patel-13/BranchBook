import { google } from "@ai-sdk/google";
import {
	appendToDraft,
	checkThresholdAndQueueResummarization,
} from "@nexus/api/summary.service";
import { auth } from "@nexus/auth";
import prisma from "@nexus/db";
import { env } from "@nexus/env/server";
import { convertToModelMessages, generateText, streamText } from "ai";
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

const chatBodySchema = z.object({
	nodeId: z.string().min(1),
	messages: z.array(z.unknown()),
	options: chatOptionsSchema,
});

const summarizeBodySchema = z.object({
	nodeId: z.string().min(1),
});

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
			reply.raw.setHeader("Access-Control-Allow-Origin", env.CORS_ORIGIN);
			reply.raw.setHeader("Access-Control-Allow-Credentials", "true");
			return reply.send({ html });
		} catch (err) {
			fastify.log.error({ err }, "Chat summarize failed");
			return reply.status(500).send({ error: "Summarization failed" });
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

		const { nodeId, messages, options } = parsed.data;

		const node = await prisma.node.findFirst({
			where: { id: nodeId, deletedAt: null },
			include: { workspace: { select: { ownerId: true } } },
		});

		if (!node || node.workspace.ownerId !== session.user.id) {
			return reply.status(403).send({ error: "Forbidden" });
		}

		const modelMessages = await convertToModelMessages(
			messages as Parameters<typeof convertToModelMessages>[0]
		);

		const useThinking = options?.thinking ?? false;
		const useWebSearch = options?.webSearch ?? false;
		const modelId = options?.model ?? DEFAULT_CHAT_MODEL;

		const model = google(modelId);

		const baseSystem =
			"You are a helpful assistant in Nexus, a knowledge workspace app. Be concise and accurate.";
		const systemPrompt = node.inheritedContext
			? `${node.inheritedContext}\n\n---\n\n${baseSystem}`
			: baseSystem;

		const result = streamText({
			model,
			system: systemPrompt,
			messages: modelMessages,
			...(useWebSearch && {
				tools: {
					google_search: google.tools.googleSearch({}),
				},
			}),
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
			onFinish: async ({ text, reasoningText, sources }) => {
				if (text) {
					const urlSources = sources.filter((s) => s.sourceType === "url");
					const sourcesData =
						urlSources.length > 0
							? urlSources.map((s) => ({
									sourceId: s.id,
									url: s.url,
									title: s.title ?? null,
								}))
							: null;

					// Summarize the response in a separate call so the main stream
					// remains plain unstructured text.
					let perMessageSummary: string | null = null;
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
							Capturing the key points for future context compression:\n\n${text}`,
						});
						perMessageSummary = summary;
					} catch {
						// Non-critical — proceed without a summary
					}

					await prisma.message.create({
						data: {
							nodeId,
							role: "ASSISTANT",
							content: text,
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
			},
		});

		reply.raw.setHeader("Access-Control-Allow-Origin", env.CORS_ORIGIN);
		reply.raw.setHeader("Access-Control-Allow-Credentials", "true");
		result.pipeUIMessageStreamToResponse(reply.raw, {
			sendSources: true,
			sendReasoning: true,
		});
	});
};
