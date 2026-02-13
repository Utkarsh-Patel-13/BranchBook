import type { WorkspaceListInput } from "@nexus/types";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import {
	EllipsisVerticalIcon,
	FolderIcon,
	PencilIcon,
	PlusIcon,
	SearchIcon,
	Trash2Icon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { WorkspaceGridSkeleton } from "@/components/skeletons/workspace-card-skeleton";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardAction,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
	useCreateWorkspaceMutation,
	useDeleteWorkspaceMutation,
	useUpdateWorkspaceMutation,
	useWorkspaceListQuery,
	useWorkspaceStore,
} from "@/hooks/useWorkspaces";
import { authClient } from "@/lib/auth-client";

const SORT_BY_LABELS: Record<
	NonNullable<WorkspaceListInput["sortBy"]>,
	string
> = {
	lastUpdated: "Last updated",
	createdAt: "Created date",
	name: "Alphabetical",
};

const SORT_DIRECTION_LABELS: Record<
	NonNullable<WorkspaceListInput["sortDirection"]>,
	string
> = {
	desc: "Newest first",
	asc: "Oldest first",
};

function formatRelativeTime(value: Date | string | number): string {
	const date = value instanceof Date ? value : new Date(value);
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffMins = Math.floor(diffMs / 60_000);
	const diffHours = Math.floor(diffMs / 3_600_000);
	const diffDays = Math.floor(diffMs / 86_400_000);

	if (diffMins < 1) {
		return "Just now";
	}
	if (diffMins < 60) {
		return `${diffMins} min ago`;
	}
	if (diffHours < 24) {
		return diffHours === 1 ? "1 hour ago" : `${diffHours} hours ago`;
	}
	if (diffDays === 1) {
		return "Yesterday";
	}
	if (diffDays < 7) {
		return `${diffDays} days ago`;
	}
	return new Intl.DateTimeFormat(undefined, {
		month: "short",
		day: "numeric",
		year: "numeric",
	}).format(date);
}

export const Route = createFileRoute("/workspaces/")({
	component: WorkspacesListRouteComponent,
	beforeLoad: async ({ location }) => {
		const session = await authClient.getSession();
		if (!session.data) {
			redirect({
				to: "/login",
				search: { redirect: location.href },
				throw: true,
			});
		}
	},
});

function WorkspacesListRouteComponent() {
	const { sort, setSort } = useWorkspaceStore();
	const [searchQuery, setSearchQuery] = useState("");

	const [createDialogState, setCreateDialogState] = useState<WorkspaceItem>({
		id: "",
		name: "",
		description: "",
		updatedAt: "",
		createdAt: "",
	});
	const [createDialogOpen, setCreateDialogOpen] = useState(false);

	const listQuery = useWorkspaceListQuery(sort);
	const createMutation = useCreateWorkspaceMutation();
	const updateMutation = useUpdateWorkspaceMutation();

	const workspaces = listQuery.data ?? [];
	const filtered = useMemo(() => {
		if (!searchQuery.trim()) {
			return workspaces;
		}
		const q = searchQuery.trim().toLowerCase();
		return workspaces.filter(
			(w) =>
				w.name.toLowerCase().includes(q) ||
				(w.description?.toLowerCase().includes(q) ?? false)
		);
	}, [workspaces, searchQuery]);

	const isLoading = listQuery.isLoading;
	const hasWorkspaces = workspaces.length > 0;

	const handleCreateDialogStateChange = (
		field: keyof WorkspaceItem,
		value: string
	) => {
		setCreateDialogState({ ...createDialogState, [field]: value });
	};

	const handleCreate = (e: React.FormEvent) => {
		e.preventDefault();
		if (!createDialogState.name.trim()) {
			toast.error("Workspace name is required");
			return;
		}
		if (createDialogState.id) {
			updateMutation.mutate(
				{
					workspaceId: createDialogState.id,
					name: createDialogState.name.trim(),
					description: createDialogState.description?.trim() || null,
				},
				{
					onSuccess: async () => {
						setCreateDialogState({
							id: "",
							name: "",
							description: "",
							updatedAt: "",
							createdAt: "",
						});
						setCreateDialogOpen(false);
						await listQuery.refetch();
						toast.success("Workspace updated successfully");
					},
					onError: (error) => {
						toast.error(error.message ?? "Failed to update workspace");
					},
				}
			);
		} else {
			createMutation.mutate(
				{
					name: createDialogState.name.trim(),
					description: createDialogState.description?.trim() || null,
				},
				{
					onSuccess: async () => {
						setCreateDialogState({
							id: "",
							name: "",
							description: "",
							updatedAt: "",
							createdAt: "",
						});
						setCreateDialogOpen(false);
						await listQuery.refetch();
						await listQuery.refetch();
						toast.success("Workspace created successfully");
					},
					onError: (error) => {
						toast.error(error.message ?? "Failed to create workspace");
					},
				}
			);
		}
	};

	const handleSortChange = (next: Partial<WorkspaceListInput>) => {
		setSort(next);
	};

	const handleEdit = (workspace: WorkspaceItem) => {
		setCreateDialogState(workspace);
		setCreateDialogOpen(true);
	};

	const getCreateDialogButtonText = (isPending: boolean) => {
		if (createDialogState.id) {
			return isPending ? "Updating…" : "Update";
		}
		return isPending ? "Creating…" : "Create";
	};

	return (
		<main className="mx-2 min-h-0 max-w-[1440px] flex-1 px-4 py-8 sm:px-6 sm:py-12 md:mx-4 lg:mx-6">
			<div className="mb-8 sm:mb-12">
				<h1 className="font-semibold font-serif text-2xl text-foreground tracking-tight sm:text-4xl md:text-5xl">
					Workspaces
				</h1>
				<p className="mt-2 text-base text-muted-foreground sm:text-lg">
					Create and manage your research environments.
				</p>
			</div>

			<div className="mb-6 flex flex-col gap-4 sm:mb-8 md:flex-row md:items-center md:justify-between">
				<div className="relative max-w-md flex-1">
					<SearchIcon
						aria-hidden
						className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
					/>
					<Input
						aria-label="Search workspaces"
						className="h-9 pr-4 pl-9 text-sm"
						onChange={(e) => setSearchQuery(e.target.value)}
						placeholder="Search workspaces..."
						value={searchQuery}
					/>
				</div>
				<div className="flex flex-wrap items-center gap-2 text-sm sm:gap-4">
					<div className="flex items-center gap-2">
						<span className="text-muted-foreground">Sort by</span>
						<Select
							disabled={isLoading}
							onValueChange={(value) =>
								value != null &&
								handleSortChange({
									sortBy: value as WorkspaceListInput["sortBy"],
								})
							}
							value={sort.sortBy}
						>
							<SelectTrigger
								aria-label="Sort by"
								className="min-w-30"
								size="default"
							>
								{SORT_BY_LABELS[sort.sortBy]}
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="lastUpdated">Last updated</SelectItem>
								<SelectItem value="createdAt">Created date</SelectItem>
								<SelectItem value="name">Alphabetical</SelectItem>
							</SelectContent>
						</Select>
						<Select
							disabled={isLoading}
							onValueChange={(value) =>
								value != null &&
								handleSortChange({
									sortDirection: value as WorkspaceListInput["sortDirection"],
								})
							}
							value={sort.sortDirection}
						>
							<SelectTrigger
								aria-label="Sort direction"
								className="min-w-30"
								size="default"
							>
								{SORT_DIRECTION_LABELS[sort.sortDirection]}
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="desc">Newest first</SelectItem>
								<SelectItem value="asc">Oldest first</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div className="hidden h-4 w-px bg-border sm:block" />
				</div>
			</div>

			{isLoading && (
				<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
					<div
						aria-hidden
						className="flex h-52 flex-col items-center justify-center rounded-xl border-2 border-border border-dashed p-8"
					>
						<Skeleton className="mb-4 size-12 rounded-full" />
						<Skeleton className="mb-1 h-4 w-32" />
						<Skeleton className="h-3 w-24" />
					</div>
					<WorkspaceGridSkeleton count={7} />
				</div>
			)}

			{!(isLoading || hasWorkspaces) && (
				<EmptyState onAdd={() => setCreateDialogOpen(true)} />
			)}

			{!isLoading && hasWorkspaces && (
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
					<AddWorkspaceCard onOpenModal={() => setCreateDialogOpen(true)} />
					{filtered.map((workspace) => (
						<WorkspaceCard
							key={workspace.id}
							onDeleted={() => listQuery.refetch()}
							onEdit={handleEdit}
							workspace={workspace}
						/>
					))}
				</div>
			)}

			<Dialog
				onOpenChange={(open) => {
					setCreateDialogOpen(open);
					if (!open) {
						setCreateDialogState({
							id: "",
							name: "",
							description: "",
							updatedAt: "",
							createdAt: "",
						});
					}
				}}
				open={createDialogOpen}
			>
				<DialogContent className="sm:max-w-sm" showCloseButton>
					<form onSubmit={handleCreate}>
						<DialogHeader>
							<DialogTitle>Add New Workspace</DialogTitle>
						</DialogHeader>
						<div className="grid gap-4 py-4">
							<div className="grid gap-2">
								<Label htmlFor="create-workspace-name">Title</Label>
								<Input
									autoFocus
									disabled={createMutation.isPending}
									id="create-workspace-name"
									maxLength={100}
									onChange={(e) =>
										handleCreateDialogStateChange("name", e.target.value)
									}
									placeholder="Workspace name"
									required
									value={createDialogState.name}
								/>
							</div>
							<div className="grid gap-2">
								<Label htmlFor="create-workspace-description">
									Description (optional)
								</Label>
								<Textarea
									disabled={createMutation.isPending}
									id="create-workspace-description"
									maxLength={500}
									onChange={(e) =>
										handleCreateDialogStateChange("description", e.target.value)
									}
									placeholder="Brief description"
									rows={3}
									value={createDialogState.description ?? ""}
								/>
							</div>
						</div>
						<DialogFooter showCloseButton={false}>
							<Button
								disabled={createMutation.isPending}
								onClick={() => {
									setCreateDialogOpen(false);
									setCreateDialogState({
										id: "",
										name: "",
										description: "",
										updatedAt: "",
										createdAt: "",
									});
								}}
								type="button"
								variant="outline"
							>
								Cancel
							</Button>
							<Button disabled={createMutation.isPending} type="submit">
								{getCreateDialogButtonText(createMutation.isPending)}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		</main>
	);
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
	return (
		<div className="flex flex-col items-center justify-center rounded-xl border-2 border-border border-dashed bg-muted/20 py-16 text-center">
			<div className="mb-4 rounded-full bg-muted p-4">
				<FolderIcon className="size-8 text-muted-foreground" />
			</div>
			<h2 className="font-semibold font-serif text-foreground text-xl">
				No workspaces yet
			</h2>
			<p className="mt-2 max-w-sm text-muted-foreground text-sm">
				Create your first workspace to organize projects and keep work separate.
			</p>
			<Button className="mt-6" onClick={onAdd}>
				<PlusIcon className="mr-2 size-4" />
				Add New Workspace
			</Button>
		</div>
	);
}

function AddWorkspaceCard({ onOpenModal }: { onOpenModal: () => void }) {
	return (
		<Button
			aria-label="Add new workspace"
			className="group flex h-52 flex-col items-center justify-center rounded-xl border-2 border-border border-dashed bg-card p-8 transition-colors hover:border-primary hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
			onClick={onOpenModal}
			type="button"
			variant="outline"
		>
			<div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
				<PlusIcon className="size-6" />
			</div>
			<span className="font-semibold text-foreground">Add New Workspace</span>
			<span className="mt-1 text-muted-foreground text-xs">
				Start a new project
			</span>
		</Button>
	);
}

type WorkspaceItem = NonNullable<
	ReturnType<typeof useWorkspaceListQuery>["data"]
>[number];

function WorkspaceCard({
	workspace,
	onDeleted,
	onEdit,
}: {
	workspace: WorkspaceItem;
	onDeleted: () => void;
	onEdit: (workspace: WorkspaceItem) => void;
}) {
	const [deleteOpen, setDeleteOpen] = useState(false);
	const deleteMutation = useDeleteWorkspaceMutation();

	const handleDelete = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		deleteMutation.mutate(
			{ workspaceId: workspace.id },
			{
				onSuccess: () => {
					toast.success("Workspace deleted successfully");
					setDeleteOpen(false);
					onDeleted();
				},
				onError: (error) => {
					toast.error(error.message ?? "Failed to delete workspace");
				},
			}
		);
	};

	return (
		<Card className="flex h-52 flex-col">
			<CardHeader className="flex flex-row items-center justify-between border-b">
				<Link
					aria-label={`Open workspace ${workspace.name}`}
					className="flex-1 rounded-md"
					params={{ workspaceId: workspace.id }}
					to="/workspaces/$workspaceId"
				>
					<CardTitle className="line-clamp-2">{workspace.name}</CardTitle>
				</Link>
				<CardAction>
					<DropdownMenu>
						<DropdownMenuTrigger
							render={
								<Button
									aria-label="Workspace options"
									size="icon"
									type="button"
									variant="ghost"
								>
									<EllipsisVerticalIcon className="size-4" />
								</Button>
							}
						/>
						<DropdownMenuContent align="end">
							<DropdownMenuItem
								onClick={(e) => {
									e.preventDefault();
									e.stopPropagation();
									onEdit(workspace);
								}}
							>
								<PencilIcon className="size-4" />
								Edit
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={(e) => {
									e.preventDefault();
									e.stopPropagation();
									setDeleteOpen(true);
								}}
								variant="destructive"
							>
								<Trash2Icon className="size-4" />
								Delete
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</CardAction>
			</CardHeader>
			<Link
				className="flex-1 rounded-md"
				params={{ workspaceId: workspace.id }}
				to="/workspaces/$workspaceId"
			>
				<CardContent className="line-clamp-2 min-h-0 flex-1">
					{workspace.description ?? "No description."}
				</CardContent>
			</Link>
			<CardFooter className="justify-between text-muted-foreground text-xs">
				<span>Updated</span>
				<span>{formatRelativeTime(workspace.updatedAt)}</span>
			</CardFooter>
			<AlertDialog onOpenChange={setDeleteOpen} open={deleteOpen}>
				<AlertDialogContent onClick={(e) => e.stopPropagation()}>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete workspace?</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete &quot;{workspace.name}&quot;? This
							workspace will be soft deleted and can be recovered within 30
							days.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel
							onClick={(e) => {
								e.stopPropagation();
								setDeleteOpen(false);
							}}
						>
							Cancel
						</AlertDialogCancel>
						<AlertDialogAction
							disabled={deleteMutation.isPending}
							onClick={(e) => {
								e.stopPropagation();
								handleDelete(e as unknown as React.MouseEvent);
							}}
						>
							{deleteMutation.isPending ? "Deleting…" : "Delete workspace"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</Card>
	);
}
