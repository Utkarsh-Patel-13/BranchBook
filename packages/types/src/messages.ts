export type MessageRole = "USER" | "ASSISTANT";

export interface MessageSource {
	sourceId: string;
	url: string;
	title?: string;
}

export interface MessageType {
	id: string;
	nodeId: string;
	role: MessageRole;
	content: string;
	reasoning?: string | null;
	sources?: MessageSource[] | null;
	createdAt: Date | string;
	// Context Engine fields
	perMessageSummary?: string | null;
	branchPoint?: boolean;
}

export interface CreateMessageInput {
	nodeId: string;
	content: string;
}

export interface MessageListInput {
	nodeId: string;
	cursor?: string;
	limit?: number;
}

export interface MessageListOutput {
	items: MessageType[];
	nextCursor: string | null;
}
