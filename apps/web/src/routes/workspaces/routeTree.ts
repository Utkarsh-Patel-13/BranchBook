import { Route as WorkspaceDetailRoute } from "./$workspaceId";
import { Route as WorkspacesListRoute } from "./index";

export const workspaceRouteTree = {
	WorkspacesListRoute,
	WorkspaceDetailRoute,
} as const;
