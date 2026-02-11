import type { WorkspaceListInput } from "@nexus/types";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { FolderIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	useCreateWorkspaceMutation,
	useDeleteWorkspaceMutation,
	useWorkspaceListQuery,
	useWorkspaceStore,
} from "@/hooks/useWorkspaces";
import { authClient } from "@/lib/auth-client";

function formatDate(
	value: Date | string | number,
	options: Intl.DateTimeFormatOptions
) {
	const date = value instanceof Date ? value : new Date(value);
	return new Intl.DateTimeFormat(undefined, options).format(date);
}

export const Route = createFileRoute("/workspaces/")({
	component: WorkspacesListRouteComponent,
	beforeLoad: async ({ location }) => {
		const session = await authClient.getSession();
		if (!session.data) {
			redirect({
				to: "/login",
				search: {
					redirect: location.href,
				},
				throw: true,
			});
		}
	},
});

function WorkspacesListRouteComponent() {
	const { sort, setSort } = useWorkspaceStore();
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");

	const listQuery = useWorkspaceListQuery(sort);
	const createMutation = useCreateWorkspaceMutation();

	const handleCreate = (event: React.FormEvent) => {
		event.preventDefault();
		if (!name.trim()) {
			toast.error("Workspace name is required");
			return;
		}

		createMutation.mutate(
			{
				name: name.trim(),
				description: description.trim() || null,
			},
			{
				onSuccess: async () => {
					setName("");
					setDescription("");
					await listQuery.refetch();
					toast.success("Workspace created successfully");
				},
				onError: (error) => {
					toast.error(error.message || "Failed to create workspace");
				},
			}
		);
	};

	const handleSortChange = (nextSort: Partial<WorkspaceListInput>) => {
		setSort(nextSort);
	};

	const workspaces = listQuery.data ?? [];
	const hasWorkspaces = workspaces.length > 0;
	const isLoading = listQuery.isLoading;

	return (
		<div className="container mx-auto flex max-w-4xl flex-col gap-4 px-4 py-4 sm:py-6">
			<header className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
				<div className="h-full">
					<h1 className="font-semibold text-lg sm:text-xl">Workspaces</h1>
					<p className="text-muted-foreground text-xs sm:text-sm">
						Create and manage your workspaces.
					</p>
				</div>
				<form
					className="grid gap-2 rounded-md border p-3 text-xs md:grid-cols-[2fr_3fr_auto]"
					onSubmit={handleCreate}
				>
					<div className="space-y-1">
						<Label htmlFor="workspace-name">Name</Label>
						<Input
							disabled={createMutation.isPending}
							id="workspace-name"
							onChange={(event) => setName(event.target.value)}
							placeholder="Workspace name"
							required
							value={name}
						/>
					</div>
					<div className="space-y-1">
						<Label htmlFor="workspace-description">Description</Label>
						<Input
							disabled={createMutation.isPending}
							id="workspace-description"
							onChange={(event) => setDescription(event.target.value)}
							placeholder="Optional description"
							value={description}
						/>
					</div>
					<div className="flex items-end justify-end">
						<Button disabled={createMutation.isPending} size="sm" type="submit">
							{createMutation.isPending ? (
								"Creating…"
							) : (
								<>
									<PlusIcon className="mr-1 size-3" />
									Create
								</>
							)}
						</Button>
					</div>
				</form>
			</header>
			{hasWorkspaces && (
				<section className="flex flex-col items-start justify-between gap-2 text-xs sm:flex-row sm:items-center">
					<div className="flex flex-wrap items-center gap-2">
						<span className="text-muted-foreground">Sort by</span>
						<select
							className="h-8 rounded-md border bg-transparent px-2 text-xs"
							disabled={isLoading}
							onChange={(event) =>
								handleSortChange({
									sortBy: event.target.value as WorkspaceListInput["sortBy"],
								})
							}
							value={sort.sortBy}
						>
							<option value="lastUpdated">Last updated</option>
							<option value="createdAt">Created at</option>
							<option value="name">Name</option>
						</select>
						<select
							className="h-8 rounded-md border bg-transparent px-2 text-xs"
							disabled={isLoading}
							onChange={(event) =>
								handleSortChange({
									sortDirection: event.target
										.value as WorkspaceListInput["sortDirection"],
								})
							}
							value={sort.sortDirection}
						>
							<option value="desc">Newest first</option>
							<option value="asc">Oldest first</option>
						</select>
					</div>
					<div className="text-muted-foreground">
						{isLoading ? (
							<span className="animate-pulse">Loading workspaces…</span>
						) : (
							`${workspaces.length} workspace${workspaces.length === 1 ? "" : "s"}`
						)}
					</div>
				</section>
			)}
			{isLoading && (
				<div className="flex flex-col gap-3">
					{new Array(3).fill(null).map((_, i) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: skeleton items don't have stable IDs
						<Card className="animate-pulse" key={i}>
							<CardHeader>
								<div className="h-5 w-48 rounded bg-muted" />
								<div className="h-4 w-full rounded bg-muted" />
							</CardHeader>
						</Card>
					))}
				</div>
			)}
			{!(isLoading || hasWorkspaces) && <EmptyState />}
			{!isLoading && hasWorkspaces && (
				<section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{workspaces.map((workspace) => (
						<WorkspaceListItemCard
							key={workspace.id}
							onDelete={() => listQuery.refetch()}
							workspace={workspace}
						/>
					))}
				</section>
			)}
		</div>
	);
}

function EmptyState() {
	return (
		<Card className="border-dashed">
			<CardContent className="flex flex-col items-center justify-center py-12 text-center">
				<div className="mb-4 rounded-full bg-muted p-3">
					<FolderIcon className="size-8 text-muted-foreground" />
				</div>
				<CardTitle className="mb-2">No workspaces yet</CardTitle>
				<CardDescription className="mb-4 max-w-sm">
					Get started by creating your first workspace. Workspaces help you
					organize your projects and keep your work separate.
				</CardDescription>
			</CardContent>
		</Card>
	);
}

interface WorkspaceListItemCardProps {
	workspace: NonNullable<
		ReturnType<typeof useWorkspaceListQuery>["data"]
	>[number];
	onDelete: () => void;
}

function WorkspaceListItemCard({
	workspace,
	onDelete,
}: WorkspaceListItemCardProps) {
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const deleteMutation = useDeleteWorkspaceMutation();

	const handleDelete = () => {
		deleteMutation.mutate(
			{ workspaceId: workspace.id },
			{
				onSuccess: () => {
					toast.success("Workspace deleted successfully");
					setIsDeleteDialogOpen(false);
					onDelete();
				},
				onError: (error) => {
					toast.error(error.message || "Failed to delete workspace");
				},
			}
		);
	};

	return (
		<Card className="flex h-full flex-col transition-all hover:bg-muted/20">
			<CardHeader>
				<CardTitle className="line-clamp-1">
					<Link
						className="underline-offset-2 hover:underline"
						params={{ workspaceId: workspace.id }}
						to="/workspaces/new/$workspaceId"
					>
						{workspace.name}
					</Link>
				</CardTitle>
				<CardDescription className="line-clamp-2 min-h-[2.5em]">
					{workspace.description ?? "No description provided."}
				</CardDescription>
			</CardHeader>
			<CardContent className="flex-1" />
			<CardFooter className="flex items-center justify-between gap-2 border-t bg-muted/20 px-4 py-3 text-muted-foreground text-xs">
				<div className="flex flex-col gap-0.5">
					<span>
						Updated{" "}
						{formatDate(workspace.updatedAt, {
							month: "short",
							day: "numeric",
							year: "numeric",
						})}
					</span>
				</div>

				<div className="flex items-center gap-2">
					<AlertDialog
						onOpenChange={setIsDeleteDialogOpen}
						open={isDeleteDialogOpen}
					>
						<AlertDialogTrigger
							render={
								<Button
									className="h-7 w-7 text-muted-foreground hover:text-destructive"
									disabled={deleteMutation.isPending}
									size="icon"
									variant="ghost"
								>
									<Trash2Icon className="size-4" />
									<span className="sr-only">Delete</span>
								</Button>
							}
						/>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>Delete workspace?</AlertDialogTitle>
								<AlertDialogDescription>
									Are you sure you want to delete "{workspace.name}"? This
									workspace will be soft deleted and can be recovered within 30
									days.
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>
									Cancel
								</AlertDialogCancel>
								<AlertDialogAction
									disabled={deleteMutation.isPending}
									onClick={handleDelete}
								>
									{deleteMutation.isPending ? "Deleting…" : "Delete workspace"}
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				</div>
			</CardFooter>
		</Card>
	);
}
