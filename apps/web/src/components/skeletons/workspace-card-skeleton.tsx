import { Skeleton } from "@/components/ui/skeleton";

function WorkspaceCardSkeleton() {
	return (
		<div
			className="flex h-52 w-full flex-col justify-between rounded-xl border border-border bg-card p-4"
			data-slot="workspace-card-skeleton"
		>
			<div className="flex items-start justify-between">
				<Skeleton className="size-10 rounded-lg" />
				<Skeleton className="size-8 rounded-lg" />
			</div>
			<div className="space-y-2">
				<Skeleton className="h-6 w-3/4 rounded-md" />
				<Skeleton className="h-4 w-full rounded-md" />
				<Skeleton className="h-4 w-2/3 rounded-md" />
			</div>
			<div className="flex items-center justify-between border-border border-t pt-4">
				<Skeleton className="h-3 w-16 rounded" />
				<Skeleton className="h-3 w-20 rounded" />
			</div>
		</div>
	);
}

export function WorkspaceGridSkeleton({ count = 8 }: { count?: number }) {
	return (
		<div
			className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
			data-slot="workspace-grid-skeleton"
		>
			{Array.from({ length: count }, (_, i) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: skeleton items don't have stable IDs
				<WorkspaceCardSkeleton key={i} />
			))}
		</div>
	);
}
