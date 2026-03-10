# ── Stage 1: install dependencies ────────────────────────────────────────────
FROM oven/bun:1 AS deps
WORKDIR /app

# Copy workspace manifests first so layer is cached unless deps change
COPY package.json bun.lock turbo.json ./
COPY apps/server/package.json           ./apps/server/package.json
COPY packages/api/package.json          ./packages/api/package.json
COPY packages/auth/package.json         ./packages/auth/package.json
COPY packages/config/package.json       ./packages/config/package.json
COPY packages/db/package.json           ./packages/db/package.json
COPY packages/env/package.json          ./packages/env/package.json
COPY packages/queue/package.json        ./packages/queue/package.json
COPY packages/types/package.json        ./packages/types/package.json
COPY packages/validators/package.json   ./packages/validators/package.json

RUN bun install

# ── Stage 2: build ────────────────────────────────────────────────────────────
FROM deps AS builder
WORKDIR /app

COPY . .

# Generate Prisma client — DATABASE_URL doesn't need to be real for this step.
ARG DATABASE_URL=postgresql://dummy:dummy@localhost:5432/dummy
ENV DATABASE_URL=$DATABASE_URL
RUN cd packages/db && bunx prisma generate

# Bundle the server — tsdown inlines all @branchbook/* workspace packages
RUN cd apps/server && bun run build

# ── Stage 3: production runtime ───────────────────────────────────────────────
# Re-use the deps stage so Bun's workspace symlinks in node_modules stay intact.
# Copying node_modules between stages breaks Bun's internal symlinks.
FROM deps AS runner
WORKDIR /app

ENV NODE_ENV=production

# Bundled server artifact — must live under apps/server/ so Bun's module
# resolution walks up to apps/server/node_modules/ for runtime deps.
COPY --from=builder /app/apps/server/dist ./apps/server/dist

# Prisma schema + migrations for runtime migrate deploy
COPY --from=builder /app/packages/db/prisma ./packages/db/prisma
COPY --from=builder /app/packages/db/prisma.config.ts ./packages/db/prisma.config.ts

COPY apps/server/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["/docker-entrypoint.sh"]
