import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { LinkNode } from "@lexical/link";
import { ListItemNode, ListNode } from "@lexical/list";
import { TRANSFORMERS } from "@lexical/markdown";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table";
import type { EditorState } from "lexical";
import { useCallback, useEffect, useRef } from "react";

const NODES = [
	HeadingNode,
	QuoteNode,
	ListNode,
	ListItemNode,
	LinkNode,
	CodeNode,
	CodeHighlightNode,
	TableNode,
	TableCellNode,
	TableRowNode,
];

const DEBOUNCE_MS = 1000;

interface NoteEditorProps {
	initialContent: string | null;
	onSave: (content: string) => void;
	isSaving?: boolean;
}

export function NoteEditor({
	initialContent,
	onSave,
	isSaving,
}: NoteEditorProps) {
	const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		return () => {
			if (saveTimerRef.current !== null) {
				clearTimeout(saveTimerRef.current);
			}
		};
	}, []);

	const handleChange = useCallback(
		(editorState: EditorState) => {
			if (saveTimerRef.current !== null) {
				clearTimeout(saveTimerRef.current);
			}
			saveTimerRef.current = setTimeout(() => {
				const content = JSON.stringify(editorState.toJSON());
				onSave(content);
			}, DEBOUNCE_MS);
		},
		[onSave]
	);

	return (
		<LexicalComposer
			initialConfig={{
				namespace: "note-editor",
				editable: true,
				nodes: NODES,
				editorState: initialContent ?? undefined,
				onError: (error) => {
					throw error;
				},
			}}
		>
			<div className="relative flex h-full flex-col overflow-hidden">
				{isSaving && (
					<div className="absolute top-2 right-3 z-10 text-muted-foreground text-xs">
						Saving…
					</div>
				)}
				<div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
					<RichTextPlugin
						contentEditable={
							<ContentEditable className="prose prose-sm dark:prose-invert min-h-full max-w-none outline-none" />
						}
						ErrorBoundary={LexicalErrorBoundary}
						placeholder={
							<div className="pointer-events-none absolute top-3 left-4 text-muted-foreground text-sm">
								Start writing…
							</div>
						}
					/>
				</div>
				<HistoryPlugin />
				<ListPlugin />
				<MarkdownShortcutPlugin transformers={TRANSFORMERS} />
				<OnChangePlugin ignoreSelectionChange onChange={handleChange} />
			</div>
		</LexicalComposer>
	);
}
