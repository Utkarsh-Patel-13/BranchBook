import { create } from "zustand";

export type InteractionMode = "select" | "pan";

interface CanvasState {
	selectedNodeIds: Set<string>;
	viewport: {
		x: number;
		y: number;
		zoom: number;
	};
	collapsedNodeIds: Set<string>;
	interactionMode: InteractionMode;
	expandedNodeIds: Set<string>;
	sidePanelNodeId: string | null;

	// Actions
	setSelectedNodeIds: (ids: Set<string>) => void;
	toggleNodeSelection: (id: string) => void;
	clearSelection: () => void;
	setViewport: (viewport: { x: number; y: number; zoom: number }) => void;
	toggleCollapsed: (id: string) => void;
	setInteractionMode: (mode: InteractionMode) => void;
	toggleExpandedNode: (id: string) => void;
	setSidePanelNodeId: (id: string | null) => void;
}

export const useCanvasStore = create<CanvasState>((set) => ({
	selectedNodeIds: new Set(),
	viewport: { x: 0, y: 0, zoom: 1 },
	collapsedNodeIds: new Set(),
	interactionMode: "select",
	expandedNodeIds: new Set(),
	sidePanelNodeId: null,

	setSelectedNodeIds: (ids) => set({ selectedNodeIds: ids }),
	toggleNodeSelection: (id) =>
		set((state) => {
			const newSelection = new Set(state.selectedNodeIds);
			if (newSelection.has(id)) {
				newSelection.delete(id);
			} else {
				newSelection.add(id);
			}
			return { selectedNodeIds: newSelection };
		}),
	clearSelection: () => set({ selectedNodeIds: new Set() }),
	setViewport: (viewport) => set({ viewport }),
	toggleCollapsed: (id) =>
		set((state) => {
			const newCollapsed = new Set(state.collapsedNodeIds);
			if (newCollapsed.has(id)) {
				newCollapsed.delete(id);
			} else {
				newCollapsed.add(id);
			}
			return { collapsedNodeIds: newCollapsed };
		}),
	setInteractionMode: (mode) => set({ interactionMode: mode }),
	toggleExpandedNode: (id) =>
		set((state) => {
			const newExpanded = new Set(state.expandedNodeIds);
			if (newExpanded.has(id)) {
				newExpanded.delete(id);
				// Close side panel if it was showing this node
				return {
					expandedNodeIds: newExpanded,
					sidePanelNodeId:
						state.sidePanelNodeId === id ? null : state.sidePanelNodeId,
				};
			}
			newExpanded.add(id);
			return { expandedNodeIds: newExpanded };
		}),
	setSidePanelNodeId: (id) => set({ sidePanelNodeId: id }),
}));
