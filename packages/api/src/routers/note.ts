import prisma from "@nexus/db";
import {
	getByNodeIdInputSchema,
	removeNoteInputSchema,
	upsertNoteInputSchema,
} from "@nexus/validators";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../index";
import { getNoteByNodeId, removeNote, upsertNote } from "../note.service";

export const noteRouter = router({
	getByNodeId: protectedProcedure
		.input(getByNodeIdInputSchema)
		.query(({ ctx, input }) => {
			if (!ctx.session?.user?.id) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "Authentication required",
				});
			}
			return getNoteByNodeId(prisma, ctx.session.user.id, input);
		}),

	upsert: protectedProcedure
		.input(upsertNoteInputSchema)
		.mutation(({ ctx, input }) => {
			if (!ctx.session?.user?.id) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "Authentication required",
				});
			}
			return upsertNote(prisma, ctx.session.user.id, input);
		}),

	remove: protectedProcedure
		.input(removeNoteInputSchema)
		.mutation(({ ctx, input }) => {
			if (!ctx.session?.user?.id) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "Authentication required",
				});
			}
			return removeNote(prisma, ctx.session.user.id, input);
		}),
});
