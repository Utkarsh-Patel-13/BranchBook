import { createContext } from "@branchbook/api/context";
import { type AppRouter, appRouter } from "@branchbook/api/routers/index";
import { auth } from "@branchbook/auth";
import fastifyCors from "@fastify/cors";
import {
	type FastifyTRPCPluginOptions,
	fastifyTRPCPlugin,
} from "@trpc/server/adapters/fastify";
import Fastify from "fastify";
import { registerWorkspaceFeatures } from "./features/workspaces";
import { registerChatRoute } from "./routes/chat";

const baseCorsConfig = {
	// origin: env.CORS_ORIGIN,
	// biome-ignore lint/suspicious/noExplicitAny: we need to allow any origin
	origin: (origin: any, cb: any) => {
		const hostname = new URL(origin).hostname;
		if (hostname === "localhost") {
			//  Request from localhost will pass
			cb(null, true);
			return;
		}
		// Generate an error on other origins, disabling access
		cb(new Error("Not allowed"), false);
	},
	methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
	allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
	credentials: true,
	maxAge: 86_400,
};

const fastify = Fastify({
	logger: true,
});

fastify.register(fastifyCors, baseCorsConfig);

await fastify.register(import("@fastify/rate-limit"), {
	max: 100,
	timeWindow: "1 minute",
	keyGenerator: (req) => req.ip,
});

registerWorkspaceFeatures(fastify);
registerChatRoute(fastify);

fastify.route({
	method: ["GET", "POST"],
	url: "/api/auth/*",
	async handler(request, reply) {
		try {
			const url = new URL(request.url, `http://${request.headers.host}`);
			const headers = new Headers();
			for (const [key, value] of Object.entries(request.headers)) {
				if (value) {
					headers.append(key, value.toString());
				}
			}
			const req = new Request(url.toString(), {
				method: request.method,
				headers,
				body: request.body ? JSON.stringify(request.body) : undefined,
			});
			const response = await auth.handler(req);
			reply.status(response.status);
			for (const [key, value] of response.headers) {
				reply.header(key, value);
			}
			reply.send(response.body ? await response.text() : null);
		} catch (error) {
			fastify.log.error({ err: error }, "Authentication Error:");
			reply.status(500).send({
				error: "Internal authentication error",
				code: "AUTH_FAILURE",
			});
		}
	},
});

fastify.register(fastifyTRPCPlugin, {
	prefix: "/trpc",
	trpcOptions: {
		router: appRouter,
		createContext,
		onError({ path, error }) {
			fastify.log.error(
				{ path, error: error.message, code: error.code },
				"tRPC procedure error"
			);
		},
	} satisfies FastifyTRPCPluginOptions<AppRouter>["trpcOptions"],
});

fastify.get("/", () => {
	return "OK";
});

fastify.listen({ port: 3000 }, (err) => {
	if (err) {
		fastify.log.error(err);
		process.exit(1);
	}
	console.log("Server running on port 3000");
});
