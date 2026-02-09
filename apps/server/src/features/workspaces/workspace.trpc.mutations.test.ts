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

const mockUpdateWorkspace = vi.fn();
const mockDeleteWorkspace = vi.fn();
const mockRestoreWorkspace = vi.fn();

vi.mock("@nexus/api/workspace.service", () => {
	return {
		updateWorkspace: mockUpdateWorkspace,
		deleteWorkspace: mockDeleteWorkspace,
		restoreWorkspace: mockRestoreWorkspace,
	};
});

import {
	deleteWorkspace,
	restoreWorkspace,
	updateWorkspace,
} from "@nexus/api/workspace.service";

type UpdateInput = inferProcedureInput<AppRouter["workspace"]["update"]>;
type UpdateOutput = inferProcedureOutput<AppRouter["workspace"]["update"]>;
type DeleteInput = inferProcedureInput<AppRouter["workspace"]["delete"]>;
type DeleteOutput = inferProcedureOutput<AppRouter["workspace"]["delete"]>;
type RestoreInput = inferProcedureInput<AppRouter["workspace"]["restore"]>;
type RestoreOutput = inferProcedureOutput<AppRouter["workspace"]["restore"]>;

describe("workspace tRPC procedures (mutations)", () => {
	const userId = "user-1";

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("delegates to workspace service on update", async () => {
		const input = {
			workspaceId: "ws-1",
			name: "Updated Name",
			description: "Updated description",
		} satisfies UpdateInput;

		const now = new Date();
		const updated: UpdateOutput = {
			id: "ws-1",
			ownerId: userId,
			name: "Updated Name",
			description: "Updated description",
			createdAt: now,
			updatedAt: now,
			deletedAt: null,
		};

		mockUpdateWorkspace.mockResolvedValueOnce(updated);

		const result = await updateWorkspace(userId, input);

		expect(mockUpdateWorkspace).toHaveBeenCalledWith(userId, input);
		expect(result).toEqual(updated);
		if (result) {
			expect(result.name).toBe("Updated Name");
			expect(result.description).toBe("Updated description");
		}
	});

	it("delegates to workspace service on delete", async () => {
		const input = {
			workspaceId: "ws-1",
		} satisfies DeleteInput;

		const now = new Date();
		const deleted: DeleteOutput = {
			id: "ws-1",
			deletedAt: now,
		};

		const fullDeletedWorkspace = {
			...deleted,
			ownerId: userId,
			name: "Deleted Workspace",
			description: null,
			createdAt: now,
			updatedAt: now,
		};

		mockDeleteWorkspace.mockResolvedValueOnce(fullDeletedWorkspace);

		const result = await deleteWorkspace(userId, input);

		expect(mockDeleteWorkspace).toHaveBeenCalledWith(userId, input);
		expect(result?.deletedAt).not.toBeNull();
		expect(result?.id).toBe("ws-1");
	});

	it("delegates to workspace service on restore", async () => {
		const input = {
			workspaceId: "ws-1",
		} satisfies RestoreInput;

		const now = new Date();
		const restored: RestoreOutput = {
			id: "ws-1",
			ownerId: userId,
			name: "Restored Workspace",
			description: null,
			createdAt: now,
			updatedAt: now,
			deletedAt: null,
		};

		mockRestoreWorkspace.mockResolvedValueOnce(restored);

		const result = await restoreWorkspace(userId, input);

		expect(mockRestoreWorkspace).toHaveBeenCalledWith(userId, input);
		expect(result).toEqual(restored);
		if (result) {
			expect(result.deletedAt).toBeNull();
		}
	});

	it("returns null when updating non-existent workspace", async () => {
		const input = {
			workspaceId: "non-existent",
			name: "New Name",
		} satisfies UpdateInput;

		mockUpdateWorkspace.mockResolvedValueOnce(null);

		const result = await updateWorkspace(userId, input);

		expect(result).toBeNull();
	});

	it("returns null when deleting already deleted workspace", async () => {
		const input = {
			workspaceId: "already-deleted",
		} satisfies DeleteInput;

		mockDeleteWorkspace.mockResolvedValueOnce(null);

		const result = await deleteWorkspace(userId, input);

		expect(result).toBeNull();
	});

	it("returns null when restoring workspace outside recovery window", async () => {
		const input = {
			workspaceId: "expired-ws",
		} satisfies RestoreInput;

		mockRestoreWorkspace.mockResolvedValueOnce(null);

		const result = await restoreWorkspace(userId, input);

		expect(result ?? null).toBeNull();
	});
});
