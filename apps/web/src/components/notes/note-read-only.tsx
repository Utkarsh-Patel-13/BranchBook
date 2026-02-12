import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { LinkNode } from "@lexical/link";
import { ListItemNode, ListNode } from "@lexical/list";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table";

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

interface NoteReadOnlyProps {
	content: string;
}

export function NoteReadOnly({ content }: NoteReadOnlyProps) {
	return (
		<LexicalComposer
			initialConfig={{
				namespace: "note-read-only",
				editable: false,
				nodes: NODES,
				editorState: content,
				onError: (error) => {
					throw error;
				},
			}}
		>
			<div className="relative h-full overflow-y-auto px-4 py-3">
				<RichTextPlugin
					contentEditable={
						<ContentEditable className="prose prose-sm dark:prose-invert min-h-full max-w-none outline-none" />
					}
					ErrorBoundary={LexicalErrorBoundary}
					placeholder={null}
				/>
			</div>
		</LexicalComposer>
	);
}
