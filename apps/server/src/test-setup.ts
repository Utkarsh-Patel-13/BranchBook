import { vi } from "vitest";

// Mock @branchbook/env/server before any imports that use it
vi.mock("@branchbook/env/server", () => {
	return {
		env: {
			DATABASE_URL: "file:./dev.db",
			BETTER_AUTH_SECRET: "test-secret-123456789012345678901234567890",
			BETTER_AUTH_URL: "http://localhost:3000",
			CORS_ORIGIN: "http://localhost:3000",
			NODE_ENV: "test",
		},
	};
});
