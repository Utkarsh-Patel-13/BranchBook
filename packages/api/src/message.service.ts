import prisma from "@nexus/db";
import type {
	CreateMessageInput,
	MessageListInput,
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

	return message;
};

export const listMessages = async (
	db: typeof prisma,
	input: MessageListInput & { userId: string }
): Promise<MessageType[]> => {
	await verifyNodeOwnership(input.nodeId, input.userId);

	return db.message.findMany({
		where: { nodeId: input.nodeId },
		orderBy: { createdAt: "asc" },
	});
};
