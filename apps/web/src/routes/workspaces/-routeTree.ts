import {
	Route as WorkspaceDetailRoute,
	Route as WorkspaceSplitViewRoute,
} from "./$workspaceId";
import { Route as WorkspacesListRoute } from "./index";

export const workspaceRouteTree = {
	WorkspacesListRoute,
	WorkspaceDetailRoute,
	WorkspaceSplitViewRoute,
} as const;
