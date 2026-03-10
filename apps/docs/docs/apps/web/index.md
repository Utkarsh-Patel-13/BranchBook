---
sidebar_position: 1
---

# Web App

Main web application for BranchBook — a knowledge workspace where note-taking and AI chat coexist.

## Tech Stack

- Vite, React 19, TanStack Router
- TanStack Query + tRPC
- Lexical (rich text), Tailwind CSS v4
- Optional Tauri desktop builds

## Quick Start

```bash
bun run dev:web
```

Runs on **port 3001**. Requires the server on port 3000.

## Modules

- [Workspaces](/docs/apps/web/workspaces) — Layout, sidebar, node tree, navigation
- [Notes](/docs/apps/web/notes) — Lexical editor, rich text, toolbar
- [Chat](/docs/apps/web/chat) — AI chat panel, streaming, summarization
