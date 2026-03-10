import { expo } from "@better-auth/expo";
import prisma from "@branchbook/db";
import { env } from "@branchbook/env/server";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

export const auth = betterAuth({
	database: prismaAdapter(prisma, {
		provider: "postgresql",
	}),

	trustedOrigins: [
		env.CORS_ORIGIN,
		env.BETTER_AUTH_URL,
		"mybettertapp://",
		"tauri://localhost",
		...(env.NODE_ENV !== "production"
			? [
					// Trust all common localhost ports in development/docker
					"http://localhost:3000",
					"http://localhost:3001",
					"http://localhost:5173",
					"http://localhost:4173",
					"http://localhost:8081",
					"exp://",
					"exp://**",
					"exp://192.168.*.*:*/**",
				]
			: []),
	],
	emailAndPassword: {
		enabled: true,
	},
	advanced: {
		defaultCookieAttributes: {
			sameSite: env.NODE_ENV === "development" ? "lax" : "none",
			secure: env.NODE_ENV !== "development",
			httpOnly: true,
		},
	},
	plugins: [expo()],
});
