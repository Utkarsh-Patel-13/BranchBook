import {
	generateSuggestionsInputSchema,
	generateSuggestionsOutputSchema,
} from "@branchbook/validators";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../index";
import { getNodeById } from "../node.service";
import { generateSuggestions } from "../suggestions.service";

export const suggestionRouter = router({
	generate: protectedProcedure
		.input(generateSuggestionsInputSchema)
		.output(generateSuggestionsOutputSchema)
		.mutation(async ({ ctx, input }) => {
			const node = await getNodeById(ctx.session.user.id, {
				nodeId: input.nodeId,
			});

			if (!node) {
				throw new TRPCError({ code: "NOT_FOUND" });
			}

			return generateSuggestions(input);
		}),
});
