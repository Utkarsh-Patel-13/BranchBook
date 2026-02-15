import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { HashtagNode } from "@lexical/hashtag";
import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { ListItemNode, ListNode } from "@lexical/list";
import { TRANSFORMERS } from "@lexical/markdown";
import { OverflowNode } from "@lexical/overflow";
import { AutoLinkPlugin } from "@lexical/react/LexicalAutoLinkPlugin";
import { CharacterLimitPlugin } from "@lexical/react/LexicalCharacterLimitPlugin";
import { CheckListPlugin } from "@lexical/react/LexicalCheckListPlugin";
import { ClickableLinkPlugin } from "@lexical/react/LexicalClickableLinkPlugin";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HashtagPlugin } from "@lexical/react/LexicalHashtagPlugin";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { TabIndentationPlugin } from "@lexical/react/LexicalTabIndentationPlugin";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import {
	$isTableNode,
	TableCellNode,
	TableNode,
	TableRowNode,
} from "@lexical/table";
import type { EditorState, LexicalEditor } from "lexical";
import {
	$createParagraphNode,
	$getRoot,
	type LexicalNode,
	TextNode,
} from "lexical";
import { AlertCircleIcon, NotebookIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { FloatingTextFormatPlugin } from "@/components/workspaces/notes/note-floating-toolbar";
import { NoteToolbar } from "@/components/workspaces/notes/note-toolbar";
import { useNote, useUpsertNote } from "@/hooks/use-note";
import { useWorkspaceLayoutStore } from "@/stores/workspace-layout-store";
import { ExtendedTextNode } from "./styled-text-node";

const URL_MATCHER =
	/((https?:\/\/(www\.)?)|(www\.))[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/;
const EMAIL_MATCHER =
	/(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/;

const AUTOLINK_MATCHERS = [
	(text: string) => {
		const match = URL_MATCHER.exec(text);
		if (match === null) {
			return null;
		}
		const fullMatch = match[0];
		return {
			index: match.index,
			length: fullMatch.length,
			text: fullMatch,
			url: fullMatch.startsWith("http") ? fullMatch : `https://${fullMatch}`,
		};
	},
	(text: string) => {
		const match = EMAIL_MATCHER.exec(text);
		if (match === null) {
			return null;
		}
		return {
			index: match.index,
			length: match[0].length,
			text: match[0],
			url: `mailto:${match[0]}`,
		};
	},
];

const NODES = [
	ExtendedTextNode,
	{
		replace: TextNode,
		with: (node: TextNode) => new ExtendedTextNode(node.__text),
		withKlass: ExtendedTextNode,
	},
	HeadingNode,
	QuoteNode,
	ListNode,
	ListItemNode,
	LinkNode,
	AutoLinkNode,
	CodeNode,
	CodeHighlightNode,
	TableNode,
	TableCellNode,
	TableRowNode,
	HashtagNode,
	OverflowNode,
];

/** RootNode only accepts element or decorator nodes. Wrap text/linebreak in a paragraph. */
function nodesForRoot(nodes: LexicalNode[]): LexicalNode[] {
	return nodes.flatMap((node) => {
		const type = node.getType();
		if (type === "text" || type === "linebreak") {
			const p = $createParagraphNode();
			p.append(node);
			return [p];
		}
		return [node];
	});
}

function isEmptyParagraphContent(html: string): boolean {
	const t = html.trim();
	return t === "" || t === "<p><br></p>" || t === "<p></p>";
}

const DEBOUNCE_MS = 2000;
const SAVED_FLASH_MS = 2000;
const WORD_SPLIT_RE = /\s+/;
const NOTE_CHAR_LIMIT = 25_000;

const EDITOR_THEME = {
	text: {
		bold: "font-bold",
		italic: "italic",
		underline: "underline",
		strikethrough: "line-through",
		underlineStrikethrough: "underline line-through",
		code: "rounded bg-muted px-1 py-0.5 font-mono text-sm",
	},
	link: "notes-link",
	list: {
		listitemChecked: "notes-listitem-checked",
		listitemUnchecked: "notes-listitem-unchecked",
	},
	hashtag: "notes-hashtag",
};

function EditabilityPlugin({ isEditing }: { isEditing: boolean }) {
	const [editor] = useLexicalComposerContext();
	useEffect(() => {
		editor.setEditable(isEditing);
		if (isEditing) {
			editor.focus();
		}
	}, [editor, isEditing]);
	return null;
}

function WordCountPlugin({
	onCount,
}: {
	onCount: (words: number, chars: number) => void;
}) {
	const [editor] = useLexicalComposerContext();
	useEffect(() => {
		return editor.registerUpdateListener(({ editorState }) => {
			editorState.read(() => {
				const text = $getRoot().getTextContent();
				const trimmed = text.trim();
				const words = trimmed === "" ? 0 : trimmed.split(WORD_SPLIT_RE).length;
				onCount(words, text.length);
			});
		});
	}, [editor, onCount]);
	return null;
}

async function hashString(str: string): Promise<string> {
	const encoder = new TextEncoder();
	const data = encoder.encode(str);
	const hashBuffer = await crypto.subtle.digest("SHA-256", data);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function ExternalContentSyncPlugin({
	content,
	isEditing,
}: {
	content: string | null;
	isEditing: boolean;
}) {
	const [editor] = useLexicalComposerContext();
	const [lastSyncedHash, setLastSyncedHash] = useState<string | null>(null);
	const lastContentRef = useRef<string | null>(null);

	useEffect(() => {
		if (content == null) {
			return;
		}
		const contentToSync =
			content === "" || isEmptyParagraphContent(content) ? "" : content;

		// Skip JSON-serialized editor state (we only handle HTML)
		const trimmed = contentToSync.trimStart();
		if (trimmed.startsWith("{")) {
			return;
		}

		// Hash the content and compare
		hashString(contentToSync).then((currentHash) => {
			if (currentHash === lastSyncedHash) {
				return;
			}

			// When editing, skip sync if incoming content matches current editor state
			// (e.g. from our own autosave refetch). Avoids replacing content and losing cursor.
			if (isEditing) {
				let editorHtml = "";
				editor.getEditorState().read(() => {
					editorHtml = $generateHtmlFromNodes(editor, null);
				});
				hashString(editorHtml).then((editorHash) => {
					if (editorHash === currentHash) {
						setLastSyncedHash(currentHash);
						lastContentRef.current = contentToSync;
						return;
					}
					doSync();
				});
			} else {
				doSync();
			}

			function doSync() {
				setLastSyncedHash(currentHash);
				lastContentRef.current = contentToSync;

				if (contentToSync === "") {
					editor.update(() => {
						const root = $getRoot();
						root.clear();
						root.append($createParagraphNode());
					});
					return;
				}

				// If editing, check if this is an append operation
				if (
					isEditing &&
					lastContentRef.current &&
					contentToSync.startsWith(lastContentRef.current)
				) {
					const appendedContent = contentToSync.slice(
						lastContentRef.current.length
					);
					if (appendedContent) {
						editor.update(() => {
							const parser = new DOMParser();
							const dom = parser.parseFromString(appendedContent, "text/html");
							const nodes = $generateNodesFromDOM(editor, dom);
							const root = $getRoot();
							root.append(...nodesForRoot(nodes));
						});
					}
					return;
				}

				// Full sync (for view mode or non-append changes)
				editor.update(() => {
					const root = $getRoot();
					root.clear();
					if (contentToSync === "") {
						root.append($createParagraphNode());
					} else {
						const parser = new DOMParser();
						const dom = parser.parseFromString(contentToSync, "text/html");
						const nodes = $generateNodesFromDOM(editor, dom);
						root.append(...nodesForRoot(nodes));
					}
				});
			}
		});
	}, [content, editor, isEditing, lastSyncedHash]);

	return null;
}

function applyTableNormalization() {
	const root = $getRoot();
	const children = root.getChildren();
	if (children.length === 0) {
		return;
	}

	const first = children[0];
	if (
		children.length === 1 &&
		$isTableNode(first) &&
		first.getTextContent().trim() === ""
	) {
		const p = $createParagraphNode();
		root.splice(0, 1, [p]);
		p.selectStart();
		return;
	}
	if ($isTableNode(first)) {
		root.insertBefore($createParagraphNode());
	}
	const lastNow = root.getLastChild();
	if (lastNow !== null && $isTableNode(lastNow)) {
		root.append($createParagraphNode());
	}
}

function TableNormalizationPlugin() {
	const [editor] = useLexicalComposerContext();
	useEffect(() => {
		return editor.registerUpdateListener(({ editorState }) => {
			editorState.read(() => {
				const root = $getRoot();
				const children = root.getChildren();
				const size = children.length;
				if (size === 0) {
					return;
				}

				const first = children[0];
				const last = children[size - 1];
				const replaceEmptyTable =
					size === 1 &&
					$isTableNode(first) &&
					first.getTextContent().trim() === "";
				const needLeading = $isTableNode(first);
				const needTrailing = $isTableNode(last);
				if (!(replaceEmptyTable || needLeading || needTrailing)) {
					return;
				}

				editor.update(() => applyTableNormalization());
			});
		});
	}, [editor]);
	return null;
}

function NotesLoadingState() {
	return (
		<div className="flex h-full flex-col gap-3 p-4">
			<div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
			<div className="h-3 w-full animate-pulse rounded bg-muted" />
			<div className="h-3 w-5/6 animate-pulse rounded bg-muted" />
			<div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
		</div>
	);
}

function NoNodeSelected() {
	return (
		<div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
			<div className="rounded-full bg-muted p-3">
				<NotebookIcon className="size-6 text-muted-foreground" />
			</div>
			<div className="space-y-1">
				<h3 className="font-medium text-sm">No node selected</h3>
				<p className="text-muted-foreground text-xs">
					Select a node to view its notes.
				</p>
			</div>
		</div>
	);
}

function NotesErrorState({ onRetry }: { onRetry: () => void }) {
	return (
		<div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
			<div className="rounded-full bg-destructive/10 p-3">
				<AlertCircleIcon className="size-6 text-destructive" />
			</div>
			<div className="space-y-1">
				<h3 className="font-medium text-sm">Failed to load note</h3>
				<p className="text-muted-foreground text-xs">
					Something went wrong. Check your connection and try again.
				</p>
			</div>
			<button
				className="rounded-md border px-3 py-1.5 font-medium text-xs transition-colors hover:bg-muted"
				onClick={onRetry}
				type="button"
			>
				Retry
			</button>
		</div>
	);
}

interface NotesPanelHeaderProps {
	isEditing: boolean;
	isSaving: boolean;
	justSaved: boolean;
}

function NotesPanelHeader({
	isEditing,
	isSaving,
	justSaved,
}: NotesPanelHeaderProps) {
	const { editMode, setEditMode } = useWorkspaceLayoutStore();

	return (
		<header className="flex min-h-12 shrink-0 items-center justify-between border-b px-4 py-2">
			<div className="flex items-center gap-2">
				<NotebookIcon className="size-3.5 shrink-0 text-primary" />
				<span
					className={
						isEditing
							? "font-medium text-primary text-sm"
							: "font-medium text-primary text-sm"
					}
				>
					{isEditing ? "Editing" : "Read Only"}
				</span>
				{isSaving && (
					<span className="text-muted-foreground text-sm">· Saving…</span>
				)}
				{!isSaving && justSaved && (
					<span className="text-emerald-600 text-xs dark:text-emerald-400">
						Saved
					</span>
				)}
			</div>
			<div className="flex items-center gap-2">
				<Label className="text-xs" htmlFor="edit-mode-toggle">
					View
				</Label>
				<Switch
					checked={editMode}
					id="edit-mode-toggle"
					onCheckedChange={setEditMode}
				/>
				<Label className="text-xs" htmlFor="edit-mode-toggle">
					Edit
				</Label>
			</div>
		</header>
	);
}

interface NotesPanelContentProps {
	nodeId: string;
	editMode: boolean;
}

function NotesPanelContent({ nodeId, editMode }: NotesPanelContentProps) {
	const { data: note, isLoading, isError, refetch } = useNote(nodeId);
	const { mutate: upsert, isPending: isSaving } = useUpsertNote(nodeId);
	const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const [justSaved, setJustSaved] = useState(false);
	const wasSavingRef = useRef(false);
	useEffect(() => {
		if (wasSavingRef.current && !isSaving) {
			setJustSaved(true);
			const timer = setTimeout(() => setJustSaved(false), SAVED_FLASH_MS);
			return () => clearTimeout(timer);
		}
		wasSavingRef.current = isSaving;
	}, [isSaving]);

	useEffect(() => {
		return () => {
			if (saveTimerRef.current !== null) {
				clearTimeout(saveTimerRef.current);
			}
		};
	}, []);

	const [wordCount, setWordCount] = useState({ words: 0, chars: 0 });
	const handleCount = useCallback(
		(words: number, chars: number) => setWordCount({ words, chars }),
		[]
	);

	const handleChange = useCallback(
		(_editorState: EditorState, editor: LexicalEditor) => {
			if (!editMode) {
				return;
			}
			if (saveTimerRef.current !== null) {
				clearTimeout(saveTimerRef.current);
			}
			saveTimerRef.current = setTimeout(() => {
				editor.read(() => {
					const html = $generateHtmlFromNodes(editor, null);
					if (html.length <= NOTE_CHAR_LIMIT) {
						const content = isEmptyParagraphContent(html) ? "" : html;
						upsert({ nodeId, content });
					}
				});
			}, DEBOUNCE_MS);
		},
		[editMode, nodeId, upsert]
	);

	if (isLoading) {
		return <NotesLoadingState />;
	}

	if (isError) {
		return <NotesErrorState onRetry={() => refetch()} />;
	}

	const initialEditorState = (() => {
		const raw = note?.content;
		if (raw == null || raw === "" || isEmptyParagraphContent(raw)) {
			return undefined;
		}
		const trimmed = raw.trimStart();
		if (trimmed.startsWith("{")) {
			return raw;
		}
		return (editor: LexicalEditor) => {
			const parser = new DOMParser();
			const dom = parser.parseFromString(raw, "text/html");
			const nodes = $generateNodesFromDOM(editor, dom);
			const root = $getRoot();
			root.clear();
			root.append(...nodesForRoot(nodes));
		};
	})();

	return (
		<LexicalComposer
			initialConfig={{
				namespace: "notes-panel",
				theme: EDITOR_THEME,
				editable: false,
				nodes: NODES,
				editorState: initialEditorState,
				onError: (error) => {
					throw error;
				},
			}}
			key={nodeId}
		>
			<div className="flex h-full flex-col overflow-hidden">
				<NotesPanelHeader
					isEditing={editMode}
					isSaving={isSaving}
					justSaved={justSaved}
				/>

				{editMode && <NoteToolbar />}

				{(note?.content && note.content.trim() !== "") || editMode ? (
					<div className="relative min-h-0 flex-1 overflow-y-auto px-4 py-3">
						<RichTextPlugin
							contentEditable={
								<ContentEditable
									className={`prose prose-sm dark:prose-invert min-h-full max-w-none outline-none ${editMode ? "cursor-text" : "cursor-default select-text"}`}
								/>
							}
							ErrorBoundary={LexicalErrorBoundary}
							placeholder={
								editMode ? (
									<div className="pointer-events-none absolute top-3 left-4 text-muted-foreground text-sm">
										Start writing… (supports Markdown shortcuts)
									</div>
								) : null
							}
						/>
					</div>
				) : (
					<div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
						<div className="rounded-full bg-muted p-3">
							<NotebookIcon className="size-6 text-muted-foreground" />
						</div>
						<div className="space-y-1">
							<h3 className="font-medium text-sm">No note yet</h3>
							<p className="text-muted-foreground text-xs">
								Toggle edit mode in the header to start writing.
							</p>
						</div>
					</div>
				)}

				{editMode && (
					<div className="flex shrink-0 items-center justify-end border-t px-4 py-1">
						<span className="text-muted-foreground text-xs tabular-nums">
							{wordCount.words} {wordCount.words === 1 ? "word" : "words"} ·{" "}
							{wordCount.chars.toLocaleString()} /{" "}
							{NOTE_CHAR_LIMIT.toLocaleString()} chars
						</span>
					</div>
				)}
			</div>

			<EditabilityPlugin isEditing={editMode} />
			<CharacterLimitPlugin charset="UTF-16" maxLength={NOTE_CHAR_LIMIT} />
			<TableNormalizationPlugin />
			<HistoryPlugin />
			<ListPlugin />
			<CheckListPlugin />
			<HashtagPlugin />
			<LinkPlugin />
			<AutoLinkPlugin matchers={AUTOLINK_MATCHERS} />
			<ClickableLinkPlugin />
			<TabIndentationPlugin />
			<MarkdownShortcutPlugin transformers={TRANSFORMERS} />
			<OnChangePlugin ignoreSelectionChange onChange={handleChange} />
			<ExternalContentSyncPlugin
				content={note?.content ?? null}
				isEditing={editMode}
			/>
			{editMode && <FloatingTextFormatPlugin />}
			{editMode && <WordCountPlugin onCount={handleCount} />}
		</LexicalComposer>
	);
}

interface WorkspaceNotesPanelProps {
	selectedNodeId: string | null;
	editMode: boolean;
}

export function WorkspaceNotesPanel({
	selectedNodeId,
	editMode,
}: WorkspaceNotesPanelProps) {
	if (selectedNodeId === null) {
		return <NoNodeSelected />;
	}

	return <NotesPanelContent editMode={editMode} nodeId={selectedNodeId} />;
}
