import { z } from "zod";

// Input schemas
export const getByNodeIdInputSchema = z.object({
	nodeId: z.uuidv7(),
});

// const NOTE_CONTENT_MAX_LENGTH = 25_000;

export const upsertNoteInputSchema = z.object({
	nodeId: z.uuidv7(),
	content: z.string(),
});

export const removeNoteInputSchema = z.object({
	nodeId: z.uuidv7(),
});

export const exportNoteInputSchema = z.object({
	nodeId: z.uuidv7(),
});

// Output schema
export const noteOutputSchema = z.object({
	id: z.uuidv7(),
	nodeId: z.uuidv7(),
	content: z.string(),
	createdAt: z.coerce.date(),
	updatedAt: z.coerce.date(),
	deletedAt: z.coerce.date().nullable(),
});

// Type exports
export type GetByNodeIdInput = z.infer<typeof getByNodeIdInputSchema>;
export type UpsertNoteInput = z.infer<typeof upsertNoteInputSchema>;
export type RemoveNoteInput = z.infer<typeof removeNoteInputSchema>;
export type ExportNoteInput = z.infer<typeof exportNoteInputSchema>;
export type NoteOutput = z.infer<typeof noteOutputSchema>;
