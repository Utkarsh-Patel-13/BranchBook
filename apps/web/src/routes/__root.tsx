import type { QueryClient } from "@tanstack/react-query";

import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
	createRootRouteWithContext,
	HeadContent,
	Outlet,
	useRouterState,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import Header from "@/components/header";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import type { trpc } from "@/utils/trpc";

import "../index.css";

export interface RouterAppContext {
	trpc: typeof trpc;
	queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
	component: RootComponent,
	head: () => ({
		meta: [
			{
				title: "BranchBook",
			},
			{
				name: "description",
				content:
					"BranchBook is a workspace where note-taking and AI conversation exist as equals, enabling non-linear exploration and organic knowledge structuring. It's designed for anyone who learns, explores, or develops ideas through conversation and documentation - from students mastering complex subjects to developers architecting systems to researchers connecting concepts.",
			},
		],
		links: [
			{
				rel: "icon",
				href: "/favicon.ico",
			},
		],
	}),
});

function RootComponent() {
	const routerState = useRouterState();
	const pathname = routerState.location.pathname;

	// Hide header for workspace detail routes
	const isWorkspaceDetailRoute =
		pathname.startsWith("/workspaces/") &&
		pathname !== "/workspaces" &&
		pathname !== "/workspaces/trash";

	return (
		<>
			<HeadContent />
			<ThemeProvider
				attribute="class"
				defaultTheme="dark"
				disableTransitionOnChange
				storageKey="vite-ui-theme"
			>
				<div
					className={
						isWorkspaceDetailRoute ? "h-svh" : "grid h-svh grid-rows-[auto_1fr]"
					}
				>
					{!isWorkspaceDetailRoute && <Header />}
					<Outlet />
				</div>
				<Toaster richColors />
			</ThemeProvider>
			<TanStackRouterDevtools position="bottom-left" />
			<ReactQueryDevtools buttonPosition="bottom-right" position="bottom" />
		</>
	);
}
