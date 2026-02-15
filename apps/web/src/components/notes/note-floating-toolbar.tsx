import { $isLinkNode, TOGGLE_LINK_COMMAND } from "@lexical/link";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
	$getSelectionStyleValueForProperty,
	$patchStyleText,
} from "@lexical/selection";
import { $findMatchingParent, mergeRegister } from "@lexical/utils";
import {
	$getSelection,
	$isRangeSelection,
	COMMAND_PRIORITY_LOW,
	FORMAT_TEXT_COMMAND,
	SELECTION_CHANGE_COMMAND,
} from "lexical";
import {
	BoldIcon,
	CodeIcon,
	EraserIcon,
	HighlighterIcon,
	ItalicIcon,
	LinkIcon,
	StrikethroughIcon,
	UnderlineIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

const DEFAULT_HIGHLIGHT = "rgba(255, 212, 0, 0.45)";

interface FormatState {
	isBold: boolean;
	isItalic: boolean;
	isUnderline: boolean;
	isStrikethrough: boolean;
	isCode: boolean;
	highlightColor: string;
	isLink: boolean;
	linkUrl: string;
}

interface ButtonProps {
	active?: boolean;
	label: string;
	onClick: () => void;
	children: ReactNode;
}

function FloatButton({ active, label, onClick, children }: ButtonProps) {
	return (
		<button
			aria-label={label}
			aria-pressed={active}
			className={`flex h-7 w-7 items-center justify-center rounded text-xs transition-colors ${
				active
					? "bg-accent text-accent-foreground"
					: "text-popover-foreground hover:bg-muted"
			}`}
			// Prevent the button from stealing focus from the editor
			onClick={onClick}
			onMouseDown={(e) => e.preventDefault()}
			type="button"
		>
			{children}
		</button>
	);
}

interface PopupProps {
	editor: ReturnType<typeof useLexicalComposerContext>[0];
	selectionRect: DOMRect;
	formatState: FormatState;
}

function FloatingPopup({ editor, selectionRect, formatState }: PopupProps) {
	const ref = useRef<HTMLDivElement>(null);
	const [left, setLeft] = useState<number | null>(null);
	const [top, setTop] = useState<number | null>(null);
	const [linkMenuOpen, setLinkMenuOpen] = useState(false);
	const [linkUrl, setLinkUrl] = useState(formatState.linkUrl);

	useEffect(() => {
		setLinkUrl(formatState.linkUrl);
	}, [formatState.linkUrl]);

	// Calculate position after first render so offsetWidth/Height are available
	useEffect(() => {
		const el = ref.current;
		if (!el) {
			return;
		}
		const w = el.offsetWidth;
		const h = el.offsetHeight;
		const GAP = 8;
		const x = Math.max(
			GAP,
			Math.min(
				selectionRect.left + selectionRect.width / 2 - w / 2,
				window.innerWidth - w - GAP
			)
		);
		const y = selectionRect.top - h - GAP;
		setLeft(x);
		setTop(Math.max(GAP, y));
	}, [selectionRect]);

	const {
		isBold,
		isItalic,
		isUnderline,
		isStrikethrough,
		isCode,
		highlightColor,
		isLink,
	} = formatState;

	const hasHighlight = Boolean(highlightColor);

	const toggleHighlight = useCallback(() => {
		editor.update(() => {
			const selection = $getSelection();
			if (!$isRangeSelection(selection)) {
				return;
			}
			$patchStyleText(selection, {
				"background-color": hasHighlight ? "" : DEFAULT_HIGHLIGHT,
			});
		});
	}, [editor, hasHighlight]);

	const clearFormatting = useCallback(() => {
		editor.update(() => {
			const selection = $getSelection();
			if (!$isRangeSelection(selection)) {
				return;
			}
			$patchStyleText(selection, { "background-color": "" });
		});
		if (isBold) {
			editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold");
		}
		if (isItalic) {
			editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic");
		}
		if (isUnderline) {
			editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline");
		}
		if (isStrikethrough) {
			editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough");
		}
		if (isCode) {
			editor.dispatchCommand(FORMAT_TEXT_COMMAND, "code");
		}
		editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
	}, [editor, isBold, isItalic, isUnderline, isStrikethrough, isCode]);

	return (
		<div
			className="fixed z-50 flex items-center gap-px rounded-lg border bg-popover px-1 py-1 shadow-lg"
			ref={ref}
			style={
				left !== null && top !== null
					? { left, top, opacity: 1 }
					: { opacity: 0, pointerEvents: "none", left: -9999, top: -9999 }
			}
		>
			<FloatButton
				active={isBold}
				label="Bold"
				onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")}
			>
				<BoldIcon className="size-3.5" />
			</FloatButton>
			<FloatButton
				active={isItalic}
				label="Italic"
				onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")}
			>
				<ItalicIcon className="size-3.5" />
			</FloatButton>
			<FloatButton
				active={isUnderline}
				label="Underline"
				onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline")}
			>
				<UnderlineIcon className="size-3.5" />
			</FloatButton>
			<FloatButton
				active={isStrikethrough}
				label="Strikethrough"
				onClick={() =>
					editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough")
				}
			>
				<StrikethroughIcon className="size-3.5" />
			</FloatButton>
			<FloatButton
				active={isCode}
				label="Inline code"
				onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "code")}
			>
				<CodeIcon className="size-3.5" />
			</FloatButton>
			<div className="mx-0.5 h-4 w-px shrink-0 bg-border" />
			<DropdownMenu onOpenChange={setLinkMenuOpen} open={linkMenuOpen}>
				<DropdownMenuTrigger
					aria-label="Insert or edit link"
					aria-pressed={isLink}
					className={`flex h-7 w-7 items-center justify-center rounded text-xs transition-colors ${
						isLink
							? "bg-accent text-accent-foreground"
							: "text-popover-foreground hover:bg-muted"
					}`}
					onMouseDown={(e: React.MouseEvent) => e.preventDefault()}
				>
					<LinkIcon className="size-3.5" />
				</DropdownMenuTrigger>
				<DropdownMenuContent align="center" className="min-w-56 p-2">
					<DropdownMenuGroup>
						<DropdownMenuLabel>Link URL</DropdownMenuLabel>
						<div className="flex flex-col gap-2 px-1.5 py-1">
							<Input
								onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
									setLinkUrl(e.target.value)
								}
								onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
									if (e.key === "Enter" && linkUrl.trim()) {
										e.preventDefault();
										editor.dispatchCommand(TOGGLE_LINK_COMMAND, linkUrl.trim());
										setLinkMenuOpen(false);
									}
								}}
								placeholder="https://..."
								value={linkUrl}
							/>
							<div className="flex gap-1">
								<button
									className="flex flex-1 items-center justify-center rounded-md border border-input bg-background px-2 py-1.5 font-medium text-xs transition-colors hover:bg-muted"
									onClick={() => {
										if (linkUrl.trim()) {
											editor.dispatchCommand(
												TOGGLE_LINK_COMMAND,
												linkUrl.trim()
											);
											setLinkMenuOpen(false);
										}
									}}
									type="button"
								>
									Apply
								</button>
								<button
									className="flex flex-1 items-center justify-center rounded-md border border-input bg-background px-2 py-1.5 font-medium text-xs transition-colors hover:bg-muted"
									onClick={() => {
										editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
										setLinkMenuOpen(false);
									}}
									type="button"
								>
									Remove
								</button>
							</div>
						</div>
					</DropdownMenuGroup>
				</DropdownMenuContent>
			</DropdownMenu>
			<div className="mx-0.5 h-4 w-px shrink-0 bg-border" />
			<FloatButton
				active={hasHighlight}
				label="Highlight"
				onClick={toggleHighlight}
			>
				<HighlighterIcon className="size-3.5" />
			</FloatButton>
			<div className="mx-0.5 h-4 w-px shrink-0 bg-border" />
			<FloatButton label="Clear formatting" onClick={clearFormatting}>
				<EraserIcon className="size-3.5" />
			</FloatButton>
		</div>
	);
}

export function FloatingTextFormatPlugin() {
	const [editor] = useLexicalComposerContext();
	const [selectionRect, setSelectionRect] = useState<DOMRect | null>(null);
	const [formatState, setFormatState] = useState<FormatState>({
		isBold: false,
		isItalic: false,
		isUnderline: false,
		isStrikethrough: false,
		isCode: false,
		highlightColor: "",
		isLink: false,
		linkUrl: "",
	});

	const updateToolbar = useCallback(() => {
		const selection = $getSelection();
		if (!$isRangeSelection(selection) || selection.isCollapsed()) {
			setSelectionRect(null);
			return;
		}
		const nativeSel = window.getSelection();
		if (!nativeSel || nativeSel.rangeCount === 0) {
			setSelectionRect(null);
			return;
		}
		const rect = nativeSel.getRangeAt(0).getBoundingClientRect();
		if (!rect.width) {
			setSelectionRect(null);
			return;
		}
		const anchorNode = selection.anchor.getNode();
		const linkParent = $findMatchingParent(anchorNode, $isLinkNode);
		setSelectionRect(rect);
		setFormatState({
			isBold: selection.hasFormat("bold"),
			isItalic: selection.hasFormat("italic"),
			isUnderline: selection.hasFormat("underline"),
			isStrikethrough: selection.hasFormat("strikethrough"),
			isCode: selection.hasFormat("code"),
			highlightColor: $getSelectionStyleValueForProperty(
				selection,
				"background-color",
				""
			),
			isLink: linkParent !== null,
			linkUrl: linkParent?.getURL() ?? "",
		});
	}, []);

	useEffect(() => {
		return mergeRegister(
			editor.registerUpdateListener(({ editorState }) => {
				editorState.read(updateToolbar);
			}),
			editor.registerCommand(
				SELECTION_CHANGE_COMMAND,
				() => {
					editor.getEditorState().read(updateToolbar);
					return false;
				},
				COMMAND_PRIORITY_LOW
			)
		);
	}, [editor, updateToolbar]);

	if (!(selectionRect && editor.isEditable())) {
		return null;
	}

	return createPortal(
		<FloatingPopup
			editor={editor}
			formatState={formatState}
			selectionRect={selectionRect}
		/>,
		document.body
	);
}
