import type { WorkspaceId } from "@nexus/types";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { WorkspaceEmptyView } from "@/components/workspaces/workspace-empty-view";
import { WorkspaceSplitLayout } from "@/components/workspaces/workspace-split-layout";
import { useNodeTree } from "@/hooks/use-nodes";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/workspaces/$workspaceId/")({
	component: WorkspaceSplitViewRouteComponent,
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

function WorkspaceSplitViewRouteComponent() {
	const { workspaceId } = Route.useParams() as { workspaceId: WorkspaceId };
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

	console.log({ tree, workspaceId });

	// Show workspace with no node selected - user must select from sidebar
	return (
		<WorkspaceSplitLayout
			currentNodeId={null}
			rootId={workspaceId}
			tree={tree}
		/>
	);
}
