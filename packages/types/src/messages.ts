export type MessageRole = "USER" | "ASSISTANT";

export interface MessageType {
	id: string;
	nodeId: string;
	role: MessageRole;
	content: string;
	createdAt: Date | string;
}

export interface CreateMessageInput {
	nodeId: string;
	content: string;
}

export interface MessageListInput {
	nodeId: string;
}
