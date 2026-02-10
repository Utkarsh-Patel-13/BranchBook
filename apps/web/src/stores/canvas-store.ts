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

	// Actions
	setSelectedNodeIds: (ids: Set<string>) => void;
	toggleNodeSelection: (id: string) => void;
	clearSelection: () => void;
	setViewport: (viewport: { x: number; y: number; zoom: number }) => void;
	toggleCollapsed: (id: string) => void;
	setInteractionMode: (mode: InteractionMode) => void;
}

export const useCanvasStore = create<CanvasState>((set) => ({
	selectedNodeIds: new Set(),
	viewport: { x: 0, y: 0, zoom: 1 },
	collapsedNodeIds: new Set(),
	interactionMode: "select",

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
}));
