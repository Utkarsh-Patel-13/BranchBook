import {
	workspaceCreateInputSchema,
	workspaceDeleteInputSchema,
	workspaceGetByIdInputSchema,
	workspaceListInputSchema,
	workspaceRestoreInputSchema,
	workspaceUpdateInputSchema,
} from "./workspaces";

describe("workspaceCreateInputSchema", () => {
	it("accepts valid name and optional description", () => {
		const result = workspaceCreateInputSchema.parse({
			name: "My Workspace",
			description: "A valid description",
		});

		expect(result).toEqual({
			name: "My Workspace",
			description: "A valid description",
		});
	});

	it("rejects too-short names", () => {
		expect(() =>
			workspaceCreateInputSchema.parse({
				name: "ab",
			})
		).toThrow();
	});

	it("rejects too-long names", () => {
		const longName = "a".repeat(101);

		expect(() =>
			workspaceCreateInputSchema.parse({
				name: longName,
			})
		).toThrow();
	});

	it("rejects too-long descriptions", () => {
		const longDescription = "a".repeat(501);

		expect(() =>
			workspaceCreateInputSchema.parse({
				name: "Valid Name",
				description: longDescription,
			})
		).toThrow();
	});
});

describe("workspaceListInputSchema", () => {
	it("accepts empty input", () => {
		const result = workspaceListInputSchema.parse({});

		expect(result).toEqual({});
	});

	it("accepts valid sort options", () => {
		const result = workspaceListInputSchema.parse({
			sortBy: "createdAt",
			sortDirection: "asc",
		});

		expect(result).toEqual({
			sortBy: "createdAt",
			sortDirection: "asc",
		});
	});

	it("rejects invalid sortBy", () => {
		expect(() =>
			workspaceListInputSchema.parse({
				// @ts-expect-error invalid sortBy
				sortBy: "invalid",
			})
		).toThrow();
	});
});

describe("workspaceGetByIdInputSchema", () => {
	it("accepts a non-empty workspaceId", () => {
		const result = workspaceGetByIdInputSchema.parse({
			workspaceId: "workspace-1",
		});

		expect(result).toEqual({
			workspaceId: "workspace-1",
		});
	});

	it("rejects an empty workspaceId", () => {
		expect(() =>
			workspaceGetByIdInputSchema.parse({
				workspaceId: "",
			})
		).toThrow();
	});
});

describe("workspaceUpdateInputSchema", () => {
	it("accepts updating name", () => {
		const result = workspaceUpdateInputSchema.parse({
			workspaceId: "workspace-1",
			name: "Updated Name",
		});

		expect(result).toEqual({
			workspaceId: "workspace-1",
			name: "Updated Name",
		});
	});

	it("accepts updating description", () => {
		const result = workspaceUpdateInputSchema.parse({
			workspaceId: "workspace-1",
			description: "Updated description",
		});

		expect(result).toEqual({
			workspaceId: "workspace-1",
			description: "Updated description",
		});
	});

	it("rejects when neither name nor description is provided", () => {
		expect(() =>
			workspaceUpdateInputSchema.parse({
				workspaceId: "workspace-1",
			})
		).toThrow();
	});
});

describe("workspaceDeleteInputSchema", () => {
	it("accepts a valid workspaceId", () => {
		const result = workspaceDeleteInputSchema.parse({
			workspaceId: "workspace-1",
		});

		expect(result).toEqual({
			workspaceId: "workspace-1",
		});
	});
});

describe("workspaceRestoreInputSchema", () => {
	it("accepts a valid workspaceId", () => {
		const result = workspaceRestoreInputSchema.parse({
			workspaceId: "workspace-1",
		});

		expect(result).toEqual({
			workspaceId: "workspace-1",
		});
	});
});
