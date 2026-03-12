import { protectedProcedure, publicProcedure, router } from "../index";
import { nodeRouter } from "../nodes";
import { workspaceRouter } from "../workspaces";
import { messageRouter } from "./message";
import { noteRouter } from "./note";
import { suggestionRouter } from "./suggestion";

export const appRouter = router({
	healthCheck: publicProcedure.query(() => {
		return "OK";
	}),
	privateData: protectedProcedure.query(({ ctx }) => {
		return {
			message: "This is private",
			user: ctx.session.user,
		};
	}),
	workspace: workspaceRouter,
	node: nodeRouter,
	message: messageRouter,
	note: noteRouter,
	suggestion: suggestionRouter,
});
export type AppRouter = typeof appRouter;
