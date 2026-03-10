# BranchBook Server

Backend API server for BranchBook. Handles authentication, tRPC procedures, and AI-powered chat with streaming and conversation summarization.

## Tech Stack

- **Runtime:** Bun
- **HTTP:** Fastify
- **API:** tRPC v11
- **Auth:** Better Auth
- **Database:** Prisma (PostgreSQL)
- **AI:** Vercel AI SDK + Google Gemini

## Development

### Prerequisites

- Bun 1.3+
- PostgreSQL (or use `bun run db:start` from root)
- [Google Generative AI API key](https://aistudio.google.com/apikey)

### Environment

Copy `.env.example` to `.env` and fill in values:

```bash
cp .env.example .env
```

| Variable | Description |
|----------|-------------|
| `BETTER_AUTH_SECRET` | Secret for auth session signing |
| `BETTER_AUTH_URL` | Full URL of the server (e.g. `http://localhost:3000`) |
| `CORS_ORIGIN` | Frontend origin (e.g. `http://localhost:3001`) |
| `DATABASE_URL` | PostgreSQL connection string |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Gemini API key for chat and summarization |

### Commands

```bash
# From repo root
bun run dev:server

# Or from apps/server
bun run dev
```

Server runs on port **3000**.

### Build

```bash
bun run build    # Outputs to dist/
bun run compile  # Single executable via Bun
```

## API Overview

### Auth

- **`/api/auth/*`** — Better Auth handlers (session, sign-in, sign-out, etc.)

### tRPC

- **`/trpc/*`** — All tRPC procedures (nodes, workspaces, etc.)

### REST

- **`GET /`** — Health check (`OK`)
- **`POST /api/chat`** — Streaming AI chat (requires auth)
- **`POST /api/chat/summarize`** — Generate study notes from a node's chat history (requires auth)

## Architecture

- **Rate limiting:** 100 requests/min per IP
- **CORS:** Localhost origins allowed; others rejected
- **Chat:** Uses inherited context from node tree for workspace-aware conversations
- **Summarization:** Per-message summaries feed into draft; resummarization job compresses to detailed + high-level when threshold is reached
