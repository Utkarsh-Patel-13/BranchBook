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
	updateWorkspace,
} from "@nexus/api/workspace.service";

describe("workspace authorization and ownership enforcement", () => {
	const owner1 = "user-1";
	const owner2 = "user-2";
	const now = new Date();

	const workspace1 = {
		id: "ws-1",
		ownerId: owner1,
		name: "Owner 1 Workspace",
		description: null,
		createdAt: now,
		updatedAt: now,
		deletedAt: null,
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("list workspaces", () => {
		it("returns only workspaces owned by the authenticated user", async () => {
			mockWorkspace.findMany.mockResolvedValueOnce([
				{
					id: workspace1.id,
					name: workspace1.name,
					description: workspace1.description,
					createdAt: workspace1.createdAt,
					updatedAt: workspace1.updatedAt,
				},
			]);

			const result = await listWorkspaces(owner1, {});

			expect(mockWorkspace.findMany).toHaveBeenCalledWith({
				where: {
					ownerId: owner1,
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
			expect(result[0]?.id).toBe(workspace1.id);
		});

		it("does not leak workspaces from other users", async () => {
			mockWorkspace.findMany.mockResolvedValueOnce([]);

			const result = await listWorkspaces(owner2, {});

			expect(mockWorkspace.findMany).toHaveBeenCalledWith(
				expect.objectContaining({
					where: expect.objectContaining({
						ownerId: owner2,
					}),
				})
			);
			expect(result).toHaveLength(0);
		});
	});

	describe("getById with ownership check", () => {
		it("returns workspace when owner matches", async () => {
			mockWorkspace.findFirst.mockResolvedValueOnce(workspace1);

			const result = await getWorkspaceById(owner1, { workspaceId: "ws-1" });

			expect(mockWorkspace.findFirst).toHaveBeenCalledWith({
				where: {
					id: "ws-1",
					ownerId: owner1,
				},
			});
			expect(result).not.toBeNull();
			expect(result?.ownerId).toBe(owner1);
		});

		it("returns null when workspace is owned by another user", async () => {
			mockWorkspace.findFirst.mockResolvedValueOnce(null);

			const result = await getWorkspaceById(owner2, { workspaceId: "ws-1" });

			expect(mockWorkspace.findFirst).toHaveBeenCalledWith({
				where: {
					id: "ws-1",
					ownerId: owner2,
				},
			});
			expect(result).toBeNull();
		});

		it("returns null when workspace does not exist", async () => {
			mockWorkspace.findFirst.mockResolvedValueOnce(null);

			const result = await getWorkspaceById(owner1, {
				workspaceId: "non-existent",
			});

			expect(result).toBeNull();
		});
	});

	describe("update with ownership check", () => {
		it("allows update when user owns the workspace", async () => {
			mockWorkspace.findFirst.mockResolvedValueOnce(workspace1);
			mockWorkspace.update.mockResolvedValueOnce({
				...workspace1,
				name: "Updated Name",
			});

			const result = await updateWorkspace(owner1, {
				workspaceId: "ws-1",
				name: "Updated Name",
			});

			expect(result).not.toBeNull();
			expect(result?.name).toBe("Updated Name");
		});

		it("returns null when user does not own the workspace", async () => {
			mockWorkspace.findFirst.mockResolvedValueOnce(null);

			const result = await updateWorkspace(owner2, {
				workspaceId: "ws-1",
				name: "Hacked Name",
			});

			expect(result).toBeNull();
			expect(mockWorkspace.update).not.toHaveBeenCalled();
		});
	});

	describe("delete with ownership check", () => {
		it("allows delete when user owns the workspace", async () => {
			mockWorkspace.findFirst.mockResolvedValueOnce(workspace1);
			mockWorkspace.update.mockResolvedValueOnce({
				...workspace1,
				deletedAt: now,
			});

			const result = await deleteWorkspace(owner1, { workspaceId: "ws-1" });

			expect(result).not.toBeNull();
			expect(result?.deletedAt).not.toBeNull();
		});

		it("returns null when user does not own the workspace", async () => {
			mockWorkspace.findFirst.mockResolvedValueOnce(null);

			const result = await deleteWorkspace(owner2, { workspaceId: "ws-1" });

			expect(result).toBeNull();
			expect(mockWorkspace.update).not.toHaveBeenCalled();
		});

		it("prevents double deletion", async () => {
			mockWorkspace.findFirst.mockResolvedValueOnce({
				...workspace1,
				deletedAt: now,
			});

			const result = await deleteWorkspace(owner1, { workspaceId: "ws-1" });

			expect(result).toBeNull();
			expect(mockWorkspace.update).not.toHaveBeenCalled();
		});
	});

	describe("restore with ownership check", () => {
		it("allows restore when user owns the workspace", async () => {
			const recentDeletion = new Date(Date.now() - 1000 * 60 * 60 * 24); // 1 day ago

			mockWorkspace.findFirst.mockResolvedValueOnce({
				...workspace1,
				deletedAt: recentDeletion,
			});
			mockWorkspace.update.mockResolvedValueOnce({
				...workspace1,
				deletedAt: null,
			});

			const result = await restoreWorkspace(owner1, { workspaceId: "ws-1" });

			expect(result).not.toBeNull();
			expect(result?.deletedAt).toBeNull();
		});

		it("returns null when user does not own the workspace", async () => {
			mockWorkspace.findFirst.mockResolvedValueOnce(null);

			const result = await restoreWorkspace(owner2, { workspaceId: "ws-1" });

			expect(result).toBeNull();
			expect(mockWorkspace.update).not.toHaveBeenCalled();
		});

		it("enforces 30-day recovery window", async () => {
			const oldDeletion = new Date(Date.now() - 1000 * 60 * 60 * 24 * 31); // 31 days ago

			mockWorkspace.findFirst.mockResolvedValueOnce({
				...workspace1,
				deletedAt: oldDeletion,
			});

			const result = await restoreWorkspace(owner1, { workspaceId: "ws-1" });

			expect(result).toBeNull();
			expect(mockWorkspace.update).not.toHaveBeenCalled();
		});
	});

	describe("create workspace ownership", () => {
		it("assigns ownership to the authenticated user", async () => {
			mockWorkspace.create.mockResolvedValueOnce(workspace1);

			const result = await createWorkspace(owner1, {
				name: "New Workspace",
			});

			expect(mockWorkspace.create).toHaveBeenCalledWith({
				data: {
					ownerId: owner1,
					name: "New Workspace",
					description: null,
				},
			});
			expect(result.ownerId).toBe(owner1);
		});
	});
});
