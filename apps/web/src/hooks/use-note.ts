import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryClient, trpc } from "../utils/trpc";

const invalidateNote = (nodeId: string) =>
	queryClient.invalidateQueries(trpc.note.getByNodeId.queryOptions({ nodeId }));

export const useNote = (nodeId: string | null) => {
	return useQuery({
		...trpc.note.getByNodeId.queryOptions({ nodeId: nodeId ?? "" }),
		enabled: nodeId !== null,
	});
};

export const useUpsertNote = (nodeId: string) =>
	useMutation({
		...trpc.note.upsert.mutationOptions(),
		onSuccess: () => invalidateNote(nodeId),
		onError: (err) => {
			toast.error(`Failed to save note: ${err.message}`, {
				description: "Your unsaved changes are still in the editor. Try again.",
			});
		},
	});
