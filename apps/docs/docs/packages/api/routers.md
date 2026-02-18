---
sidebar_position: 2
---

# Routers

| Router | Purpose |
|--------|---------|
| `workspace` | CRUD, list workspaces |
| `node` | CRUD, tree, move, branch from message |
| `note` | Get/upsert note content (Lexical JSON) |
| `message` | List messages by node |

All procedures use Zod schemas from `@branchbook/validators`. Protected procedures require `ctx.session`.
