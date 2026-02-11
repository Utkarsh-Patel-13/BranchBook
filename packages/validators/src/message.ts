import { z } from "zod";

export const listMessagesSchema = z.object({
	nodeId: z.string().min(1),
});

export const createMessageSchema = z.object({
	nodeId: z.string().min(1),
	content: z.string().min(1).max(4000),
});

export type ListMessagesInput = z.infer<typeof listMessagesSchema>;
export type CreateMessageInput = z.infer<typeof createMessageSchema>;
