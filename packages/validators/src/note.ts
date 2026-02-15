import { z } from "zod";

// Input schemas
export const getByNodeIdInputSchema = z.object({
	nodeId: z.string().cuid(),
});

const NOTE_CONTENT_MAX_LENGTH = 25_000;

export const upsertNoteInputSchema = z.object({
	nodeId: z.string().cuid(),
	content: z.string().max(NOTE_CONTENT_MAX_LENGTH),
});

export const removeNoteInputSchema = z.object({
	nodeId: z.string().cuid(),
});

// Output schema
export const noteOutputSchema = z.object({
	id: z.string().cuid(),
	nodeId: z.string().cuid(),
	content: z.string(),
	createdAt: z.coerce.date(),
	updatedAt: z.coerce.date(),
	deletedAt: z.coerce.date().nullable(),
});

// Type exports
export type GetByNodeIdInput = z.infer<typeof getByNodeIdInputSchema>;
export type UpsertNoteInput = z.infer<typeof upsertNoteInputSchema>;
export type RemoveNoteInput = z.infer<typeof removeNoteInputSchema>;
export type NoteOutput = z.infer<typeof noteOutputSchema>;
