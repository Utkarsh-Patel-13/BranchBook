---
sidebar_position: 3
---

# Tooling

## Ultracite (Biome)

Linting and formatting. Zero-config preset.

```bash
bun run fix    # Auto-fix
bun run check  # Report only
```

## Husky

Git hooks. Pre-commit runs `lint-staged` (Ultracite fix on staged files).

## Package Manager

Bun workspaces. Install from root: `bun install`.
