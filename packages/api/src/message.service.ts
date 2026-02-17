import prisma from "@nexus/db";
import type {
	CreateMessageInput,
	MessageListInput,
	MessageListOutput,
	MessageType,
} from "@nexus/types";
import { TRPCError } from "@trpc/server";

const verifyNodeOwnership = async (
	nodeId: string,
	userId: string
): Promise<void> => {
	const node = await prisma.node.findFirst({
		where: { id: nodeId, deletedAt: null },
		include: { workspace: { select: { ownerId: true } } },
	});

	if (!node || node.workspace.ownerId !== userId) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Node not found or access denied",
		});
	}
};

export const createMessage = async (
	db: typeof prisma,
	input: CreateMessageInput & { userId: string }
): Promise<MessageType> => {
	await verifyNodeOwnership(input.nodeId, input.userId);

	const message = await db.message.create({
		data: {
			nodeId: input.nodeId,
			role: "USER",
			content: input.content,
		},
	});

	// biome-ignore lint/suspicious/noExplicitAny: Prisma Json type requires cast
	return message as any;
};

export const listMessages = async (
	db: typeof prisma,
	input: MessageListInput & { userId: string }
): Promise<MessageListOutput> => {
	await verifyNodeOwnership(input.nodeId, input.userId);

	const limit = input.limit ?? 50;

	const messages = await db.message.findMany({
		where: { nodeId: input.nodeId },
		orderBy: { createdAt: "asc" },
		take: limit,
		...(input.cursor ? { skip: 1, cursor: { id: input.cursor } } : {}),
	});

	// biome-ignore lint/suspicious/noExplicitAny: Prisma Json type requires cast
	const items = messages as any as MessageType[];
	const nextCursor = items.length === limit ? (items.at(-1)?.id ?? null) : null;

	return { items, nextCursor };
};
