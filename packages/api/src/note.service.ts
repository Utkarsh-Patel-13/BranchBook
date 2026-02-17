import prisma from "@branchbook/db";
import type {
	GetByNodeIdInput,
	NoteOutput,
	RemoveNoteInput,
	UpsertNoteInput,
} from "@branchbook/validators";
import { TRPCError } from "@trpc/server";

const verifyNodeAccess = async (
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

export const getNoteByNodeId = async (
	db: typeof prisma,
	userId: string,
	input: GetByNodeIdInput
): Promise<NoteOutput | null> => {
	await verifyNodeAccess(input.nodeId, userId);

	const note = await db.note.findFirst({
		where: { nodeId: input.nodeId, deletedAt: null },
	});

	return note ?? null;
};

export const upsertNote = async (
	db: typeof prisma,
	userId: string,
	input: UpsertNoteInput
): Promise<NoteOutput> => {
	await verifyNodeAccess(input.nodeId, userId);

	const note = await db.note.upsert({
		where: { nodeId: input.nodeId },
		update: { content: input.content, deletedAt: null },
		create: { nodeId: input.nodeId, content: input.content },
	});

	return note;
};

export const removeNote = async (
	db: typeof prisma,
	userId: string,
	input: RemoveNoteInput
): Promise<{ deleted: true }> => {
	await verifyNodeAccess(input.nodeId, userId);

	await db.note.updateMany({
		where: { nodeId: input.nodeId, deletedAt: null },
		data: { deletedAt: new Date() },
	});

	return { deleted: true };
};
