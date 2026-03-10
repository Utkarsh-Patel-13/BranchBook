import type { NodeTree } from "@branchbook/types";
import { useRouter } from "@tanstack/react-router";
import {
	CheckIcon,
	ChevronDownIcon,
	CopyIcon,
	FileTextIcon,
	GitBranchIcon,
	Volume2Icon,
	VolumeXIcon,
} from "lucide-react";
import { parse } from "marked";
import { memo, useCallback, useEffect, useState } from "react";
import { MessageAction } from "@/components/ai-elements/message";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreateNodeDialog } from "@/components/workspaces/nodes/create-node-dialog";
import { useNote, useUpsertNote } from "@/hooks/use-note";
import { buildNodePath } from "@/lib/workspace-navigation";
import { useWorkspaceLayoutStore } from "@/stores/workspace-layout-store";

async function copyToClipboard(content: string) {
	const htmlBody = (await parse(content, { gfm: true })) as string;
	const htmlDocument = `<meta charset='utf-8'><html><head></head><body>${htmlBody}</body></html>`;

	await navigator.clipboard.write([
		new ClipboardItem({
			"text/plain": new Blob([content], { type: "text/plain" }),
			"text/html": new Blob([htmlDocument], { type: "text/html" }),
		}),
	]);
}

export const CopyAction = memo(({ content }: { content: string }) => {
	const [copied, setCopied] = useState(false);
	const handleClick = useCallback(() => {
		copyToClipboard(content);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	}, [content]);

	return (
		<MessageAction
			label="Copy"
			onClick={handleClick}
			tooltip="Copy to clipboard"
		>
			{copied ? (
				<CheckIcon className="size-3.5" />
			) : (
				<CopyIcon className="size-3.5" />
			)}
		</MessageAction>
	);
});
CopyAction.displayName = "CopyAction";

export function SpeakButton({ content }: { content: string }) {
	const [speaking, setSpeaking] = useState(false);

	const handleSpeak = useCallback(() => {
		if (!("speechSynthesis" in window)) {
			return;
		}
		if (speaking) {
			window.speechSynthesis.cancel();
			setSpeaking(false);
			return;
		}
		const utterance = new SpeechSynthesisUtterance(content);
		utterance.onstart = () => setSpeaking(true);
		utterance.onend = () => setSpeaking(false);
		utterance.onerror = () => setSpeaking(false);
		window.speechSynthesis.speak(utterance);
	}, [content, speaking]);

	useEffect(() => () => window.speechSynthesis.cancel(), []);

	return (
		<MessageAction
			label={speaking ? "Stop speaking" : "Read aloud"}
			onClick={handleSpeak}
			tooltip={speaking ? "Stop" : "Read aloud"}
		>
			{speaking ? (
				<VolumeXIcon className="size-3.5" />
			) : (
				<Volume2Icon className="size-3.5" />
			)}
		</MessageAction>
	);
}

async function convertToHtmlBody(content: string): Promise<string> {
	return (await parse(content, { gfm: true })) as string;
}

export const ConvertToNoteAction = memo(
	({ content, nodeId }: { content: string; nodeId: string }) => {
		const { data: note } = useNote(nodeId);
		const { mutate: upsert } = useUpsertNote(nodeId);
		const [added, setAdded] = useState(false);

		const handleClick = useCallback(async () => {
			const htmlContent = await convertToHtmlBody(content);
			const currentContent = note?.content ?? "";
			upsert(
				{ nodeId, content: currentContent + htmlContent },
				{
					onSuccess: () => {
						setAdded(true);
						setTimeout(() => setAdded(false), 2000);
					},
				}
			);
		}, [content, nodeId, note?.content, upsert]);

		return (
			<MessageAction
				className="flex w-full flex-row items-center gap-1 p-2"
				label="Add to Note"
				onClick={handleClick}
				tooltip="Add to Note"
			>
				{added ? (
					<CheckIcon className="size-3.5" />
				) : (
					<FileTextIcon className="size-3.5" />
				)}
				<span className="text-xs">{added ? "Added" : "Add to Note"}</span>
			</MessageAction>
		);
	}
);
ConvertToNoteAction.displayName = "ConvertToNoteAction";

export const BranchAction = memo(
	({
		messageId,
		nodeId,
		workspaceId,
	}: {
		messageId: string;
		nodeId: string;
		workspaceId: string;
	}) => {
		const [branchDialogOpen, setBranchDialogOpen] = useState(false);
		const setSelectedNodeId = useWorkspaceLayoutStore(
			(s) => s.setSelectedNodeId
		);

		const handleBranchCreated = useCallback(
			(node: { id: string }) => setSelectedNodeId(node.id),
			[setSelectedNodeId]
		);

		return (
			<>
				<MessageAction
					className="flex w-full flex-row items-center gap-1 p-2"
					label="Branch from here"
					onClick={() => setBranchDialogOpen(true)}
					tooltip="Branch from here"
				>
					<GitBranchIcon className="size-3.5" />
					<span className="text-xs">Branch</span>
				</MessageAction>
				<CreateNodeDialog
					branch={{ messageId, nodeId }}
					onBranchCreated={handleBranchCreated}
					onOpenChange={setBranchDialogOpen}
					open={branchDialogOpen}
					workspaceId={workspaceId}
				/>
			</>
		);
	}
);
BranchAction.displayName = "BranchAction";

export const BranchesDropdown = memo(
	({
		branches,
		workspaceId,
		tree,
	}: {
		branches: { id: string; title: string }[];
		workspaceId: string;
		tree: NodeTree[];
	}) => {
		const router = useRouter();

		if (branches.length === 0) {
			return null;
		}

		const handleSelectBranch = (branchId: string) => {
			const path = buildNodePath(tree, branchId);
			if (path) {
				router.navigate({
					to: `/workspaces/${workspaceId}/${path.join("/")}` as never,
				});
			}
		};

		return (
			<DropdownMenu>
				<DropdownMenuTrigger
					render={
						<Button
							aria-label={`${branches.length} branch${branches.length === 1 ? "" : "es"} from this message`}
							className="flex flex-row items-center gap-1 p-2"
							size="icon-sm"
							title={`${branches.length} branch${branches.length === 1 ? "" : "es"} from this message`}
							variant="ghost"
						>
							<ChevronDownIcon className="size-3.5" />
						</Button>
					}
				/>
				<DropdownMenuContent align="end">
					<DropdownMenuItem disabled>Branches</DropdownMenuItem>
					{branches.map((branch) => (
						<DropdownMenuItem
							key={branch.id}
							onClick={() => handleSelectBranch(branch.id)}
						>
							{branch.title}
						</DropdownMenuItem>
					))}
				</DropdownMenuContent>
			</DropdownMenu>
		);
	}
);
BranchesDropdown.displayName = "BranchesDropdown";
