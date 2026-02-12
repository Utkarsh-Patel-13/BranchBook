import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { mergeRegister } from "@lexical/utils";
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
	ItalicIcon,
	StrikethroughIcon,
	UnderlineIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface FormatState {
	isBold: boolean;
	isItalic: boolean;
	isUnderline: boolean;
	isStrikethrough: boolean;
	isCode: boolean;
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

	const { isBold, isItalic, isUnderline, isStrikethrough, isCode } =
		formatState;

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
			<div className="mx-0.5 h-4 w-px shrink-0 bg-border" />
			<FloatButton
				active={isCode}
				label="Inline code"
				onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "code")}
			>
				<CodeIcon className="size-3.5" />
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
		setSelectionRect(rect);
		setFormatState({
			isBold: selection.hasFormat("bold"),
			isItalic: selection.hasFormat("italic"),
			isUnderline: selection.hasFormat("underline"),
			isStrikethrough: selection.hasFormat("strikethrough"),
			isCode: selection.hasFormat("code"),
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
