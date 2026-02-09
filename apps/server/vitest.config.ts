import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globals: true,
		include: ["src/**/*.test.ts"],
		exclude: ["**/dist/**", "**/node_modules/**", "**/*.config.*", "dist"],
		setupFiles: ["./src/test-setup.ts"],
		env: {
			DATABASE_URL: "file:./dev.db",
			BETTER_AUTH_SECRET: "test-secret-123456789012345678901234567890",
			BETTER_AUTH_URL: "http://localhost:3000",
			CORS_ORIGIN: "http://localhost:3000",
			NODE_ENV: "test",
		},
		server: {
			deps: {
				inline: ["@nexus/api", "@nexus/db"],
			},
		},
		pool: "forks",
		poolOptions: {
			forks: {
				singleFork: true,
			},
		},
		coverage: {
			enabled: true,
			provider: "v8",
			reporter: ["text", "html"],
			include: ["src/**/*.ts"],
			exclude: [
				"**/*.test.ts",
				"**/*.config.ts",
				"**/node_modules/**",
				"**/dist/**",
			],
		},
	},
});
