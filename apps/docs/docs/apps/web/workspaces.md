---
sidebar_position: 2
---

# Workspaces

Workspaces organize hierarchical nodes (notes and chat sessions) in a tree structure.

## Routes

- `/workspaces` — Workspace list
- `/workspaces/:workspaceId` — Workspace detail with node tree
- `/workspaces/:workspaceId/*` — Node-specific views (notes, chat)

## Key Components

- **workspace-sidebar** — Node tree, create/delete, trash
- **workspace-split-layout** — Resizable panels (notes + chat)
- **workspace-layout-storage** — Persists panel sizes in `localStorage`

## Data

Uses tRPC `workspace.*` and `node.*` procedures. Layout state stored client-side via Zustand.
