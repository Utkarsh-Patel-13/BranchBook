---
sidebar_position: 3
---

# Notes

Rich text notes powered by Lexical.

## Features

- Block-level editing (headings, lists, blockquotes, code)
- Inline formatting (bold, italic, links)
- Floating toolbar for selection
- Markdown import/export via Lexical plugins

## Key Components

- **styled-text-node** — Lexical-based editor wrapper
- **note-toolbar** — Formatting controls
- **note-floating-toolbar** — Contextual toolbar on selection
- **workspace-notes-panel** — Notes panel in split layout

## Data

tRPC `note.*` procedures. Notes stored as Lexical JSON in `Node.content`.
