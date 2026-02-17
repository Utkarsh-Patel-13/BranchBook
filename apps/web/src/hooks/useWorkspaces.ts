import type { WorkspaceId, WorkspaceListInput } from "@branchbook/types";
import { useMutation, useQuery } from "@tanstack/react-query";
import { create } from "zustand";

import { queryClient, trpc } from "@/utils/trpc";

interface WorkspaceStoreState {
	sort: Required<Pick<WorkspaceListInput, "sortBy" | "sortDirection">>;
	setSort: (sort: WorkspaceListInput) => void;
}

export const useWorkspaceStore = create<WorkspaceStoreState>((set) => ({
	sort: {
		sortBy: "lastUpdated",
		sortDirection: "desc",
	},
	setSort: (sort) => {
		set((current) => ({
			sort: {
				sortBy: sort.sortBy ?? current.sort.sortBy,
				sortDirection: sort.sortDirection ?? current.sort.sortDirection,
			},
		}));
	},
}));

export const useWorkspaceListQuery = (input?: WorkspaceListInput) =>
	useQuery(trpc.workspace.list.queryOptions(input ?? {}));

export const useDeletedWorkspaceListQuery = (input?: WorkspaceListInput) =>
	useQuery(trpc.workspace.listDeleted.queryOptions(input ?? {}));

export const useWorkspaceByIdQuery = (workspaceId: WorkspaceId | null) =>
	useQuery({
		...trpc.workspace.getById.queryOptions({
			workspaceId: workspaceId ?? "",
		}),
		enabled: workspaceId !== null,
	});

const invalidateWorkspaceList = () =>
	queryClient.invalidateQueries({ queryKey: trpc.workspace.list.queryKey() });

const invalidateDeletedWorkspaceList = () =>
	queryClient.invalidateQueries({
		queryKey: trpc.workspace.listDeleted.queryKey(),
	});

export const useCreateWorkspaceMutation = () =>
	useMutation({
		...trpc.workspace.create.mutationOptions(),
		onSuccess: () => invalidateWorkspaceList(),
	});

export const useUpdateWorkspaceMutation = () =>
	useMutation({
		...trpc.workspace.update.mutationOptions(),
		onSuccess: () => invalidateWorkspaceList(),
	});

export const useDeleteWorkspaceMutation = () =>
	useMutation({
		...trpc.workspace.delete.mutationOptions(),
		onSuccess: async () => {
			await Promise.all([
				invalidateWorkspaceList(),
				invalidateDeletedWorkspaceList(),
			]);
		},
	});

export const useRestoreWorkspaceMutation = () =>
	useMutation({
		...trpc.workspace.restore.mutationOptions(),
		onSuccess: async () => {
			await Promise.all([
				invalidateWorkspaceList(),
				invalidateDeletedWorkspaceList(),
			]);
		},
	});
