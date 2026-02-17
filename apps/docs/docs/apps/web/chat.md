---
sidebar_position: 4
---

# Chat

AI chat panel with streaming responses and conversation summarization.

## Features

- Streaming responses via Vercel AI SDK
- Model selection (Gemini variants)
- Optional thinking mode, web search
- Per-message summaries; threshold-triggered resummarization
- "Summarize to notes" — generates Lexical HTML from discussion

## Key Components

- **node-chat-panel** — Main chat container
- **chat-prompt-area** — Input, model selector
- **chat-message** — Message bubbles with reasoning, sources
- **chat-content** — Renders markdown, code, mermaid via Streamdown

## API

REST endpoints: `POST /api/chat`, `POST /api/chat/summarize`. See [Server Chat API](/docs/apps/server/chat-api).
