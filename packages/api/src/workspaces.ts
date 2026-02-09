import {
	workspaceCreateInputSchema,
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
	listWorkspaces,
	restoreWorkspace,
	updateWorkspace,
} from "./workspace.service";

export const workspaceRouter = router({
	create: protectedProcedure
		.input(workspaceCreateInputSchema)
		.output(workspaceSchema)
		.mutation(({ ctx, input }) => {
			if (!ctx.session?.user?.id) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "Authentication required to create workspaces.",
				});
			}

			return createWorkspace(ctx.session.user.id, input, ctx.logger);
		}),

	list: protectedProcedure
		.input(workspaceListInputSchema)
		.output(workspaceListOutputSchema)
		.query(({ ctx, input }) => {
			if (!ctx.session?.user?.id) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "Authentication required to list workspaces.",
				});
			}

			return listWorkspaces(ctx.session.user.id, input);
		}),

	getById: protectedProcedure
		.input(workspaceGetByIdInputSchema)
		.output(workspaceSchema)
		.query(async ({ ctx, input }) => {
			if (!ctx.session?.user?.id) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "Authentication required to access workspaces.",
				});
			}

			const workspace = await getWorkspaceById(ctx.session.user.id, input);

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
			if (!ctx.session?.user?.id) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "Authentication required to update workspaces.",
				});
			}

			const workspace = await updateWorkspace(
				ctx.session.user.id,
				input,
				ctx.logger
			);

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
			if (!ctx.session?.user?.id) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "Authentication required to delete workspaces.",
				});
			}

			const workspace = await deleteWorkspace(
				ctx.session.user.id,
				input,
				ctx.logger
			);

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
			if (!ctx.session?.user?.id) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "Authentication required to restore workspaces.",
				});
			}

			const workspace = await restoreWorkspace(
				ctx.session.user.id,
				input,
				ctx.logger
			);

			if (!workspace) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Workspace not found or no longer restorable.",
				});
			}

			return workspace;
		}),
});
