import { env } from "@branchbook/env/web";
import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html";
import { $isLinkNode, TOGGLE_LINK_COMMAND } from "@lexical/link";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
	$getSelectionStyleValueForProperty,
	$patchStyleText,
} from "@lexical/selection";
import { $findMatchingParent, mergeRegister } from "@lexical/utils";
import type { PointType } from "lexical";
import {
	$createRangeSelection,
	$getSelection,
	$isRangeSelection,
	$setSelection,
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
	Loader2Icon,
	PenLineIcon,
	SparklesIcon,
	StrikethroughIcon,
	UnderlineIcon,
} from "lucide-react";
import type { ReactNode, RefObject } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
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

interface StoredSelection {
	anchorKey: string;
	anchorOffset: number;
	anchorType: PointType["type"];
	focusKey: string;
	focusOffset: number;
	focusType: PointType["type"];
}

type ActivePanel = "link" | "rewrite" | null;

interface ButtonProps {
	active?: boolean;
	label: string;
	onClick: () => void;
	children: ReactNode;
	disabled?: boolean;
}

function FloatButton({
	active,
	label,
	onClick,
	children,
	disabled,
}: ButtonProps) {
	return (
		<button
			aria-label={label}
			aria-pressed={active}
			className={`flex h-7 w-7 items-center justify-center rounded text-xs transition-colors disabled:pointer-events-none disabled:opacity-40 ${
				active
					? "bg-accent text-accent-foreground"
					: "text-popover-foreground hover:bg-muted"
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

interface PopupProps {
	editor: ReturnType<typeof useLexicalComposerContext>[0];
	selectionRect: DOMRect;
	formatState: FormatState;
	isAiLoading: boolean;
	activePanel: ActivePanel;
	onPanelChange: (panel: ActivePanel) => void;
	onAiStart: () => void;
	onAiEnd: () => void;
	storedSelectionRef: RefObject<StoredSelection | null>;
}

function FloatingPopup({
	editor,
	selectionRect,
	formatState,
	isAiLoading,
	activePanel,
	onPanelChange,
	onAiStart,
	onAiEnd,
	storedSelectionRef,
}: PopupProps) {
	const ref = useRef<HTMLDivElement>(null);
	const [left, setLeft] = useState<number | null>(null);
	const [top, setTop] = useState<number | null>(null);
	const [linkUrl, setLinkUrl] = useState(formatState.linkUrl);
	const [rewriteInstruction, setRewriteInstruction] = useState("");
	const linkInputRef = useRef<HTMLInputElement>(null);
	const rewriteInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		setLinkUrl(formatState.linkUrl);
	}, [formatState.linkUrl]);

	// Focus the right input when a panel opens
	useEffect(() => {
		if (activePanel === "link") {
			setTimeout(() => linkInputRef.current?.focus(), 0);
		} else if (activePanel === "rewrite") {
			setTimeout(() => rewriteInputRef.current?.focus(), 0);
		}
	}, [activePanel]);

	// Recalculate position after panel or loading changes (height changes)
	useEffect(() => {
		const el = ref.current;
		if (!el) {
			return;
		}
		const id = requestAnimationFrame(() => {
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
		});
		return () => cancelAnimationFrame(id);
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
			const sel = $getSelection();
			if ($isRangeSelection(sel)) {
				$patchStyleText(sel, {
					"background-color": hasHighlight ? "" : DEFAULT_HIGHLIGHT,
				});
			}
		});
	}, [editor, hasHighlight]);

	const clearFormatting = useCallback(() => {
		editor.update(() => {
			const sel = $getSelection();
			if ($isRangeSelection(sel)) {
				$patchStyleText(sel, { "background-color": "" });
			}
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

	const applyLink = useCallback(() => {
		if (linkUrl.trim()) {
			editor.dispatchCommand(TOGGLE_LINK_COMMAND, linkUrl.trim());
		}
		onPanelChange(null);
	}, [editor, linkUrl, onPanelChange]);

	const removeLink = useCallback(() => {
		editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
		onPanelChange(null);
	}, [editor, onPanelChange]);

	const applyAiResult = useCallback(
		(html: string) => {
			const stored = storedSelectionRef.current;
			if (!stored) {
				return;
			}
			try {
				editor.update(() => {
					const sel = $createRangeSelection();
					sel.anchor.set(
						stored.anchorKey,
						stored.anchorOffset,
						stored.anchorType
					);
					sel.focus.set(stored.focusKey, stored.focusOffset, stored.focusType);
					$setSelection(sel);
					const currentSel = $getSelection();
					if (!$isRangeSelection(currentSel)) {
						return;
					}
					const parser = new DOMParser();
					const dom = parser.parseFromString(html, "text/html");
					const nodes = $generateNodesFromDOM(editor, dom);
					if (nodes.length > 0) {
						currentSel.insertNodes(nodes);
					}
				});
			} catch {
				toast.error(
					"Could not apply AI result — the document may have changed."
				);
			}
		},
		[editor, storedSelectionRef]
	);

	const runInlineEdit = useCallback(
		async (selectedHtml: string, instruction?: string) => {
			onAiStart();
			try {
				const res = await fetch(`${env.VITE_SERVER_URL}/api/chat/inline-edit`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					credentials: "include",
					body: JSON.stringify({ selectedHtml, instruction }),
				});
				if (!res.ok) {
					throw new Error(`${res.status}`);
				}
				const data = (await res.json()) as { html: string };
				applyAiResult(data.html);
			} catch {
				toast.error(
					instruction ? "Failed to rewrite text" : "Failed to rephrase text"
				);
			} finally {
				onAiEnd();
			}
		},
		[applyAiResult, onAiStart, onAiEnd]
	);

	/**
	 * Generate HTML from the current live selection (Rephrase path).
	 * Must be called inside editor.read() to set the active editor context.
	 */
	const readCurrentSelectionHtml = useCallback((): string => {
		let html = "";
		editor.read(() => {
			const sel = $getSelection();
			if ($isRangeSelection(sel) && !sel.isCollapsed()) {
				html = $generateHtmlFromNodes(editor, sel);
			}
		});
		return html;
	}, [editor]);

	/**
	 * Generate HTML from stored selection keys (Rewrite path, used when input
	 * has focus and the editor selection is already gone).
	 */
	const readStoredSelectionHtml = useCallback((): string => {
		const stored = storedSelectionRef.current;
		if (!stored) {
			return "";
		}
		let html = "";
		editor.read(() => {
			const sel = $createRangeSelection();
			sel.anchor.set(stored.anchorKey, stored.anchorOffset, stored.anchorType);
			sel.focus.set(stored.focusKey, stored.focusOffset, stored.focusType);
			html = $generateHtmlFromNodes(editor, sel);
		});
		return html;
	}, [editor, storedSelectionRef]);

	const handleRephrase = useCallback(() => {
		// Selection is still live here (FloatButton.onMouseDown prevents focus loss)
		const html = readCurrentSelectionHtml();
		if (html) {
			runInlineEdit(html);
		}
	}, [readCurrentSelectionHtml, runInlineEdit]);

	const handleRewriteSubmit = useCallback(() => {
		const instruction = rewriteInstruction.trim();
		if (!instruction) {
			return;
		}
		// Selection may be gone (input has focus) — use stored keys
		const html = readStoredSelectionHtml();
		if (!html) {
			onPanelChange(null);
			return;
		}
		onPanelChange(null);
		setRewriteInstruction("");
		runInlineEdit(html, instruction);
	}, [
		rewriteInstruction,
		readStoredSelectionHtml,
		runInlineEdit,
		onPanelChange,
	]);

	return (
		<div
			className="fixed z-50 min-w-max rounded-lg border bg-popover shadow-lg"
			ref={ref}
			style={
				left !== null && top !== null
					? { left, top, opacity: 1 }
					: { opacity: 0, pointerEvents: "none", left: -9999, top: -9999 }
			}
		>
			{isAiLoading ? (
				<div className="flex h-9 items-center gap-1.5 px-3 text-muted-foreground text-xs">
					<Loader2Icon className="size-3.5 animate-spin" />
					<span>Rewriting…</span>
				</div>
			) : (
				<>
					{/* ── button row ── */}
					<div className="flex items-center gap-px px-1 py-1">
						<FloatButton
							active={isBold}
							label="Bold"
							onClick={() =>
								editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")
							}
						>
							<BoldIcon className="size-3.5" />
						</FloatButton>
						<FloatButton
							active={isItalic}
							label="Italic"
							onClick={() =>
								editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")
							}
						>
							<ItalicIcon className="size-3.5" />
						</FloatButton>
						<FloatButton
							active={isUnderline}
							label="Underline"
							onClick={() =>
								editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline")
							}
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
							onClick={() =>
								editor.dispatchCommand(FORMAT_TEXT_COMMAND, "code")
							}
						>
							<CodeIcon className="size-3.5" />
						</FloatButton>
						<div className="mx-0.5 h-4 w-px shrink-0 bg-border" />
						<FloatButton
							active={isLink || activePanel === "link"}
							label="Insert or edit link"
							onClick={() =>
								onPanelChange(activePanel === "link" ? null : "link")
							}
						>
							<LinkIcon className="size-3.5" />
						</FloatButton>
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
						<div className="mx-0.5 h-4 w-px shrink-0 bg-border" />
						<FloatButton label="Rephrase with AI" onClick={handleRephrase}>
							<SparklesIcon className="size-3.5" />
						</FloatButton>
						<FloatButton
							active={activePanel === "rewrite"}
							label="Rewrite with instruction"
							onClick={() =>
								onPanelChange(activePanel === "rewrite" ? null : "rewrite")
							}
						>
							<PenLineIcon className="size-3.5" />
						</FloatButton>
					</div>

					{/* ── link panel ── */}
					{activePanel === "link" && (
						<div className="flex flex-col gap-2 border-t px-2 py-2">
							<span className="font-medium text-muted-foreground text-xs">
								Link URL
							</span>
							<Input
								onChange={(e) => setLinkUrl(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										e.preventDefault();
										applyLink();
									}
									if (e.key === "Escape") {
										onPanelChange(null);
									}
								}}
								placeholder="https://..."
								ref={linkInputRef}
								value={linkUrl}
							/>
							<div className="flex gap-1">
								<button
									className="flex flex-1 items-center justify-center rounded-md border px-2 py-1.5 font-medium text-xs transition-colors hover:bg-muted"
									onClick={applyLink}
									type="button"
								>
									Apply
								</button>
								<button
									className="flex flex-1 items-center justify-center rounded-md border px-2 py-1.5 font-medium text-xs transition-colors hover:bg-muted"
									onClick={removeLink}
									type="button"
								>
									Remove
								</button>
							</div>
						</div>
					)}

					{/* ── rewrite panel ── */}
					{activePanel === "rewrite" && (
						<div className="flex flex-col gap-2 border-t px-2 py-2">
							<span className="font-medium text-muted-foreground text-xs">
								Rewrite instruction
							</span>
							<Input
								onChange={(e) => setRewriteInstruction(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										e.preventDefault();
										handleRewriteSubmit();
									}
									if (e.key === "Escape") {
										onPanelChange(null);
									}
								}}
								placeholder="e.g. make it more concise"
								ref={rewriteInputRef}
								value={rewriteInstruction}
							/>
							<button
								className="flex w-full items-center justify-center rounded-md border px-2 py-1.5 font-medium text-xs transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
								disabled={!rewriteInstruction.trim()}
								onClick={handleRewriteSubmit}
								type="button"
							>
								Rewrite
							</button>
						</div>
					)}
				</>
			)}
		</div>
	);
}

export function FloatingTextFormatPlugin() {
	const [editor] = useLexicalComposerContext();
	const [selectionRect, setSelectionRect] = useState<DOMRect | null>(null);
	const [isAiLoading, setIsAiLoading] = useState(false);
	const [activePanel, setActivePanel] = useState<ActivePanel>(null);
	const frozenRectRef = useRef<DOMRect | null>(null);
	const storedSelectionRef = useRef<StoredSelection | null>(null);

	// Refs mirror the state values so updateToolbar can read them without
	// being listed as a dependency (avoids re-registering listeners on every change).
	const isAiLoadingRef = useRef(false);
	const activePanelRef = useRef<ActivePanel>(null);

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

	// Stable callback — only depends on `editor`, never re-created.
	// Reads freeze flags from refs so listeners never need re-registration.
	const updateToolbar = useCallback(() => {
		if (isAiLoadingRef.current || activePanelRef.current !== null) {
			return;
		}

		const selection = $getSelection();
		if (!$isRangeSelection(selection) || selection.isCollapsed()) {
			setSelectionRect(null);
			storedSelectionRef.current = null;
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
		// Store selection keys for later restoration (no node creation — safe here)
		storedSelectionRef.current = {
			anchorKey: selection.anchor.key,
			anchorOffset: selection.anchor.offset,
			anchorType: selection.anchor.type,
			focusKey: selection.focus.key,
			focusOffset: selection.focus.offset,
			focusType: selection.focus.type,
		};
	}, []); // stable: editor never changes for a given LexicalComposer instance

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
	}, [editor, updateToolbar]); // updateToolbar is now stable — effect runs once

	const handlePanelChange = useCallback(
		(panel: ActivePanel) => {
			if (panel !== null && activePanelRef.current === null) {
				frozenRectRef.current = selectionRect;
			}
			activePanelRef.current = panel;
			setActivePanel(panel);
			if (panel === null) {
				setTimeout(() => editor.focus(), 0);
			}
		},
		[selectionRect, editor]
	);

	const handleAiStart = useCallback(() => {
		frozenRectRef.current = selectionRect;
		isAiLoadingRef.current = true;
		setIsAiLoading(true);
	}, [selectionRect]);

	const handleAiEnd = useCallback(() => {
		isAiLoadingRef.current = false;
		setIsAiLoading(false);
		frozenRectRef.current = null;
	}, []);

	const shouldFreeze = isAiLoading || activePanel !== null;
	const activeRect = shouldFreeze ? frozenRectRef.current : selectionRect;

	if (!(activeRect && editor.isEditable())) {
		return null;
	}

	return createPortal(
		<FloatingPopup
			activePanel={activePanel}
			editor={editor}
			formatState={formatState}
			isAiLoading={isAiLoading}
			onAiEnd={handleAiEnd}
			onAiStart={handleAiStart}
			onPanelChange={handlePanelChange}
			selectionRect={activeRect}
			storedSelectionRef={storedSelectionRef}
		/>,
		document.body
	);
}
