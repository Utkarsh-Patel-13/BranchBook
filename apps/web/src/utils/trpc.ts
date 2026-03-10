import type { AppRouter } from "@branchbook/api/routers/index";

import { env } from "@branchbook/env/web";
import { QueryCache, QueryClient } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { toast } from "sonner";

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 30_000,
			refetchOnWindowFocus: true,
		},
	},
	queryCache: new QueryCache({
		onError: (error, query) => {
			toast.error(error.message, {
				action: {
					label: "retry",
					onClick: query.invalidate,
				},
			});
		},
	}),
});

const trpcClient = createTRPCClient<AppRouter>({
	links: [
		httpBatchLink({
			url: `${env.VITE_SERVER_URL}/trpc`,
			fetch(url, options) {
				return fetch(url, {
					...options,
					credentials: "include",
				});
			},
		}),
	],
});

export const trpc = createTRPCOptionsProxy<AppRouter>({
	client: trpcClient,
	queryClient,
});

export function formatTRPCErrorMessage(
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
