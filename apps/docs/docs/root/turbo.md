---
sidebar_position: 2
---

# Turbo

Task orchestration for the monorepo. Config in `turbo.json`.

## Key Tasks

| Task | Behavior |
|------|----------|
| `dev` | Persistent, no cache. Runs app dev servers. |
| `build` | Depends on `^build`. Outputs to `dist/**`, `build/**`. |
| `check-types` | TypeScript. Depends on `^check-types`. |
| `start` | Persistent. Used by docs (`docusaurus start`). |

## Filtering

Run tasks for specific packages:

```bash
turbo -F web dev
turbo -F @branchbook/db db:push
```
