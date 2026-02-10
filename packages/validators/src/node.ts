import { z } from "zod";

// Constants
export const NODE_TITLE_MIN_LENGTH = 3;
export const NODE_TITLE_MAX_LENGTH = 100;

// Input validators
export const createNodeInputSchema = z.object({
	workspaceId: z.string().cuid(),
	title: z
		.string()
		.trim()
		.min(NODE_TITLE_MIN_LENGTH, {
			message: `Title must be at least ${NODE_TITLE_MIN_LENGTH} characters`,
		})
		.max(NODE_TITLE_MAX_LENGTH, {
			message: `Title must be at most ${NODE_TITLE_MAX_LENGTH} characters`,
		}),
	parentId: z.string().cuid().optional().nullable(),
});

export const updateNodeInputSchema = z
	.object({
		nodeId: z.string().cuid(),
		title: z
			.string()
			.trim()
			.min(NODE_TITLE_MIN_LENGTH, {
				message: `Title must be at least ${NODE_TITLE_MIN_LENGTH} characters`,
			})
			.max(NODE_TITLE_MAX_LENGTH, {
				message: `Title must be at most ${NODE_TITLE_MAX_LENGTH} characters`,
			})
			.optional(),
	})
	.refine((data) => data.title !== undefined, {
		message: "At least one field (title) must be provided",
	});

export const deleteNodeInputSchema = z.object({
	nodeId: z.string().cuid(),
});

export const listNodesInputSchema = z.object({
	workspaceId: z.string().cuid(),
});

export const getNodeByIdInputSchema = z.object({
	nodeId: z.string().cuid(),
});

export const getTreeInputSchema = z.object({
	workspaceId: z.string().cuid(),
});

// Output validators
export const nodeOutputSchema = z.object({
	id: z.string().cuid(),
	workspaceId: z.string().cuid(),
	parentId: z.string().cuid().nullable(),
	title: z.string(),
	createdAt: z.coerce.date(),
	updatedAt: z.coerce.date(),
	deletedAt: z.coerce.date().nullable(),
});

interface NodeTreeShape {
	id: string;
	workspaceId: string;
	parentId: string | null;
	title: string;
	createdAt: Date;
	updatedAt: Date;
	deletedAt: Date | null;
	children: NodeTreeShape[];
}

export const nodeTreeOutputSchema: z.ZodType<NodeTreeShape> = z.lazy(() =>
	z.object({
		id: z.string().cuid(),
		workspaceId: z.string().cuid(),
		parentId: z.string().cuid().nullable(),
		title: z.string(),
		createdAt: z.coerce.date(),
		updatedAt: z.coerce.date(),
		deletedAt: z.coerce.date().nullable(),
		children: z.array(nodeTreeOutputSchema),
	})
);

// Type exports
export type CreateNodeInput = z.infer<typeof createNodeInputSchema>;
export type UpdateNodeInput = z.infer<typeof updateNodeInputSchema>;
export type DeleteNodeInput = z.infer<typeof deleteNodeInputSchema>;
export type ListNodesInput = z.infer<typeof listNodesInputSchema>;
export type GetNodeByIdInput = z.infer<typeof getNodeByIdInputSchema>;
export type GetTreeInput = z.infer<typeof getTreeInputSchema>;
export type NodeOutput = z.infer<typeof nodeOutputSchema>;
