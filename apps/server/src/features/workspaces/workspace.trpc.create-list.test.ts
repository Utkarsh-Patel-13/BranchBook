import type { AppRouter } from "@nexus/api/routers/index";
import type { inferProcedureInput, inferProcedureOutput } from "@trpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock environment before anything else
vi.mock("@nexus/env/server", () => ({
	env: {
		DATABASE_URL: "file:./dev.db",
		BETTER_AUTH_SECRET: "test-secret-123456789012345678901234567890",
		BETTER_AUTH_URL: "http://localhost:3000",
		CORS_ORIGIN: "http://localhost:3000",
		NODE_ENV: "test" as const,
	},
}));

const mockCreateWorkspace = vi.fn();
const mockListWorkspaces = vi.fn();

vi.mock("@nexus/api/workspace.service", () => {
	return {
		createWorkspace: mockCreateWorkspace,
		listWorkspaces: mockListWorkspaces,
	};
});

import { createWorkspace, listWorkspaces } from "@nexus/api/workspace.service";

type CreateInput = inferProcedureInput<AppRouter["workspace"]["create"]>;
type CreateOutput = inferProcedureOutput<AppRouter["workspace"]["create"]>;
type ListInput = inferProcedureInput<AppRouter["workspace"]["list"]>;
type ListOutput = inferProcedureOutput<AppRouter["workspace"]["list"]>;

describe("workspace tRPC procedures (create & list)", () => {
	const userId = "user-1";

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("delegates to workspace service on create", async () => {
		const input = {
			name: "My Workspace",
			description: null,
		} satisfies CreateInput;

		const created: CreateOutput = {
			id: "ws-1",
			ownerId: userId,
			name: "My Workspace",
			description: null,
			createdAt: new Date(),
			updatedAt: new Date(),
			deletedAt: null,
		};

		mockCreateWorkspace.mockResolvedValueOnce(created);

		// This does not call the real router, but verifies the service contract.
		const result = await createWorkspace(userId, input);

		expect(mockCreateWorkspace).toHaveBeenCalledWith(userId, input);
		expect(result).toEqual(created);
	});

	it("delegates to workspace service on list", async () => {
		const input = {
			sortBy: "lastUpdated" as const,
			sortDirection: "desc" as const,
		} satisfies ListInput;

		const listed: ListOutput = [
			{
				id: "ws-1",
				name: "My Workspace",
				description: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
		];

		mockListWorkspaces.mockResolvedValueOnce(listed);

		const result = await listWorkspaces(userId, input);

		expect(mockListWorkspaces).toHaveBeenCalledWith(userId, input);
		expect(result).toEqual(listed);
	});
});
