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

const mockWorkspace = {
	create: vi.fn(),
	findMany: vi.fn(),
	findFirst: vi.fn(),
	update: vi.fn(),
};

vi.mock("@nexus/db", () => {
	return {
		default: {
			workspace: mockWorkspace,
		},
	};
});

import {
	createWorkspace,
	deleteWorkspace,
	getWorkspaceById,
	listWorkspaces,
	restoreWorkspace,
} from "@nexus/api/workspace.service";

describe("workspace.service", () => {
	const ownerId = "user-1";

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("creates a workspace for the owner", async () => {
		mockWorkspace.create.mockResolvedValueOnce({
			id: "ws-1",
			ownerId,
			name: "My Workspace",
			description: null,
			createdAt: new Date(),
			updatedAt: new Date(),
			deletedAt: null,
		});

		const result = await createWorkspace(ownerId, {
			name: "My Workspace",
		});

		expect(mockWorkspace.create).toHaveBeenCalledWith({
			data: {
				ownerId,
				name: "My Workspace",
				description: null,
			},
		});
		expect(result.ownerId).toBe(ownerId);
		expect(result.name).toBe("My Workspace");
	});

	it("lists only active workspaces for the owner", async () => {
		const now = new Date();
		mockWorkspace.findMany.mockResolvedValueOnce([
			{
				id: "ws-1",
				name: "A",
				description: null,
				createdAt: now,
				updatedAt: now,
			},
		]);

		const result = await listWorkspaces(ownerId, {});

		expect(mockWorkspace.findMany).toHaveBeenCalledWith({
			where: {
				ownerId,
				deletedAt: null,
			},
			orderBy: {
				updatedAt: "desc",
			},
			select: {
				id: true,
				name: true,
				description: true,
				createdAt: true,
				updatedAt: true,
			},
		});
		expect(result).toHaveLength(1);
		expect(result[0]?.id).toBe("ws-1");
	});

	it("returns null when getting a workspace that does not belong to the owner", async () => {
		mockWorkspace.findFirst.mockResolvedValueOnce(null);

		const result = await getWorkspaceById(ownerId, { workspaceId: "ws-2" });

		expect(result).toBeNull();
	});

	it("soft deletes an existing workspace", async () => {
		const now = new Date();
		mockWorkspace.findFirst.mockResolvedValueOnce({
			id: "ws-1",
			ownerId,
			name: "To Delete",
			description: null,
			createdAt: now,
			updatedAt: now,
			deletedAt: null,
		});
		mockWorkspace.update.mockResolvedValueOnce({
			id: "ws-1",
			ownerId,
			name: "To Delete",
			description: null,
			createdAt: now,
			updatedAt: now,
			deletedAt: now,
		});

		const result = await deleteWorkspace(ownerId, { workspaceId: "ws-1" });

		expect(mockWorkspace.update).toHaveBeenCalled();
		expect(result?.deletedAt).not.toBeNull();
	});

	it("does not restore a workspace outside the recovery window", async () => {
		const createdAt = new Date();
		const deletedAt = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000);

		mockWorkspace.findFirst.mockResolvedValueOnce({
			id: "ws-1",
			ownerId,
			name: "Old",
			description: null,
			createdAt,
			updatedAt: createdAt,
			deletedAt,
		});

		const result = await restoreWorkspace(ownerId, { workspaceId: "ws-1" });

		expect(result).toBeNull();
		expect(mockWorkspace.update).not.toHaveBeenCalled();
	});
});
