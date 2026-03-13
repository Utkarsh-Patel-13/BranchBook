# BranchBook Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-02-09

## Active Technologies
- TypeScript 5.x, strict mode (`"strict": true`) across all packages + Fastify 5, tRPC v11, Prisma ORM, TanStack Query v5, TanStack Router v1, Zustand v5, Bun runtime, Lexical editor (002-optimize-workspaces)
- PostgreSQL (via Prisma), `localStorage` (client layout state), in-memory `Map` (server-side list cache) (002-optimize-workspaces)
- TypeScript 5.x, strict mode (`"strict": true`), Bun runtime + Fastify 5, tRPC v11, Prisma ORM, TanStack Query v5, TanStack Router v1, Zustand v5, BullMQ v5 (new), Redis 7 (new), Gemini AI SDK (004-context-engine)
- PostgreSQL (via Prisma) — new `context_artifact` table; Redis (BullMQ job persistence) (004-context-engine)
- TypeScript 5.x, strict mode + Fastify 5, tRPC v11, Prisma ORM 7, TanStack Query v5, TanStack Router v1, Zustand v5, Bun runtime, `@ai-sdk/react`, `@ai-sdk/google` (Gemini), AI Elements (shadcn-registry — `bunx ai-elements@latest add suggestion`) (005-convo-branch-suggest)
- No new tables. PostgreSQL (Prisma) for existing node/message data; suggestions are ephemeral client state only. (005-convo-branch-suggest)

- TypeScript 5.x, strict mode enabled across all packages (001-node-chat)

## Project Structure

```text
backend/
frontend/
tests/
```

## Commands

bun test && bun run lint

## Code Style

TypeScript 5.x, strict mode enabled across all packages: Follow standard conventions

## Recent Changes
- 005-convo-branch-suggest: Added TypeScript 5.x, strict mode + Fastify 5, tRPC v11, Prisma ORM 7, TanStack Query v5, TanStack Router v1, Zustand v5, Bun runtime, `@ai-sdk/react`, `@ai-sdk/google` (Gemini), AI Elements (shadcn-registry — `bunx ai-elements@latest add suggestion`)
- 004-context-engine: Added TypeScript 5.x, strict mode (`"strict": true`), Bun runtime + Fastify 5, tRPC v11, Prisma ORM, TanStack Query v5, TanStack Router v1, Zustand v5, BullMQ v5 (new), Redis 7 (new), Gemini AI SDK
- 002-optimize-workspaces: Added TypeScript 5.x, strict mode (`"strict": true`) across all packages + Fastify 5, tRPC v11, Prisma ORM, TanStack Query v5, TanStack Router v1, Zustand v5, Bun runtime, Lexical editor


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
