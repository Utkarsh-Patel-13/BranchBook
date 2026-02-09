import type { WorkspaceId } from "@nexus/types";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { useWorkspaceByIdQuery } from "@/hooks/useWorkspaces";
import { authClient } from "@/lib/auth-client";

function formatDate(
	value: Date | string | number,
	options: Intl.DateTimeFormatOptions
) {
	const date = value instanceof Date ? value : new Date(value);
	return new Intl.DateTimeFormat(undefined, options).format(date);
}

export const Route = createFileRoute("/workspaces/$workspaceId")({
	component: WorkspaceDetailRouteComponent,
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

function WorkspaceDetailRouteComponent() {
	const { workspaceId } = Route.useParams() as { workspaceId: WorkspaceId };
	const workspaceQuery = useWorkspaceByIdQuery(workspaceId);

	const workspace = workspaceQuery.data;

	return (
		<div className="container mx-auto flex max-w-3xl flex-col gap-4 px-4 py-4">
			<div className="flex items-center justify-between gap-2">
				<h1 className="font-semibold text-lg">Workspace details</h1>
				<Link to="/workspaces">
					<Button size="sm" variant="outline">
						Back to workspaces
					</Button>
				</Link>
			</div>

			{workspaceQuery.isLoading && (
				<p className="text-muted-foreground text-sm">Loading workspace…</p>
			)}

			{!(workspaceQuery.isLoading || workspace) && (
				<p className="text-muted-foreground text-sm">
					Workspace not found or you do not have access to it.
				</p>
			)}

			{workspace && (
				<Card>
					<CardHeader>
						<CardTitle>{workspace.name}</CardTitle>
						<CardDescription>
							{workspace.description
								? workspace.description
								: "No description provided."}
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-1 text-muted-foreground text-xs">
						<p>
							<span className="font-medium">Workspace ID:</span> {workspace.id}
						</p>
						<p>
							<span className="font-medium">Created:</span>{" "}
							{formatDate(workspace.createdAt, {
								month: "short",
								day: "numeric",
								year: "numeric",
								hour: "2-digit",
								minute: "2-digit",
							})}
						</p>
						<p>
							<span className="font-medium">Last updated:</span>{" "}
							{formatDate(workspace.updatedAt, {
								month: "short",
								day: "numeric",
								year: "numeric",
								hour: "2-digit",
								minute: "2-digit",
							})}
						</p>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
