import { create } from "zustand";
import { getLayout, setLayout } from "@/lib/workspace-layout-storage";

interface WorkspaceLayoutState {
	workspaceId: string | null;
	selectedNodeId: string | null;
	sidebarOpen: boolean;
	panelSizes: number[];
	initLayout: (workspaceId: string) => void;
	setSelectedNodeId: (nodeId: string | null) => void;
	setSidebarOpen: (open: boolean) => void;
	setPanelSizes: (sizes: number[]) => void;
}

export const useWorkspaceLayoutStore = create<WorkspaceLayoutState>(
	(set, get) => ({
		workspaceId: null,
		selectedNodeId: null,
		sidebarOpen: true,
		panelSizes: [50, 50],

		initLayout: (workspaceId: string) => {
			const layout = getLayout(workspaceId);
			set({
				workspaceId,
				selectedNodeId: layout.selectedNodeId,
				sidebarOpen: layout.sidebarOpen,
				panelSizes: layout.panelSizes,
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
	})
);
