---
sidebar_position: 1
---

# Server App

Backend API server for BranchBook. Handles authentication, tRPC procedures, and AI-powered chat with streaming and summarization.

## Tech Stack

- **Runtime:** Bun
- **HTTP:** Fastify
- **API:** tRPC v11
- **Auth:** Better Auth
- **Database:** Prisma (PostgreSQL)
- **AI:** Vercel AI SDK + Google Gemini

## Quick Start

```bash
# From repo root
bun run dev:server
```

Server runs on **port 3000**. See [Setup](/docs/apps/server/setup) for environment variables.

## API Overview

| Path | Description |
|------|-------------|
| `/api/auth/*` | Better Auth (sessions, sign-in, sign-out) |
| `/trpc/*` | tRPC procedures (nodes, workspaces, etc.) |
| `POST /api/chat` | Streaming AI chat |
| `POST /api/chat/summarize` | Generate study notes from chat history |

## Documentation

- [Setup & Environment](/docs/apps/server/setup) — Prerequisites, `.env` variables, commands
- [Chat API](/docs/apps/server/chat-api) — Chat and summarization endpoints
