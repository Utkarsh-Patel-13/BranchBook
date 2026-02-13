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

const chatOptionsSchema = z
	.object({
		thinking: z.boolean().optional().default(false),
		webSearch: z.boolean().optional().default(false),
	})
	.optional();

const chatBodySchema = z.object({
	nodeId: z.string().min(1),
	messages: z.array(z.unknown()),
	options: chatOptionsSchema,
});

export const registerChatRoute = (fastify: FastifyInstance): void => {
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

		const model = useThinking
			? google("gemini-2.5-flash")
			: google("gemini-2.0-flash");

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
