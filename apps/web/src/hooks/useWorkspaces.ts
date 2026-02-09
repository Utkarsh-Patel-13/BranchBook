import type { WorkspaceId, WorkspaceListInput } from "@nexus/types";
import { useMutation, useQuery } from "@tanstack/react-query";
import { create } from "zustand";

import { trpc } from "@/utils/trpc";

interface WorkspaceStoreState {
	selectedWorkspaceId: WorkspaceId | null;
	sort: Required<Pick<WorkspaceListInput, "sortBy" | "sortDirection">>;
	setSelectedWorkspaceId: (workspaceId: WorkspaceId | null) => void;
	setSort: (sort: WorkspaceListInput) => void;
}

export const useWorkspaceStore = create<WorkspaceStoreState>((set) => ({
	selectedWorkspaceId: null,
	sort: {
		sortBy: "lastUpdated",
		sortDirection: "desc",
	},
	setSelectedWorkspaceId: (workspaceId) => {
		set({ selectedWorkspaceId: workspaceId });
	},
	setSort: (sort) => {
		set((current) => ({
			...current,
			sort: {
				sortBy: sort.sortBy ?? current.sort.sortBy,
				sortDirection: sort.sortDirection ?? current.sort.sortDirection,
			},
		}));
	},
}));

export const useWorkspaceListQuery = (input?: WorkspaceListInput) =>
	useQuery(trpc.workspace.list.queryOptions(input ?? {}));

export const useWorkspaceByIdQuery = (workspaceId: WorkspaceId | null) =>
	useQuery({
		...trpc.workspace.getById.queryOptions({
			workspaceId: workspaceId ?? "",
		}),
		enabled: workspaceId !== null,
	});

export const useCreateWorkspaceMutation = () =>
	useMutation(trpc.workspace.create.mutationOptions());

export const useUpdateWorkspaceMutation = () =>
	useMutation(trpc.workspace.update.mutationOptions());

export const useDeleteWorkspaceMutation = () =>
	useMutation(trpc.workspace.delete.mutationOptions());

export const useRestoreWorkspaceMutation = () =>
	useMutation(trpc.workspace.restore.mutationOptions());
