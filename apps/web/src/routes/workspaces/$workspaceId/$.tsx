import type { WorkspaceId } from "@branchbook/types";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { WorkspaceEmptyView } from "@/components/workspaces/workspace-empty-view";
import { WorkspaceSplitLayout } from "@/components/workspaces/workspace-split-layout";
import { useNodeTree } from "@/hooks/use-nodes";
import { authClient } from "@/lib/auth-client";
import { findNodeById } from "@/lib/workspace-navigation";

export const Route = createFileRoute("/workspaces/$workspaceId/$")({
	component: WorkspaceLayoutRoute,
	validateSearch: (search: Record<string, unknown>) => ({
		prefill: typeof search.prefill === "string" ? search.prefill : undefined,
	}),
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

function WorkspaceLayoutRoute() {
	const { workspaceId, _splat } = Route.useParams() as {
		workspaceId: WorkspaceId;
		_splat: string;
	};

	const { data: tree, isLoading } = useNodeTree(workspaceId);

	if (isLoading) {
		return (
			<div className="flex h-full items-center justify-center">
				<p className="animate-pulse text-muted-foreground text-sm">
					Loading workspace…
				</p>
			</div>
		);
	}

	const isEmpty = !tree || tree.length === 0;

	if (isEmpty) {
		return <WorkspaceEmptyView workspaceId={workspaceId} />;
	}

	// Parse the path segments from the splat parameter
	// The path is now: /workspaces/<workspace_id>/<root_node>/<child>/...
	const pathSegments = _splat ? _splat.split("/").filter(Boolean) : [];

	// Determine the current node ID from the last segment
	const currentNodeId = pathSegments.length > 0 ? pathSegments.at(-1) : null;

	// Validate that the node exists in the tree if we have a node ID
	if (currentNodeId) {
		const nodeExists = findNodeById(tree, currentNodeId);

		if (!nodeExists) {
			// Node doesn't exist in tree - show blank state
			console.warn(
				`Node ${currentNodeId} not found in tree. Showing blank workspace.`
			);
			return (
				<WorkspaceSplitLayout
					currentNodeId={null}
					rootId={workspaceId}
					tree={tree}
				/>
			);
		}
	}

	return (
		<WorkspaceSplitLayout
			currentNodeId={currentNodeId ?? null}
			rootId={workspaceId}
			tree={tree}
		/>
	);
}
