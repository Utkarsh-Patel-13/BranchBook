import { $isLinkNode, TOGGLE_LINK_COMMAND } from "@lexical/link";
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
import {
	$createTableNodeWithDimensions,
	$insertTableColumnAtSelection,
	$insertTableRowAtSelection,
	$isTableCellNode,
} from "@lexical/table";
import { $findMatchingParent, mergeRegister } from "@lexical/utils";
import type { ElementFormatType } from "lexical";
import {
	$createParagraphNode,
	$getSelection,
	$isElementNode,
	$isRangeSelection,
	CAN_REDO_COMMAND,
	CAN_UNDO_COMMAND,
	COMMAND_PRIORITY_CRITICAL,
	FORMAT_ELEMENT_COMMAND,
	FORMAT_TEXT_COMMAND,
	REDO_COMMAND,
	UNDO_COMMAND,
} from "lexical";
import {
	BoldIcon,
	CheckSquareIcon,
	CodeIcon,
	Columns2Icon,
	HighlighterIcon,
	ItalicIcon,
	LinkIcon,
	ListIcon,
	ListOrderedIcon,
	MinusIcon,
	PlusIcon,
	QuoteIcon,
	Redo2Icon,
	Rows2Icon,
	StrikethroughIcon,
	TableIcon,
	UnderlineIcon,
	Undo2Icon,
} from "lucide-react";
import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

type BlockType =
	| "paragraph"
	| "h1"
	| "h2"
	| "h3"
	| "quote"
	| "bullet"
	| "number"
	| "check";

const ALIGNMENTS: { format: ElementFormatType; label: string }[] = [
	{ format: "left", label: "Left" },
	{ format: "center", label: "Center" },
	{ format: "right", label: "Right" },
	{ format: "justify", label: "Justify" },
];

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

const VALID_ELEMENT_FORMATS: ElementFormatType[] = [
	"left",
	"center",
	"right",
	"justify",
];

function syncFormatStateFromSelection(
	setIsBold: (v: boolean) => void,
	setIsItalic: (v: boolean) => void,
	setIsUnderline: (v: boolean) => void,
	setIsStrikethrough: (v: boolean) => void,
	setIsCode: (v: boolean) => void,
	setFontFamily: (v: string) => void,
	setFontSize: (v: string) => void,
	setHighlightColor: (v: string) => void,
	setElementFormat: (v: ElementFormatType) => void,
	setIsLink: (v: boolean) => void,
	setLinkUrl: (v: string) => void
) {
	const sel = $getSelection();
	if (!$isRangeSelection(sel)) {
		return;
	}
	setIsBold(sel.hasFormat("bold"));
	setIsItalic(sel.hasFormat("italic"));
	setIsUnderline(sel.hasFormat("underline"));
	setIsStrikethrough(sel.hasFormat("strikethrough"));
	setIsCode(sel.hasFormat("code"));
	setFontFamily($getSelectionStyleValueForProperty(sel, "font-family", ""));
	setFontSize($getSelectionStyleValueForProperty(sel, "font-size", "16px"));
	setHighlightColor(
		$getSelectionStyleValueForProperty(sel, "background-color", "")
	);
	const anchorNode = sel.anchor.getNode();
	const topElement = anchorNode.getTopLevelElement();
	if (topElement && "getFormat" in topElement) {
		const format = (topElement as { getFormat: () => unknown }).getFormat();
		if (
			typeof format === "string" &&
			(VALID_ELEMENT_FORMATS as readonly string[]).includes(format)
		) {
			setElementFormat(format as ElementFormatType);
		} else if (!format) {
			setElementFormat("left");
		}
	}
	const linkParent = $findMatchingParent(anchorNode, $isLinkNode);
	setIsLink(linkParent !== null);
	setLinkUrl(linkParent?.getURL() ?? "");
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
	const [elementFormat, setElementFormat] = useState<ElementFormatType>("left");
	const [isLink, setIsLink] = useState(false);
	const [linkUrl, setLinkUrl] = useState("");
	const [linkMenuOpen, setLinkMenuOpen] = useState(false);
	const [isInTable, setIsInTable] = useState(false);
	const linkInputRef = useRef<HTMLInputElement>(null);
	const linkPanelRef = useRef<HTMLDivElement>(null);

	// Focus input when link panel opens
	useEffect(() => {
		if (linkMenuOpen) {
			setTimeout(() => linkInputRef.current?.focus(), 0);
		}
	}, [linkMenuOpen]);

	// Close link panel on outside click
	useEffect(() => {
		if (!linkMenuOpen) {
			return;
		}
		const handler = (e: MouseEvent) => {
			if (
				linkPanelRef.current &&
				!linkPanelRef.current.contains(e.target as Node)
			) {
				setLinkMenuOpen(false);
			}
		};
		document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, [linkMenuOpen]);

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
					const inTable =
						$isRangeSelection(sel) &&
						$findMatchingParent(sel.anchor.getNode(), $isTableCellNode) !==
							null;
					setIsInTable(inTable);
					syncFormatStateFromSelection(
						setIsBold,
						setIsItalic,
						setIsUnderline,
						setIsStrikethrough,
						setIsCode,
						setFontFamily,
						setFontSize,
						setHighlightColor,
						setElementFormat,
						setIsLink,
						setLinkUrl
					);
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
			{/* Undo / Redo */}
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

			{/* Text format: bold, italic, underline, strikethrough, code */}
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

			{/* Link */}
			<div className="relative" ref={linkPanelRef}>
				<ToolbarButton
					active={isLink || linkMenuOpen}
					label="Insert or edit link"
					onClick={() => setLinkMenuOpen((prev) => !prev)}
				>
					<LinkIcon className="size-3.5" />
				</ToolbarButton>
				{linkMenuOpen && (
					<div className="absolute top-full left-0 z-50 mt-1 flex min-w-64 flex-col gap-2 rounded-lg border bg-popover p-2 shadow-lg">
						<span className="font-medium text-muted-foreground text-xs">
							Link URL
						</span>
						<Input
							onChange={(e) => setLinkUrl(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									e.preventDefault();
									if (linkUrl.trim()) {
										editor.dispatchCommand(TOGGLE_LINK_COMMAND, linkUrl.trim());
										setLinkMenuOpen(false);
									}
								}
								if (e.key === "Escape") {
									setLinkMenuOpen(false);
								}
							}}
							placeholder="https://..."
							ref={linkInputRef}
							value={linkUrl}
						/>
						<div className="flex gap-1">
							<button
								className="flex flex-1 items-center justify-center rounded-md border px-2 py-1.5 font-medium text-xs transition-colors hover:bg-muted"
								onClick={() => {
									if (linkUrl.trim()) {
										editor.dispatchCommand(TOGGLE_LINK_COMMAND, linkUrl.trim());
										setLinkMenuOpen(false);
									}
								}}
								type="button"
							>
								Apply
							</button>
							<button
								className="flex flex-1 items-center justify-center rounded-md border px-2 py-1.5 font-medium text-xs transition-colors hover:bg-muted"
								onClick={() => {
									editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
									setLinkMenuOpen(false);
								}}
								type="button"
							>
								Remove link
							</button>
						</div>
					</div>
				)}
			</div>
			<Separator />

			{/* Font family & size */}
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

			{/* Highlight */}
			<HighlightPicker
				onChange={(color) => applyStyle({ "background-color": color })}
				value={highlightColor}
			/>
			<Separator />

			{/* Block types: headings, quote */}
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

			{/* Lists */}
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
			<ToolbarButton
				label="Insert table"
				onClick={() => {
					editor.update(() => {
						const selection = $getSelection();
						if (!$isRangeSelection(selection)) {
							return;
						}
						const tableNode = $createTableNodeWithDimensions(3, 3, true);
						selection.insertNodes([tableNode]);
						const firstRow = tableNode.getFirstChild();
						if (firstRow && $isElementNode(firstRow)) {
							const firstCell = firstRow.getFirstChild();
							if (firstCell && $isTableCellNode(firstCell)) {
								const paragraph = firstCell.getFirstChild();
								if (paragraph) {
									paragraph.selectStart();
								}
							}
						}
					});
				}}
			>
				<TableIcon className="size-3.5" />
			</ToolbarButton>
			{isInTable && (
				<>
					<DropdownMenu>
						<DropdownMenuTrigger
							aria-label="Insert table row or column"
							className="flex h-7 min-w-7 items-center justify-center rounded px-1.5 text-muted-foreground text-xs transition-colors hover:bg-muted hover:text-foreground"
							onMouseDown={(e) => e.preventDefault()}
						>
							<Rows2Icon className="size-3.5" />
						</DropdownMenuTrigger>
						<DropdownMenuContent align="start">
							<DropdownMenuItem
								onClick={() => {
									editor.update(() => {
										$insertTableRowAtSelection(false);
									});
								}}
								onMouseDown={(e) => e.preventDefault()}
							>
								Insert row above
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() => {
									editor.update(() => {
										$insertTableRowAtSelection(true);
									});
								}}
								onMouseDown={(e) => e.preventDefault()}
							>
								Insert row below
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
					<DropdownMenu>
						<DropdownMenuTrigger
							aria-label="Insert table column"
							className="flex h-7 min-w-7 items-center justify-center rounded px-1.5 text-muted-foreground text-xs transition-colors hover:bg-muted hover:text-foreground"
							onMouseDown={(e) => e.preventDefault()}
						>
							<Columns2Icon className="size-3.5" />
						</DropdownMenuTrigger>
						<DropdownMenuContent align="start">
							<DropdownMenuItem
								onClick={() => {
									editor.update(() => {
										$insertTableColumnAtSelection(false);
									});
								}}
								onMouseDown={(e) => e.preventDefault()}
							>
								Insert column left
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() => {
									editor.update(() => {
										$insertTableColumnAtSelection(true);
									});
								}}
								onMouseDown={(e) => e.preventDefault()}
							>
								Insert column right
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</>
			)}
			<Separator />

			{/* Alignment (dropdown, same pattern as font family) */}
			<select
				aria-label="Alignment"
				className="h-7 cursor-pointer rounded bg-transparent px-1.5 text-muted-foreground text-xs outline-none hover:bg-muted hover:text-foreground focus:bg-muted"
				onChange={(e) =>
					editor.dispatchCommand(
						FORMAT_ELEMENT_COMMAND,
						e.target.value as ElementFormatType
					)
				}
				value={elementFormat || "left"}
			>
				{ALIGNMENTS.map(({ format, label }) => (
					<option key={format} value={format}>
						{label}
					</option>
				))}
			</select>
		</div>
	);
}
