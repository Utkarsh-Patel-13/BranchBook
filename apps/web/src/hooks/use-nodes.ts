import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, trpc } from "../utils/trpc";

export const useNodeTree = (workspaceId: string) => {
	return useQuery({
		...trpc.node.getTree.queryOptions({
			workspaceId,
		}),
	});
};

export const useListNodes = (workspaceId: string) => {
	return useQuery({
		...trpc.node.list.queryOptions({
			workspaceId,
		}),
	});
};

export const useNodeById = (nodeId: string) => {
	return useQuery({
		...trpc.node.getById.queryOptions({
			nodeId,
		}),
	});
};

export const useBranchesForNode = (nodeId: string) =>
	useQuery({
		...trpc.node.getBranchesForNode.queryOptions({ nodeId }),
		enabled: !!nodeId,
	});

const invalidateNodeTree = (workspaceId: string) =>
	queryClient.invalidateQueries(
		trpc.node.getTree.queryOptions({ workspaceId })
	);

export const useCreateNode = (workspaceId: string) =>
	useMutation({
		...trpc.node.create.mutationOptions(),
		onSuccess: () => invalidateNodeTree(workspaceId),
	});

export const useUpdateNode = (workspaceId: string) =>
	useMutation({
		...trpc.node.update.mutationOptions(),
		onSuccess: () => invalidateNodeTree(workspaceId),
	});

export const useDeleteNode = (workspaceId: string) =>
	useMutation({
		...trpc.node.delete.mutationOptions(),
		onSuccess: () => invalidateNodeTree(workspaceId),
	});

export const useBranchFromMessage = (workspaceId: string) =>
	useMutation({
		...trpc.node.branchFromMessage.mutationOptions(),
		onSuccess: (newNode) => {
			invalidateNodeTree(workspaceId);
			if (newNode.parentId) {
				queryClient.invalidateQueries(
					trpc.node.getBranchesForNode.queryOptions({
						nodeId: newNode.parentId,
					})
				);
			}
			queryClient.invalidateQueries(
				trpc.node.getArtifact.queryOptions({ nodeId: newNode.id })
			);
		},
	});

export const useContextForPanel = (nodeId: string) =>
	useQuery({
		...trpc.node.getContextForPanel.queryOptions({ nodeId }),
	});

export const useNodeArtifact = (nodeId: string) =>
	useQuery({
		...trpc.node.getArtifact.queryOptions({ nodeId }),
		staleTime: 30_000,
		enabled: !!nodeId,
	});
