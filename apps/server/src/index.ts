import { createContext } from "@branchbook/api/context";
import { type AppRouter, appRouter } from "@branchbook/api/routers/index";
import { auth } from "@branchbook/auth";
import { env } from "@branchbook/env/server";
import fastifyCors from "@fastify/cors";
import {
	type FastifyTRPCPluginOptions,
	fastifyTRPCPlugin,
} from "@trpc/server/adapters/fastify";
import Fastify from "fastify";
import { registerWorkspaceFeatures } from "./features/workspaces";
import { registerChatRoute } from "./routes/chat";
import { startContextEngineWorker } from "./workers/context-engine.worker";

const isDev = env.NODE_ENV !== "production";

const baseCorsConfig = {
	origin: isDev
		? // In development allow any localhost origin regardless of port
			// biome-ignore lint/suspicious/noExplicitAny: fastify-cors callback typing
			(origin: any, cb: any) => {
				if (!origin) {
					cb(null, true);
					return;
				}
				let hostname: string;
				try {
					hostname = new URL(origin).hostname;
				} catch {
					cb(new Error("Not allowed"), false);
					return;
				}
				cb(
					hostname === "localhost" ? null : new Error("Not allowed"),
					hostname === "localhost"
				);
			}
		: env.CORS_ORIGIN,
	methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
	allowedHeaders: [
		"Content-Type",
		"Authorization",
		"X-Requested-With",
		"User-Agent",
	],
	credentials: true,
	maxAge: 86_400,
};

const fastify = Fastify({
	logger: isDev
		? {
				transport: {
					target: "pino-pretty",
					options: {
						colorize: true,
						translateTime: "HH:MM:ss",
						ignore: "pid,hostname",
						messageFormat: "{msg} {reqId}",
					},
				},
			}
		: true,
});

// Start the context-engine background worker
const contextWorker = startContextEngineWorker();
contextWorker
	.waitUntilReady()
	.then(() => {
		fastify.log.info("[INFO] context-engine worker started (concurrency: 5)");
	})
	.catch((err: unknown) => {
		fastify.log.error(
			{ err },
			"Failed to start context-engine worker: Redis connection failed"
		);
		process.exit(1);
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
