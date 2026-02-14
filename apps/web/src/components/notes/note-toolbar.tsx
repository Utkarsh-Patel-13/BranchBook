import {
	$isListNode,
	INSERT_CHECK_LIST_COMMAND,
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
import {
	$getSelectionStyleValueForProperty,
	$patchStyleText,
} from "@lexical/selection";
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
	CheckSquareIcon,
	CodeIcon,
	HighlighterIcon,
	ItalicIcon,
	ListIcon,
	ListOrderedIcon,
	MinusIcon,
	PlusIcon,
	QuoteIcon,
	Redo2Icon,
	StrikethroughIcon,
	UnderlineIcon,
	Undo2Icon,
} from "lucide-react";
import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

type BlockType =
	| "paragraph"
	| "h1"
	| "h2"
	| "h3"
	| "quote"
	| "bullet"
	| "number"
	| "check";

const FONT_FAMILIES = [
	{ label: "Default", value: "" },
	{ label: "Sans", value: "'Inter Variable', sans-serif" },
	{ label: "Serif", value: "Lora, serif" },
	{ label: "Mono", value: "ui-monospace, monospace" },
] as const;

const HIGHLIGHT_COLORS = [
	{ label: "Remove highlight", value: "" },
	{ label: "Yellow", value: "rgba(255, 212, 0, 0.45)" },
	{ label: "Green", value: "rgba(77, 201, 77, 0.45)" },
	{ label: "Blue", value: "rgba(77, 148, 255, 0.45)" },
	{ label: "Pink", value: "rgba(255, 105, 180, 0.45)" },
	{ label: "Orange", value: "rgba(255, 165, 0, 0.45)" },
] as const;

const FONT_SIZE_PRESETS = [
	"8",
	"10",
	"12",
	"14",
	"16",
	"18",
	"20",
	"24",
	"28",
	"32",
	"36",
	"48",
	"72",
];

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
			onMouseDown={(e) => e.preventDefault()}
			type="button"
		>
			{children}
		</button>
	);
}

function createBlockNode(
	type: Exclude<BlockType, "bullet" | "number" | "check">
) {
	if (type === "h1" || type === "h2" || type === "h3") {
		return $createHeadingNode(type);
	}
	if (type === "quote") {
		return $createQuoteNode();
	}
	return $createParagraphNode();
}

function readBlockType(setBlockType: (v: BlockType) => void) {
	const selection = $getSelection();
	if (!$isRangeSelection(selection)) {
		return;
	}
	const topElement = selection.anchor.getNode().getTopLevelElement();
	if ($isHeadingNode(topElement)) {
		setBlockType(topElement.getTag() as BlockType);
	} else if ($isListNode(topElement)) {
		const listType = topElement.getListType();
		if (listType === "bullet") {
			setBlockType("bullet");
		} else if (listType === "number") {
			setBlockType("number");
		} else {
			setBlockType("check");
		}
	} else if ($isQuoteNode(topElement)) {
		setBlockType("quote");
	} else {
		setBlockType("paragraph");
	}
}

interface FontSizeControlProps {
	value: string;
	onDecrement: () => void;
	onIncrement: () => void;
	onCommit: (size: string) => void;
}

function FontSizeControl({
	value,
	onDecrement,
	onIncrement,
	onCommit,
}: FontSizeControlProps) {
	const numericStr = value.replace("px", "") || "16";
	const [local, setLocal] = useState(numericStr);
	const isFocusedRef = useRef(false);

	useEffect(() => {
		if (!isFocusedRef.current) {
			setLocal(numericStr);
		}
	}, [numericStr]);

	const handleCommit = () => {
		const v = Number.parseInt(local, 10);
		if (!Number.isNaN(v) && v >= 6 && v <= 144) {
			onCommit(`${v}px`);
		} else {
			setLocal(numericStr);
		}
	};

	return (
		<div className="flex items-center">
			<button
				aria-label="Decrease font size"
				className="flex h-7 w-5 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
				onClick={onDecrement}
				onMouseDown={(e) => e.preventDefault()}
				type="button"
			>
				<MinusIcon className="size-2.5" />
			</button>
			<input
				aria-label="Font size"
				className="h-7 w-9 rounded bg-transparent text-center text-muted-foreground text-xs outline-none [appearance:textfield] hover:bg-muted focus:bg-muted [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
				list="toolbar-font-size-list"
				max={144}
				min={6}
				onBlur={() => {
					isFocusedRef.current = false;
					handleCommit();
				}}
				onChange={(e) => setLocal(e.target.value)}
				onFocus={() => {
					isFocusedRef.current = true;
				}}
				onKeyDown={(e) => {
					if (e.key === "Enter") {
						handleCommit();
					}
				}}
				type="number"
				value={local}
			/>
			<datalist id="toolbar-font-size-list">
				{FONT_SIZE_PRESETS.map((s) => (
					<option key={s} value={s} />
				))}
			</datalist>
			<button
				aria-label="Increase font size"
				className="flex h-7 w-5 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
				onClick={onIncrement}
				onMouseDown={(e) => e.preventDefault()}
				type="button"
			>
				<PlusIcon className="size-2.5" />
			</button>
		</div>
	);
}

interface HighlightPickerProps {
	value: string;
	onChange: (color: string) => void;
}

function HighlightPicker({ value, onChange }: HighlightPickerProps) {
	return (
		<div className="flex items-center gap-0.5">
			<HighlighterIcon className="mr-0.5 size-3 shrink-0 text-muted-foreground" />
			{HIGHLIGHT_COLORS.map((c) => (
				<button
					aria-label={c.label}
					aria-pressed={value === c.value}
					className={`flex size-4 items-center justify-center rounded-sm border transition-transform hover:scale-110 ${
						value === c.value
							? "ring-1 ring-ring ring-offset-1"
							: "border-border/50"
					}`}
					key={c.value || "none"}
					onClick={() => onChange(value === c.value ? "" : c.value)}
					onMouseDown={(e) => e.preventDefault()}
					style={
						c.value
							? { backgroundColor: c.value }
							: { backgroundColor: "transparent" }
					}
					type="button"
				>
					{!c.value && (
						<span className="text-[8px] text-muted-foreground leading-none">
							✕
						</span>
					)}
				</button>
			))}
		</div>
	);
}

export function NoteToolbar() {
	const [editor] = useLexicalComposerContext();
	const [canUndo, setCanUndo] = useState(false);
	const [canRedo, setCanRedo] = useState(false);
	const [blockType, setBlockType] = useState<BlockType>("paragraph");
	const [isBold, setIsBold] = useState(false);
	const [isItalic, setIsItalic] = useState(false);
	const [isUnderline, setIsUnderline] = useState(false);
	const [isStrikethrough, setIsStrikethrough] = useState(false);
	const [isCode, setIsCode] = useState(false);
	const [fontFamily, setFontFamily] = useState("");
	const [fontSize, setFontSize] = useState("16px");
	const [highlightColor, setHighlightColor] = useState("");

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
				editorState.read(() => {
					readBlockType(setBlockType);
					const sel = $getSelection();
					if ($isRangeSelection(sel)) {
						setIsBold(sel.hasFormat("bold"));
						setIsItalic(sel.hasFormat("italic"));
						setIsUnderline(sel.hasFormat("underline"));
						setIsStrikethrough(sel.hasFormat("strikethrough"));
						setIsCode(sel.hasFormat("code"));
						setFontFamily(
							$getSelectionStyleValueForProperty(sel, "font-family", "")
						);
						setFontSize(
							$getSelectionStyleValueForProperty(sel, "font-size", "16px")
						);
						setHighlightColor(
							$getSelectionStyleValueForProperty(sel, "background-color", "")
						);
					}
				});
			})
		);
	}, [editor]);

	const applyBlockType = useCallback(
		(type: Exclude<BlockType, "bullet" | "number" | "check">) => {
			editor.update(() => {
				const selection = $getSelection();
				if (!$isRangeSelection(selection)) {
					return;
				}
				const topElement = selection.anchor
					.getNode()
					.getTopLevelElementOrThrow();
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
				editor.dispatchCommand(
					blockType === "bullet"
						? REMOVE_LIST_COMMAND
						: INSERT_UNORDERED_LIST_COMMAND,
					undefined
				);
			} else if (type === "number") {
				editor.dispatchCommand(
					blockType === "number"
						? REMOVE_LIST_COMMAND
						: INSERT_ORDERED_LIST_COMMAND,
					undefined
				);
			} else if (type === "check") {
				editor.dispatchCommand(
					blockType === "check"
						? REMOVE_LIST_COMMAND
						: INSERT_CHECK_LIST_COMMAND,
					undefined
				);
			} else {
				applyBlockType(blockType === type ? "paragraph" : type);
			}
		},
		[editor, blockType, applyBlockType]
	);

	const applyStyle = useCallback(
		(styles: Record<string, string>) => {
			editor.update(() => {
				const selection = $getSelection();
				if ($isRangeSelection(selection)) {
					$patchStyleText(selection, styles);
				}
			});
		},
		[editor]
	);

	const applyFontSize = useCallback(
		(size: string) => applyStyle({ "font-size": size }),
		[applyStyle]
	);

	const adjustFontSize = useCallback(
		(delta: number) => {
			const current = Number.parseInt(fontSize, 10) || 16;
			const next = Math.min(144, Math.max(6, current + delta));
			applyFontSize(`${next}px`);
		},
		[fontSize, applyFontSize]
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

			<select
				aria-label="Font family"
				className="h-7 cursor-pointer rounded bg-transparent px-1.5 text-muted-foreground text-xs outline-none hover:bg-muted hover:text-foreground focus:bg-muted"
				onChange={(e) => applyStyle({ "font-family": e.target.value })}
				value={fontFamily}
			>
				{FONT_FAMILIES.map((f) => (
					<option key={f.value} value={f.value}>
						{f.label}
					</option>
				))}
			</select>

			<FontSizeControl
				onCommit={applyFontSize}
				onDecrement={() => adjustFontSize(-1)}
				onIncrement={() => adjustFontSize(1)}
				value={fontSize}
			/>

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
				active={isStrikethrough}
				label="Strikethrough"
				onClick={() =>
					editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough")
				}
			>
				<StrikethroughIcon className="size-3.5" />
			</ToolbarButton>
			<ToolbarButton
				active={isCode}
				label="Inline code"
				onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "code")}
			>
				<CodeIcon className="size-3.5" />
			</ToolbarButton>

			<Separator />

			<HighlightPicker
				onChange={(color) => applyStyle({ "background-color": color })}
				value={highlightColor}
			/>

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
			<ToolbarButton
				active={blockType === "check"}
				label="Checklist"
				onClick={() => formatBlock("check")}
			>
				<CheckSquareIcon className="size-3.5" />
			</ToolbarButton>
		</div>
	);
}
