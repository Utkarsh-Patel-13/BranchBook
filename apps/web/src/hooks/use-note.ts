import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryClient, trpc } from "../utils/trpc";

interface NoteCacheValue {
	id: string;
	nodeId: string;
	content: string;
	createdAt: string;
	updatedAt: string;
	deletedAt: string | null;
}

function toIso(date: Date | string): string {
	return typeof date === "string" ? date : (date as Date).toISOString();
}

function toCacheValue(
	note: {
		createdAt: Date | string;
		updatedAt: Date | string;
		deletedAt: Date | string | null;
	} & Pick<NoteCacheValue, "id" | "nodeId" | "content">
): NoteCacheValue {
	return {
		id: note.id,
		nodeId: note.nodeId,
		content: note.content,
		createdAt: toIso(note.createdAt),
		updatedAt: toIso(note.updatedAt),
		deletedAt: note.deletedAt === null ? null : toIso(note.deletedAt),
	};
}

function updateNoteCache(
	nodeId: string,
	note: {
		createdAt: Date | string;
		updatedAt: Date | string;
		deletedAt: Date | string | null;
	} & Pick<NoteCacheValue, "id" | "nodeId" | "content">
) {
	queryClient.setQueryData(
		trpc.note.getByNodeId.queryOptions({ nodeId }).queryKey,
		toCacheValue(note)
	);
}

export const useNote = (nodeId: string | null) => {
	return useQuery({
		...trpc.note.getByNodeId.queryOptions({ nodeId: nodeId ?? "" }),
		enabled: nodeId !== null,
	});
};

export const useUpsertNote = (nodeId: string) =>
	useMutation({
		...trpc.note.upsert.mutationOptions(),
		onSuccess: (data) => {
			updateNoteCache(nodeId, data);
		},
		onError: (err) => {
			toast.error(`Failed to save note: ${err.message}`, {
				description: "Your unsaved changes are still in the editor. Try again.",
			});
		},
	});
