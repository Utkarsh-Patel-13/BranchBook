import prisma from "@branchbook/db";
import type {
	ExportNoteInput,
	GetByNodeIdInput,
	NoteOutput,
	RemoveNoteInput,
	UpsertNoteInput,
} from "@branchbook/validators";
import { TRPCError } from "@trpc/server";
import puppeteer from "puppeteer";

const verifyNodeAccess = async (
	nodeId: string,
	userId: string
): Promise<void> => {
	const node = await prisma.node.findFirst({
		where: { id: nodeId, deletedAt: null },
		include: { workspace: { select: { ownerId: true } } },
	});

	if (!node || node.workspace.ownerId !== userId) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Node not found or access denied",
		});
	}
};

export const getNoteByNodeId = async (
	db: typeof prisma,
	userId: string,
	input: GetByNodeIdInput
): Promise<NoteOutput | null> => {
	await verifyNodeAccess(input.nodeId, userId);

	const note = await db.note.findFirst({
		where: { nodeId: input.nodeId, deletedAt: null },
	});

	return note ?? null;
};

export const upsertNote = async (
	db: typeof prisma,
	userId: string,
	input: UpsertNoteInput
): Promise<NoteOutput> => {
	await verifyNodeAccess(input.nodeId, userId);

	const note = await db.note.upsert({
		where: { nodeId: input.nodeId },
		update: { content: input.content, deletedAt: null },
		create: { nodeId: input.nodeId, content: input.content },
	});

	return note;
};

export const removeNote = async (
	db: typeof prisma,
	userId: string,
	input: RemoveNoteInput
): Promise<{ deleted: true }> => {
	await verifyNodeAccess(input.nodeId, userId);

	await db.note.updateMany({
		where: { nodeId: input.nodeId, deletedAt: null },
		data: { deletedAt: new Date() },
	});

	return { deleted: true };
};

const NOTE_HTML_TEMPLATE = (body: string) => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<style>
  *, *::before, *::after { box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
    font-size: 13px;
    line-height: 1.6;
    color: #111;
    margin: 0;
    padding: 48px 56px;
  }
  h1 { font-size: 2em; margin: 0.6em 0 0.3em; }
  h2 { font-size: 1.5em; margin: 0.6em 0 0.3em; }
  h3 { font-size: 1.17em; margin: 0.6em 0 0.3em; }
  p  { margin: 0.4em 0; }
  ul, ol { padding-left: 1.5em; margin: 0.4em 0; }
  li { margin: 0.2em 0; }
  blockquote {
    border-left: 3px solid #ccc;
    margin: 0.6em 0;
    padding: 0.2em 1em;
    color: #555;
  }
  pre, code {
    font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
    background: #f5f5f5;
    border-radius: 3px;
    font-size: 0.9em;
  }
  pre  { padding: 0.8em 1em; overflow-x: auto; }
  code { padding: 0.1em 0.3em; }
  table { border-collapse: collapse; width: 100%; margin: 0.6em 0; }
  th, td { border: 1px solid #ddd; padding: 6px 10px; text-align: left; }
  th { background: #f0f0f0; font-weight: 600; }
  a { color: #0066cc; }
</style>
</head>
<body>${body}</body>
</html>`;

export const exportNotePdf = async (
	db: typeof prisma,
	userId: string,
	input: ExportNoteInput
): Promise<{ pdf: string }> => {
	await verifyNodeAccess(input.nodeId, userId);

	const note = await db.note.findFirst({
		where: { nodeId: input.nodeId, deletedAt: null },
	});

	if (!note?.content.trim()) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Note not found or is empty",
		});
	}

	const browser = await puppeteer.launch({ args: ["--no-sandbox"] });
	try {
		const page = await browser.newPage();
		await page.setContent(NOTE_HTML_TEMPLATE(note.content), {
			waitUntil: "networkidle0",
		});
		const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });
		const pdf = Buffer.from(pdfBuffer).toString("base64");
		return { pdf };
	} finally {
		await browser.close();
	}
};
