# ── Stage 1: install dependencies ────────────────────────────────────────────
FROM oven/bun:1 AS deps
WORKDIR /app

COPY package.json bun.lock turbo.json ./
COPY apps/web/package.json              ./apps/web/package.json
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

# Default to the placeholder so pre-built CI images support runtime injection.
# Pass a real URL via --build-arg to bake it in (e.g. local docker-compose).
ARG VITE_SERVER_URL=__VITE_SERVER_URL__
ENV VITE_SERVER_URL=$VITE_SERVER_URL

COPY . .
RUN cd apps/web && bun run build

# ── Stage 3: production runtime ───────────────────────────────────────────────
FROM oven/bun:1-slim AS runner
WORKDIR /app

RUN bun add -g serve

COPY --from=builder /app/apps/web/dist ./dist
COPY apps/web/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

RUN groupadd --gid 1001 app && \
    useradd --uid 1001 --gid app --shell /bin/false --no-create-home app && \
    chown -R app:app /app

USER app

EXPOSE 3001
ENTRYPOINT ["/docker-entrypoint.sh"]
