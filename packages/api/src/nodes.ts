import {
	branchFromMessageSchema,
	createNodeInputSchema,
	deleteNodeInputSchema,
	getBranchesForNodeOutputSchema,
	getContextForPanelInputSchema,
	getContextForPanelOutputSchema,
	getNodeByIdInputSchema,
	getTreeInputSchema,
	listNodesInputSchema,
	nodeOutputSchema,
	nodeTreeOutputSchema,
	updateNodeInputSchema,
} from "@nexus/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { buildContextPanelData } from "./context-engine.service";
import { protectedProcedure, router } from "./index";
import {
	createBranchFromMessage,
	createNode,
	deleteNodeCascade,
	getBranchesForNode,
	getNodeById,
	getNodeTree,
	listNodes,
	updateNode,
} from "./node.service";

export const nodeRouter = router({
	create: protectedProcedure
		.input(createNodeInputSchema)
		.output(nodeOutputSchema)
		.mutation(({ ctx, input }) => {
			if (!ctx.session?.user?.id) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "Authentication required to create nodes.",
				});
			}

			return createNode(ctx.session.user.id, input);
		}),

	list: protectedProcedure
		.input(listNodesInputSchema)
		.output(
			z.array(
				nodeOutputSchema.extend({
					childCount: z.number().optional(),
				})
			)
		)
		.query(({ ctx, input }) => {
			if (!ctx.session?.user?.id) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "Authentication required to list nodes.",
				});
			}

			return listNodes(ctx.session.user.id, input);
		}),

	getById: protectedProcedure
		.input(getNodeByIdInputSchema)
		.output(
			nodeOutputSchema.extend({
				breadcrumb: z.array(nodeOutputSchema),
				children: z.array(nodeOutputSchema),
			})
		)
		.query(async ({ ctx, input }) => {
			if (!ctx.session?.user?.id) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "Authentication required to access nodes.",
				});
			}

			const node = await getNodeById(ctx.session.user.id, input);

			if (!node) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Node not found.",
				});
			}

			return node;
		}),

	update: protectedProcedure
		.input(updateNodeInputSchema)
		.output(nodeOutputSchema)
		.mutation(async ({ ctx, input }) => {
			if (!ctx.session?.user?.id) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "Authentication required to update nodes.",
				});
			}

			const node = await updateNode(ctx.session.user.id, input);

			if (!node) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Node not found or not updatable.",
				});
			}

			return node;
		}),

	delete: protectedProcedure
		.input(deleteNodeInputSchema)
		.output(
			z.object({
				deletedCount: z.number(),
			})
		)
		.mutation(async ({ ctx, input }) => {
			if (!ctx.session?.user?.id) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "Authentication required to delete nodes.",
				});
			}

			const result = await deleteNodeCascade(ctx.session.user.id, input);

			if (!result) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Node not found or already deleted.",
				});
			}

			return result;
		}),

	getTree: protectedProcedure
		.input(getTreeInputSchema)
		.output(z.array(nodeTreeOutputSchema))
		.query(({ ctx, input }) => {
			if (!ctx.session?.user?.id) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "Authentication required to access node tree.",
				});
			}

			return getNodeTree(ctx.session.user.id, input);
		}),

	branchFromMessage: protectedProcedure
		.input(branchFromMessageSchema)
		.output(nodeOutputSchema)
		.mutation(({ ctx, input }) => {
			if (!ctx.session?.user?.id) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "Authentication required.",
				});
			}

			return createBranchFromMessage(ctx.session.user.id, input);
		}),

	getBranchesForNode: protectedProcedure
		.input(getNodeByIdInputSchema)
		.output(getBranchesForNodeOutputSchema)
		.query(({ ctx, input }) => {
			if (!ctx.session?.user?.id) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "Authentication required.",
				});
			}

			return getBranchesForNode(ctx.session.user.id, input);
		}),

	getContextForPanel: protectedProcedure
		.input(getContextForPanelInputSchema)
		.output(getContextForPanelOutputSchema.nullable())
		.query(async ({ ctx, input }) => {
			if (!ctx.session?.user?.id) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "Authentication required.",
				});
			}

			const node = await getNodeById(ctx.session.user.id, input);

			if (!node) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Node not found.",
				});
			}

			return buildContextPanelData(input.nodeId);
		}),
});
