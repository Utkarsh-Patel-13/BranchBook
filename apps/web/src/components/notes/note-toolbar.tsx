import {
	$isListNode,
	INSERT_ORDERED_LIST_COMMAND,
	INSERT_UNORDERED_LIST_COMMAND,
	REMOVE_LIST_COMMAND,
} from "@lexical/list";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
	$createHeadingNode,
	$createQuoteNode,
	$isHeadingNode,
	$isQuoteNode,
} from "@lexical/rich-text";
import { mergeRegister } from "@lexical/utils";
import {
	$createParagraphNode,
	$getSelection,
	$isRangeSelection,
	CAN_REDO_COMMAND,
	CAN_UNDO_COMMAND,
	COMMAND_PRIORITY_CRITICAL,
	FORMAT_TEXT_COMMAND,
	REDO_COMMAND,
	UNDO_COMMAND,
} from "lexical";
import {
	BoldIcon,
	CodeIcon,
	ItalicIcon,
	ListIcon,
	ListOrderedIcon,
	QuoteIcon,
	Redo2Icon,
	UnderlineIcon,
	Undo2Icon,
} from "lucide-react";
import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";

type BlockType =
	| "paragraph"
	| "h1"
	| "h2"
	| "h3"
	| "quote"
	| "bullet"
	| "number";

function Separator() {
	return <div className="mx-0.5 h-4 w-px shrink-0 bg-border" />;
}

interface ToolbarButtonProps {
	active?: boolean;
	disabled?: boolean;
	label: string;
	onClick: () => void;
	children: ReactNode;
}

function ToolbarButton({
	active,
	disabled,
	label,
	onClick,
	children,
}: ToolbarButtonProps) {
	return (
		<button
			aria-label={label}
			aria-pressed={active}
			className={`flex h-7 min-w-7 items-center justify-center rounded px-1.5 text-xs transition-colors disabled:pointer-events-none disabled:opacity-40 ${
				active
					? "bg-accent text-accent-foreground"
					: "text-muted-foreground hover:bg-muted hover:text-foreground"
			}`}
			disabled={disabled}
			onClick={onClick}
			type="button"
		>
			{children}
		</button>
	);
}

function readSelectionState(
	setIsBold: (v: boolean) => void,
	setIsItalic: (v: boolean) => void,
	setIsUnderline: (v: boolean) => void,
	setIsCode: (v: boolean) => void,
	setBlockType: (v: BlockType) => void
) {
	const selection = $getSelection();
	if (!$isRangeSelection(selection)) {
		return;
	}
	setIsBold(selection.hasFormat("bold"));
	setIsItalic(selection.hasFormat("italic"));
	setIsUnderline(selection.hasFormat("underline"));
	setIsCode(selection.hasFormat("code"));

	const topElement = selection.anchor.getNode().getTopLevelElement();
	if ($isHeadingNode(topElement)) {
		setBlockType(topElement.getTag() as BlockType);
	} else if ($isListNode(topElement)) {
		setBlockType(topElement.getListType() === "bullet" ? "bullet" : "number");
	} else if ($isQuoteNode(topElement)) {
		setBlockType("quote");
	} else {
		setBlockType("paragraph");
	}
}

function createBlockNode(type: Exclude<BlockType, "bullet" | "number">) {
	if (type === "h1" || type === "h2" || type === "h3") {
		return $createHeadingNode(type);
	}
	if (type === "quote") {
		return $createQuoteNode();
	}
	return $createParagraphNode();
}

export function NoteToolbar() {
	const [editor] = useLexicalComposerContext();
	const [canUndo, setCanUndo] = useState(false);
	const [canRedo, setCanRedo] = useState(false);
	const [isBold, setIsBold] = useState(false);
	const [isItalic, setIsItalic] = useState(false);
	const [isUnderline, setIsUnderline] = useState(false);
	const [isCode, setIsCode] = useState(false);
	const [blockType, setBlockType] = useState<BlockType>("paragraph");

	useEffect(() => {
		return mergeRegister(
			editor.registerCommand(
				CAN_UNDO_COMMAND,
				(payload) => {
					setCanUndo(payload);
					return false;
				},
				COMMAND_PRIORITY_CRITICAL
			),
			editor.registerCommand(
				CAN_REDO_COMMAND,
				(payload) => {
					setCanRedo(payload);
					return false;
				},
				COMMAND_PRIORITY_CRITICAL
			),
			editor.registerUpdateListener(({ editorState }) => {
				editorState.read(() =>
					readSelectionState(
						setIsBold,
						setIsItalic,
						setIsUnderline,
						setIsCode,
						setBlockType
					)
				);
			})
		);
	}, [editor]);

	const applyBlockType = useCallback(
		(type: Exclude<BlockType, "bullet" | "number">) => {
			editor.update(() => {
				const selection = $getSelection();
				if (!$isRangeSelection(selection)) {
					return;
				}

				const anchorNode = selection.anchor.getNode();
				const topElement = anchorNode.getTopLevelElementOrThrow();

				const newNode = createBlockNode(type);

				for (const child of topElement.getChildren()) {
					newNode.append(child);
				}
				topElement.replace(newNode);
			});
		},
		[editor]
	);

	const formatBlock = useCallback(
		(type: BlockType) => {
			if (type === "bullet") {
				if (blockType === "bullet") {
					editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
				} else {
					editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
				}
			} else if (type === "number") {
				if (blockType === "number") {
					editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
				} else {
					editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
				}
			} else {
				applyBlockType(blockType === type ? "paragraph" : type);
			}
		},
		[editor, blockType, applyBlockType]
	);

	return (
		<div className="flex shrink-0 flex-wrap items-center gap-0.5 border-b bg-background px-2 py-1">
			<ToolbarButton
				disabled={!canUndo}
				label="Undo"
				onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
			>
				<Undo2Icon className="size-3.5" />
			</ToolbarButton>
			<ToolbarButton
				disabled={!canRedo}
				label="Redo"
				onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
			>
				<Redo2Icon className="size-3.5" />
			</ToolbarButton>

			<Separator />

			<ToolbarButton
				active={isBold}
				label="Bold"
				onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")}
			>
				<BoldIcon className="size-3.5" />
			</ToolbarButton>
			<ToolbarButton
				active={isItalic}
				label="Italic"
				onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")}
			>
				<ItalicIcon className="size-3.5" />
			</ToolbarButton>
			<ToolbarButton
				active={isUnderline}
				label="Underline"
				onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline")}
			>
				<UnderlineIcon className="size-3.5" />
			</ToolbarButton>
			<ToolbarButton
				active={isCode}
				label="Inline code"
				onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "code")}
			>
				<CodeIcon className="size-3.5" />
			</ToolbarButton>

			<Separator />

			<ToolbarButton
				active={blockType === "h1"}
				label="Heading 1"
				onClick={() => formatBlock("h1")}
			>
				<span className="font-bold text-[11px] leading-none">H1</span>
			</ToolbarButton>
			<ToolbarButton
				active={blockType === "h2"}
				label="Heading 2"
				onClick={() => formatBlock("h2")}
			>
				<span className="font-bold text-[11px] leading-none">H2</span>
			</ToolbarButton>
			<ToolbarButton
				active={blockType === "h3"}
				label="Heading 3"
				onClick={() => formatBlock("h3")}
			>
				<span className="font-bold text-[11px] leading-none">H3</span>
			</ToolbarButton>
			<ToolbarButton
				active={blockType === "quote"}
				label="Blockquote"
				onClick={() => formatBlock("quote")}
			>
				<QuoteIcon className="size-3.5" />
			</ToolbarButton>

			<Separator />

			<ToolbarButton
				active={blockType === "bullet"}
				label="Bullet list"
				onClick={() => formatBlock("bullet")}
			>
				<ListIcon className="size-3.5" />
			</ToolbarButton>
			<ToolbarButton
				active={blockType === "number"}
				label="Numbered list"
				onClick={() => formatBlock("number")}
			>
				<ListOrderedIcon className="size-3.5" />
			</ToolbarButton>
		</div>
	);
}
