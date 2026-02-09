import type {
	Workspace,
	WorkspaceCreateInput,
	WorkspaceDeleteInput,
	WorkspaceGetByIdInput,
	WorkspaceListInput,
	WorkspaceListItem,
	WorkspaceRestoreInput,
	WorkspaceSortBy,
	WorkspaceSortDirection,
	WorkspaceUpdateInput,
} from "@nexus/types";
import { z } from "zod";

const WORKSPACE_NAME_MIN_LENGTH = 3;
const WORKSPACE_NAME_MAX_LENGTH = 100;
const WORKSPACE_DESCRIPTION_MAX_LENGTH = 500;

export const workspaceIdSchema = z
	.string()
	.trim()
	.min(1, { message: "Workspace ID is required." });

const workspaceNameSchema = z
	.string()
	.trim()
	.min(WORKSPACE_NAME_MIN_LENGTH, {
		message: `Name must be at least ${WORKSPACE_NAME_MIN_LENGTH} characters.`,
	})
	.max(WORKSPACE_NAME_MAX_LENGTH, {
		message: `Name must be at most ${WORKSPACE_NAME_MAX_LENGTH} characters.`,
	});

const workspaceDescriptionSchema = z
	.string()
	.trim()
	.max(WORKSPACE_DESCRIPTION_MAX_LENGTH, {
		message: `Description must be at most ${WORKSPACE_DESCRIPTION_MAX_LENGTH} characters.`,
	});

export const workspaceCreateInputSchema: z.ZodType<WorkspaceCreateInput> =
	z.object({
		name: workspaceNameSchema,
		description: workspaceDescriptionSchema.optional().nullable(),
	});

export const workspaceListInputSchema: z.ZodType<WorkspaceListInput> = z.object(
	{
		sortBy: z
			.enum(["lastUpdated", "createdAt", "name"] satisfies WorkspaceSortBy[])
			.optional(),
		sortDirection: z
			.enum(["asc", "desc"] satisfies WorkspaceSortDirection[])
			.optional(),
	}
);

export const workspaceGetByIdInputSchema: z.ZodType<WorkspaceGetByIdInput> =
	z.object({
		workspaceId: workspaceIdSchema,
	});

export const workspaceUpdateInputSchema: z.ZodType<WorkspaceUpdateInput> = z
	.object({
		workspaceId: workspaceIdSchema,
		name: workspaceNameSchema.optional(),
		description: workspaceDescriptionSchema.optional().nullable(),
	})
	.refine(
		(value) =>
			typeof value.name === "string" || typeof value.description === "string",
		{
			message: "At least one of name or description must be provided.",
			path: ["name"],
		}
	);

export const workspaceDeleteInputSchema: z.ZodType<WorkspaceDeleteInput> =
	z.object({
		workspaceId: workspaceIdSchema,
	});

export const workspaceRestoreInputSchema: z.ZodType<WorkspaceRestoreInput> =
	z.object({
		workspaceId: workspaceIdSchema,
	});

export const workspaceSchema: z.ZodType<Workspace> = z.object({
	id: workspaceIdSchema,
	ownerId: z.string().trim().min(1, { message: "Owner ID is required." }),
	name: workspaceNameSchema,
	description: workspaceDescriptionSchema.nullable(),
	createdAt: z.date(),
	updatedAt: z.date(),
	deletedAt: z.date().nullable(),
});

export const workspaceListItemSchema: z.ZodType<WorkspaceListItem> = z.object({
	id: workspaceIdSchema,
	name: workspaceNameSchema,
	description: workspaceDescriptionSchema.nullable(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export const workspaceListOutputSchema = workspaceListItemSchema.array();

export const workspaceDeleteOutputSchema = z.object({
	id: workspaceIdSchema,
	deletedAt: z.date().nullable(),
});
