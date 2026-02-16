const STORAGE_KEY_PREFIX = "nexus:workspace:layout";

export type DesktopView = "chat" | "both" | "notes";

interface WorkspaceLayout {
	selectedNodeId: string | null;
	sidebarOpen: boolean;
	panelSizes: number[];
	desktopView: DesktopView;
	editMode: boolean;
}

const DEFAULT_LAYOUT: WorkspaceLayout = {
	selectedNodeId: null,
	sidebarOpen: true,
	panelSizes: [50, 50],
	desktopView: "both",
	editMode: false,
};

function storageKey(workspaceId: string): string {
	return `${STORAGE_KEY_PREFIX}:${workspaceId}`;
}

function parseLayout(raw: unknown): WorkspaceLayout {
	if (typeof raw !== "object" || raw === null) {
		return { ...DEFAULT_LAYOUT };
	}

	const obj = raw as Record<string, unknown>;

	const selectedNodeId =
		typeof obj.selectedNodeId === "string" || obj.selectedNodeId === null
			? (obj.selectedNodeId as string | null)
			: null;

	const sidebarOpen =
		typeof obj.sidebarOpen === "boolean" ? obj.sidebarOpen : true;

	const panelSizes =
		Array.isArray(obj.panelSizes) &&
		obj.panelSizes.length === 2 &&
		obj.panelSizes.every((v) => typeof v === "number")
			? (obj.panelSizes as number[])
			: [50, 50];

	const desktopView = (() => {
		if (
			obj.desktopView === "chat" ||
			obj.desktopView === "both" ||
			obj.desktopView === "notes"
		) {
			return obj.desktopView;
		}
		const legacyNotesVisible =
			typeof obj.notesVisible === "boolean" ? obj.notesVisible : true;
		return legacyNotesVisible ? "both" : "chat";
	})();

	const editMode = typeof obj.editMode === "boolean" ? obj.editMode : false;

	return { selectedNodeId, sidebarOpen, panelSizes, desktopView, editMode };
}

export function getLayout(workspaceId: string): WorkspaceLayout {
	try {
		const raw = localStorage.getItem(storageKey(workspaceId));
		if (raw === null) {
			return { ...DEFAULT_LAYOUT };
		}
		return parseLayout(JSON.parse(raw));
	} catch {
		return { ...DEFAULT_LAYOUT };
	}
}

export function setLayout(
	workspaceId: string,
	payload: Partial<WorkspaceLayout>
): void {
	try {
		const current = getLayout(workspaceId);
		const next = { ...current, ...payload };
		localStorage.setItem(storageKey(workspaceId), JSON.stringify(next));
	} catch {
		// localStorage may be unavailable (e.g. private browsing with storage disabled)
	}
}
