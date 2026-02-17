---
sidebar_position: 2
---

# Server Setup

## Prerequisites

- Bun 1.3+
- PostgreSQL (or `bun run db:start` from root)
- [Google Generative AI API key](https://aistudio.google.com/apikey) (for chat and summarization)

## Environment Variables

Create `.env` from `.env.example` in `apps/server`:

| Variable | Description |
|----------|-------------|
| `BETTER_AUTH_SECRET` | Secret for auth session signing |
| `BETTER_AUTH_URL` | Full server URL (e.g. `http://localhost:3000`) |
| `CORS_ORIGIN` | Frontend origin (e.g. `http://localhost:3001`) |
| `DATABASE_URL` | PostgreSQL connection string |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Gemini API key |

## Commands

```bash
# From repo root
bun run dev:server

# From apps/server
bun run dev    # Development with hot reload
bun run build  # Build to dist/
bun run compile # Single Bun executable
```

## Database

Ensure PostgreSQL is running and migrations are applied:

```bash
bun run db:push   # Push schema
bun run db:migrate # Run migrations
```
