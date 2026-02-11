import { Route as WorkspaceDetailRoute } from "./$workspaceId";
import { Route as WorkspacesListRoute } from "./index";
import { Route as WorkspaceSplitViewRoute } from "./new/$workspaceId";

export const workspaceRouteTree = {
	WorkspacesListRoute,
	WorkspaceDetailRoute,
	WorkspaceSplitViewRoute,
} as const;
