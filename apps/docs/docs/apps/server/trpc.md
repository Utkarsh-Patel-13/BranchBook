---
sidebar_position: 4
---

# tRPC

All tRPC procedures are mounted at `/trpc`. Uses Fastify adapter and Better Auth for session context.

## Routers

| Router | Procedures |
|--------|------------|
| `workspace` | CRUD, list |
| `node` | CRUD, tree, move, branch |
| `note` | Get, upsert |
| `message` | List by node |

## Context

`createContext` injects `session` (from Better Auth) and `logger` into all protected procedures.

## Usage (Client)

Web app uses `@branchbook/api` with TanStack Query integration. See `src/utils/trpc.ts` for client setup.
