---
sidebar_position: 3
---

# Context

`createContext` is called per tRPC request. It injects:

- **session** — Better Auth session (or null)
- **logger** — Fastify logger instance

The server passes Fastify request headers to Better Auth for session resolution.
