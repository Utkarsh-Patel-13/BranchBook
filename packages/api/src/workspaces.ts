import {
	workspaceCreateInputSchema,
	workspaceDeletedListOutputSchema,
	workspaceDeleteInputSchema,
	workspaceDeleteOutputSchema,
	workspaceGetByIdInputSchema,
	workspaceListInputSchema,
	workspaceListOutputSchema,
	workspaceRestoreInputSchema,
	workspaceSchema,
	workspaceUpdateInputSchema,
} from "@nexus/validators/workspaces";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "./index";
import {
	createWorkspace,
	deleteWorkspace,
	getWorkspaceById,
	listDeletedWorkspaces,
	listWorkspaces,
	restoreWorkspace,
	updateWorkspace,
} from "./workspace.service";

const requireUserId = (userId: string | undefined, message: string): string => {
	if (!userId) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message,
		});
	}

	return userId;
};

export const workspaceRouter = router({
	create: protectedProcedure
		.input(workspaceCreateInputSchema)
		.output(workspaceSchema)
		.mutation(({ ctx, input }) => {
			const userId = requireUserId(
				ctx.session?.user?.id,
				"Authentication required to create workspaces."
			);
			return createWorkspace(userId, input, ctx.logger);
		}),

	list: protectedProcedure
		.input(workspaceListInputSchema)
		.output(workspaceListOutputSchema)
		.query(({ ctx, input }) => {
			const userId = requireUserId(
				ctx.session?.user?.id,
				"Authentication required to list workspaces."
			);
			return listWorkspaces(userId, input);
		}),

	listDeleted: protectedProcedure
		.input(workspaceListInputSchema)
		.output(workspaceDeletedListOutputSchema)
		.query(({ ctx, input }) => {
			const userId = requireUserId(
				ctx.session?.user?.id,
				"Authentication required to list deleted workspaces."
			);
			return listDeletedWorkspaces(userId, input);
		}),

	getById: protectedProcedure
		.input(workspaceGetByIdInputSchema)
		.output(workspaceSchema)
		.query(async ({ ctx, input }) => {
			const userId = requireUserId(
				ctx.session?.user?.id,
				"Authentication required to access workspaces."
			);
			const workspace = await getWorkspaceById(userId, input);

			if (!workspace) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Workspace not found.",
				});
			}

			return workspace;
		}),

	update: protectedProcedure
		.input(workspaceUpdateInputSchema)
		.output(workspaceSchema)
		.mutation(async ({ ctx, input }) => {
			const userId = requireUserId(
				ctx.session?.user?.id,
				"Authentication required to update workspaces."
			);

			const workspace = await updateWorkspace(userId, input, ctx.logger);

			if (!workspace) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Workspace not found or not updatable.",
				});
			}

			return workspace;
		}),

	delete: protectedProcedure
		.input(workspaceDeleteInputSchema)
		.output(workspaceDeleteOutputSchema)
		.mutation(async ({ ctx, input }) => {
			const userId = requireUserId(
				ctx.session?.user?.id,
				"Authentication required to delete workspaces."
			);

			const workspace = await deleteWorkspace(userId, input, ctx.logger);

			if (!workspace) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Workspace not found or already deleted.",
				});
			}

			return {
				id: workspace.id,
				deletedAt: workspace.deletedAt,
			};
		}),

	restore: protectedProcedure
		.input(workspaceRestoreInputSchema)
		.output(workspaceSchema)
		.mutation(async ({ ctx, input }) => {
			const userId = requireUserId(
				ctx.session?.user?.id,
				"Authentication required to restore workspaces."
			);

			const workspace = await restoreWorkspace(userId, input, ctx.logger);

			if (!workspace) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Workspace not found or no longer restorable.",
				});
			}

			return workspace;
		}),
});
