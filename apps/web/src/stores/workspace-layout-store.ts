import { create } from "zustand";
import { getLayout, setLayout } from "@/lib/workspace-layout-storage";

interface WorkspaceLayoutState {
	workspaceId: string | null;
	selectedNodeId: string | null;
	sidebarOpen: boolean;
	panelSizes: number[];
	notesVisible: boolean;
	editMode: boolean;
	contextModalOpen: boolean;
	mobileView: "chat" | "notes";
	initLayout: (workspaceId: string) => void;
	setSelectedNodeId: (nodeId: string | null) => void;
	setSidebarOpen: (open: boolean) => void;
	setPanelSizes: (sizes: number[]) => void;
	setNotesVisible: (visible: boolean) => void;
	setEditMode: (enabled: boolean) => void;
	setContextModalOpen: (open: boolean) => void;
	setMobileView: (view: "chat" | "notes") => void;
}

export const useWorkspaceLayoutStore = create<WorkspaceLayoutState>(
	(set, get) => ({
		workspaceId: null,
		selectedNodeId: null,
		sidebarOpen: true,
		panelSizes: [50, 50],
		notesVisible: true,
		editMode: false,
		contextModalOpen: false,
		mobileView: "chat",

		initLayout: (workspaceId: string) => {
			const layout = getLayout(workspaceId);
			set({
				workspaceId,
				selectedNodeId: layout.selectedNodeId,
				sidebarOpen: layout.sidebarOpen,
				panelSizes: layout.panelSizes,
				notesVisible: layout.notesVisible,
				editMode: layout.editMode,
			});
		},

		setSelectedNodeId: (nodeId: string | null) => {
			const { workspaceId } = get();
			set({ selectedNodeId: nodeId });
			if (workspaceId) {
				setLayout(workspaceId, { selectedNodeId: nodeId });
			}
		},

		setSidebarOpen: (open: boolean) => {
			const { workspaceId } = get();
			set({ sidebarOpen: open });
			if (workspaceId) {
				setLayout(workspaceId, { sidebarOpen: open });
			}
		},

		setPanelSizes: (sizes: number[]) => {
			const { workspaceId } = get();
			set({ panelSizes: sizes });
			if (workspaceId) {
				setLayout(workspaceId, { panelSizes: sizes });
			}
		},

		setNotesVisible: (visible: boolean) => {
			const { workspaceId } = get();
			set({ notesVisible: visible });
			if (workspaceId) {
				setLayout(workspaceId, { notesVisible: visible });
			}
		},

		setEditMode: (enabled: boolean) => {
			const { workspaceId } = get();
			set({ editMode: enabled });
			if (workspaceId) {
				setLayout(workspaceId, { editMode: enabled });
			}
		},

		setContextModalOpen: (open: boolean) => {
			set({ contextModalOpen: open });
		},

		setMobileView: (view: "chat" | "notes") => {
			set({ mobileView: view });
		},
	})
);
