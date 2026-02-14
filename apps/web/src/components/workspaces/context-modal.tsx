import { ContextPanel } from "@/components/context/ContextPanel";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { useContextForPanel } from "@/hooks/use-nodes";
import { useWorkspaceLayoutStore } from "@/stores/workspace-layout-store";

interface ContextModalProps {
	nodeId: string | null;
}

export function ContextModal({ nodeId }: ContextModalProps) {
	// Don't render if no nodeId
	if (!nodeId) {
		return null;
	}

	return <ContextModalContent nodeId={nodeId} />;
}

function ContextModalContent({ nodeId }: { nodeId: string }) {
	const { contextModalOpen, setContextModalOpen } = useWorkspaceLayoutStore();
	const { data: contextData } = useContextForPanel(nodeId);

	return (
		<Dialog onOpenChange={setContextModalOpen} open={contextModalOpen}>
			<DialogContent className="max-h-[80vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Inherited Context</DialogTitle>
				</DialogHeader>
				{contextData ? (
					<ContextPanel data={contextData} />
				) : (
					<div className="p-4 text-center text-muted-foreground text-sm">
						Loading context...
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}
