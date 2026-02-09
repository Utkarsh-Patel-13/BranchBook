import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globals: true,
		include: ["apps/**/*.test.ts", "packages/**/*.test.ts"],
		exclude: ["**/node_modules/**", "**/dist/**", "**/.turbo/**"],
		env: {
			DATABASE_URL: "file:./dev.db",
			BETTER_AUTH_SECRET: "test-secret-123456789012345678901234567890",
			BETTER_AUTH_URL: "http://localhost:3000",
			CORS_ORIGIN: "http://localhost:3000",
			NODE_ENV: "test",
		},
		pool: "forks",
		poolOptions: {
			forks: {
				singleFork: true,
			},
		},
	},
});
