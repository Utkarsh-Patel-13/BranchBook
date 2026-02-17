# BranchBook Web

Main web application for BranchBook — a knowledge workspace where note-taking and AI chat coexist for non-linear exploration.

## Tech Stack

- **Build:** Vite
- **UI:** React 19
- **Routing:** TanStack Router
- **Data:** TanStack Query + tRPC
- **Auth:** Better Auth
- **Editor:** Lexical (rich text)
- **Styling:** Tailwind CSS v4
- **Desktop:** Tauri (optional)

## Development

```bash
# From repo root
bun run dev:web

# Or from apps/web
bun run dev
```

Runs on **port 3001**. Expects the server on port 3000 (auth and tRPC).

## Commands

| Command | Description |
|---------|-------------|
| `bun run dev` | Development server |
| `bun run build` | Production build |
| `bun run serve` | Preview production build |
| `bun run desktop:dev` | Tauri desktop dev |
| `bun run desktop:build` | Tauri desktop build |

## Structure

- `src/routes/` — TanStack Router routes
- `src/components/` — UI components (workspaces, notes, chat, ui)
- `src/hooks/` — React hooks
- `src/stores/` — Zustand stores
- `src/lib/` — Utilities and clients
