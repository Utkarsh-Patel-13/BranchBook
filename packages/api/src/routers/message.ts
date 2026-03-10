import prisma from "@branchbook/db";
import {
	createMessageSchema,
	listMessagesSchema,
} from "@branchbook/validators";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../index";
import { createMessage, listMessages } from "../message.service";

export const messageRouter = router({
	create: protectedProcedure
		.input(createMessageSchema)
		.mutation(({ ctx, input }) => {
			if (!ctx.session?.user?.id) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "Authentication required",
				});
			}
			return createMessage(prisma, { ...input, userId: ctx.session.user.id });
		}),

	list: protectedProcedure.input(listMessagesSchema).query(({ ctx, input }) => {
		if (!ctx.session?.user?.id) {
			throw new TRPCError({
				code: "UNAUTHORIZED",
				message: "Authentication required",
			});
		}
		return listMessages(prisma, { ...input, userId: ctx.session.user.id });
	}),
});
