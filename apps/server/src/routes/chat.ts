import { google } from "@ai-sdk/google";
import { auth } from "@nexus/auth";
import prisma from "@nexus/db";
import { env } from "@nexus/env/server";
import { convertToModelMessages, streamText } from "ai";
import type { FastifyInstance } from "fastify";
import { z } from "zod";

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

		const result = streamText({
			model,
			system:
				"You are a helpful assistant in Nexus, a knowledge workspace app. Be concise and accurate.",
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
			onFinish: async ({ text }) => {
				if (text) {
					await prisma.message.create({
						data: {
							nodeId,
							role: "ASSISTANT",
							content: text,
						},
					});
				}
			},
		});

		reply.raw.setHeader("Access-Control-Allow-Origin", env.CORS_ORIGIN);
		reply.raw.setHeader("Access-Control-Allow-Credentials", "true");
		result.pipeUIMessageStreamToResponse(reply.raw, { sendSources: true });
	});
};
