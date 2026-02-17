import type { WorkspaceListInput } from "@nexus/types";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import {
	ArchiveRestoreIcon,
	FolderIcon,
	SearchIcon,
	Trash2Icon,
} from "lucide-react";
import { useCallback, useDeferredValue, useMemo, useState } from "react";
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
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
} from "@/components/ui/select";
import {
	useDeletedWorkspaceListQuery,
	useRestoreWorkspaceMutation,
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

function formatValidationErrorMessage(
	raw: string | undefined,
	fallback: string
): string {
	if (raw == null || raw === "") {
		return fallback;
	}
	try {
		const parsed = JSON.parse(raw) as unknown;
		if (
			Array.isArray(parsed) &&
			parsed.length > 0 &&
			typeof parsed[0] === "object" &&
			parsed[0] !== null &&
			"message" in parsed[0] &&
			typeof (parsed[0] as { message: unknown }).message === "string"
		) {
			const messages = (parsed as { message: string }[])
				.map((item) => item.message)
				.filter(Boolean);
			return messages.length > 0 ? messages.join(" ") : fallback;
		}
	} catch {
		// not JSON or wrong shape
	}
	return raw ?? fallback;
}

function calculateDaysRemaining(deletedAt: Date | string): number {
	const now = Date.now();
	const deletedTime = new Date(deletedAt).getTime();
	const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
	const expiresAt = deletedTime + thirtyDaysMs;
	const remainingMs = expiresAt - now;
	return Math.max(0, Math.ceil(remainingMs / (24 * 60 * 60 * 1000)));
}

export const Route = createFileRoute("/workspaces/trash")({
	component: WorkspacesTrashRouteComponent,
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

function WorkspacesTrashRouteComponent() {
	const { sort, setSort } = useWorkspaceStore();
	const [searchQuery, setSearchQuery] = useState("");
	const deferredSearchQuery = useDeferredValue(searchQuery);

	const listQuery = useDeletedWorkspaceListQuery(sort);

	const workspaces = listQuery.data?.items ?? [];
	const filtered = useMemo(() => {
		if (!deferredSearchQuery.trim()) {
			return workspaces;
		}
		const q = deferredSearchQuery.trim().toLowerCase();
		return workspaces.filter(
			(w) =>
				w.name.toLowerCase().includes(q) ||
				(w.description?.toLowerCase().includes(q) ?? false)
		);
	}, [workspaces, deferredSearchQuery]);

	const isLoading = listQuery.isLoading;
	const hasWorkspaces = workspaces.length > 0;

	const handleSortChange = useCallback(
		(next: Partial<WorkspaceListInput>) => {
			setSort(next);
		},
		[setSort]
	);

	return (
		<main className="mx-2 min-h-0 max-w-[1440px] flex-1 px-4 py-8 sm:px-6 sm:py-12 md:mx-4 lg:mx-6">
			<div className="mb-8 sm:mb-12">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="font-semibold font-serif text-2xl text-foreground tracking-tight sm:text-4xl md:text-5xl">
							Trash
						</h1>
						<p className="mt-2 text-base text-muted-foreground sm:text-lg">
							Deleted workspaces are kept for 30 days before permanent removal.
						</p>
					</div>
					<Link to="/workspaces">
						<Button variant="outline">
							<FolderIcon className="mr-2 size-4" />
							Back to Workspaces
						</Button>
					</Link>
				</div>
			</div>

			<div className="mb-6 flex flex-col gap-4 sm:mb-8 md:flex-row md:items-center md:justify-between">
				<div className="relative max-w-md flex-1">
					<SearchIcon
						aria-hidden
						className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
					/>
					<Input
						aria-label="Search deleted workspaces"
						className="h-9 pr-4 pl-9 text-sm"
						onChange={(e) => setSearchQuery(e.target.value)}
						placeholder="Search deleted workspaces..."
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
					<WorkspaceGridSkeleton count={8} />
				</div>
			)}

			{!(isLoading || hasWorkspaces) && <EmptyState />}

			{!isLoading && hasWorkspaces && (
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
					{filtered.map((workspace) => (
						<DeletedWorkspaceCard key={workspace.id} workspace={workspace} />
					))}
				</div>
			)}
		</main>
	);
}

function EmptyState() {
	return (
		<div className="flex flex-col items-center justify-center rounded-xl border-2 border-border border-dashed bg-muted/20 py-16 text-center">
			<div className="mb-4 rounded-full bg-muted p-4">
				<Trash2Icon className="size-8 text-muted-foreground" />
			</div>
			<h2 className="font-semibold font-serif text-foreground text-xl">
				No deleted workspaces
			</h2>
			<p className="mt-2 max-w-sm text-muted-foreground text-sm">
				Workspaces you delete will appear here for 30 days before being
				permanently removed.
			</p>
			<Link className="mt-6" to="/workspaces">
				<Button variant="outline">
					<FolderIcon className="mr-2 size-4" />
					Back to Workspaces
				</Button>
			</Link>
		</div>
	);
}

type DeletedWorkspaceItem = NonNullable<
	ReturnType<typeof useDeletedWorkspaceListQuery>["data"]
>["items"][number];

function DeletedWorkspaceCard({
	workspace,
}: {
	workspace: DeletedWorkspaceItem;
}) {
	const [restoreOpen, setRestoreOpen] = useState(false);
	const restoreMutation = useRestoreWorkspaceMutation();

	const daysRemaining = calculateDaysRemaining(workspace.deletedAt);

	const handleRestore = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		restoreMutation.mutate(
			{ workspaceId: workspace.id },
			{
				onSuccess: () => {
					toast.success("Workspace restored successfully");
					setRestoreOpen(false);
				},
				onError: (error) => {
					toast.error(
						formatValidationErrorMessage(
							error.message,
							"Failed to restore workspace"
						)
					);
				},
			}
		);
	};

	return (
		<Card className="flex h-52 flex-col opacity-75">
			<CardHeader className="flex flex-row items-center justify-between border-b">
				<CardTitle className="line-clamp-1">{workspace.name}</CardTitle>
				<CardAction>
					<Button
						aria-label="Restore workspace"
						onClick={(e) => {
							e.preventDefault();
							e.stopPropagation();
							setRestoreOpen(true);
						}}
						size="icon"
						type="button"
						variant="ghost"
					>
						<ArchiveRestoreIcon className="size-4" />
					</Button>
				</CardAction>
			</CardHeader>
			<CardContent className="line-clamp-2 min-h-0 flex-1 text-muted-foreground">
				{workspace.description ?? "No description."}
			</CardContent>
			<CardFooter className="flex-col items-start gap-1 text-muted-foreground text-xs">
				<div className="w-full text-right">
					<span className="text-destructive">
						{daysRemaining === 0
							? "Expires today"
							: `${daysRemaining} day${daysRemaining === 1 ? "" : "s"} remaining`}
					</span>
				</div>
			</CardFooter>
			<AlertDialog onOpenChange={setRestoreOpen} open={restoreOpen}>
				<AlertDialogContent onClick={(e) => e.stopPropagation()}>
					<AlertDialogHeader>
						<AlertDialogTitle>Restore workspace?</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to restore &quot;{workspace.name}&quot;?
							This will restore the workspace and all its contents.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel
							onClick={(e) => {
								e.stopPropagation();
								setRestoreOpen(false);
							}}
						>
							Cancel
						</AlertDialogCancel>
						<AlertDialogAction
							disabled={restoreMutation.isPending}
							onClick={(e) => {
								e.stopPropagation();
								handleRestore(e as unknown as React.MouseEvent);
							}}
						>
							{restoreMutation.isPending ? "Restoring…" : "Restore workspace"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</Card>
	);
}
