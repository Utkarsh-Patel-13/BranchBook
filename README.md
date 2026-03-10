<div align="center">

# BranchBook

**A workspace where conversations become knowledge.**

Non-linear AI-assisted note-taking where ideas branch naturally —
combining the fluidity of chat with the permanence of structured documentation.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-1.x-fbf0df?logo=bun&logoColor=black)](https://bun.sh/)

</div>

---

## What is BranchBook?

Most note apps force you to organise before you understand. Most AI chat interfaces lose everything the moment you close the tab. BranchBook sits between both: a workspace where notes and AI conversation are equals, exploration branches naturally into subtopics, and every thread becomes structured knowledge you can return to.

**The core idea:**

- Every node is both a chat thread and a note document
- When a conversation drifts into a subtopic, branch it — a child node inherits just enough parent context, no more
- Notes and AI outputs live side by side and flow between each other without copy-pasting
- Navigate your knowledge tree and pick up any thread at any time

---

## Features

- **Dual interface** — Every node has a rich-text note editor and an AI chat panel, side by side
- **Natural branching** — Create child nodes manually or let AI suggest when a subtopic emerges
- **Context isolation** — Each branch carries only the context it needs; unrelated discussions don't contaminate each other
- **Automatic knowledge capture** — Promote AI responses directly into notes; summarise an entire chat thread with one click
- **Context Engine** — Background worker (BullMQ + Redis) that incrementally summarises conversations and assembles inheritable context for child nodes
- **Persistent workspaces** — Everything is saved; navigate back days later and pick up exactly where you left off
- **Authentication** — Email/password and OAuth via Better Auth

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Runtime** | Bun 1.x |
| **Backend** | Fastify 5, tRPC v11 |
| **Frontend** | React 19, TanStack Router v1, TanStack Query v5 |
| **State** | Zustand v5 |
| **Database** | PostgreSQL + Prisma ORM v7 |
| **Job queue** | BullMQ v5 + Redis 7 |
| **Auth** | Better Auth |
| **AI** | Vercel AI SDK + Google Gemini |
| **Editor** | Lexical |
| **Styling** | Tailwind CSS v4 + shadcn/ui |
| **Monorepo** | Turborepo |
| **Code quality** | Biome (via Ultracite) |

---

## Repository Structure

```
branchbook/
├── apps/
│   ├── server/        # Fastify API server
│   └── web/           # React web app (Vite)
├── packages/
│   ├── api/           # tRPC routers and services
│   ├── auth/          # Better Auth configuration
│   ├── config/        # Shared constants and base tsconfig
│   ├── db/            # Prisma schema, migrations, client
│   ├── env/           # Environment variable validation (t3-env + Zod)
│   ├── queue/         # BullMQ job types
│   ├── types/         # Shared TypeScript types
│   └── validators/    # Shared Zod validators
└── docker-compose.yml
```

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) ≥ 1.3 — `curl -fsSL https://bun.sh/install | bash`
- [Docker](https://docs.docker.com/get-docker/) — for running PostgreSQL and Redis
- A [Google Generative AI](https://ai.google.dev/) API key

---

## Running Manually

### 1. Clone and install dependencies

```sh
git clone https://github.com/Utkarsh-Patel-13/BranchBook.git
cd BranchBook
bun install
```

### 2. Configure environment variables

```sh
cp .env.example apps/server/.env
```

Open `apps/server/.env` and fill in the required values (see [Environment Variables](#environment-variables) below).

Create the frontend env file:

```sh
echo "VITE_SERVER_URL=http://localhost:3000" > apps/web/.env
```

### 3. Start infrastructure (PostgreSQL + Redis)

```sh
bun db:start
```

This starts a Postgres container on port `5432` and a Redis container on port `6379` using the compose file in `packages/db`.

### 4. Run database migrations

```sh
bun db:migrate
```

### 5. Start the dev servers

```sh
bun dev:ws
```

| Service | URL |
|---|---|
| Web app | http://localhost:3001 |
| API server | http://localhost:3000 |
| Prisma Studio | `bun db:studio` → http://localhost:5555 |

---

## Running with Docker

Docker Compose bundles the full stack — app, API, Postgres, and Redis — into a single command.

### Build and run from source

```sh
# 1. Copy and edit the environment file
cp .env.example .env
#    Required: BETTER_AUTH_SECRET, GOOGLE_GENERATIVE_AI_API_KEY, VITE_SERVER_URL

# 2. Build images and start everything
docker compose up --build
```

| Service | URL |
|---|---|
| Web app | http://localhost:3001 |
| API server | http://localhost:3000 |

Database migrations run automatically on backend startup. To stop:

```sh
docker compose down           # stop containers
docker compose down -v        # stop and delete all data
```

### Self-hosting with pre-built images

Images are published to the GitHub Container Registry on every push to `main`. No need to clone the repository — just download two files and run.

```sh
# 1. Download the compose file and env template
curl -fsSL https://raw.githubusercontent.com/Utkarsh-Patel-13/BranchBook/main/docker-compose.prod.yml -o docker-compose.prod.yml
curl -fsSL https://raw.githubusercontent.com/Utkarsh-Patel-13/BranchBook/main/.env.example -o .env

# 2. Set the required secrets in .env
#    BETTER_AUTH_SECRET  — random string, min 32 chars (e.g. openssl rand -hex 32)
#    GOOGLE_GENERATIVE_AI_API_KEY — from https://ai.google.dev/
nano .env   # or use your editor of choice

# 3. Start everything
docker compose -f docker-compose.prod.yml up -d
```

| Service | URL |
|---|---|
| Web app | http://localhost:3001 |
| API server | http://localhost:3000 |

Database migrations run automatically on first startup.

**To update to the latest release:**

```sh
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

**To stop and remove all data:**

```sh
docker compose -f docker-compose.prod.yml down -v
```

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `POSTGRES_PASSWORD` | No | `password` | Password for the managed Postgres container |
| `BETTER_AUTH_SECRET` | Yes | — | Session signing secret, min 32 characters |
| `BETTER_AUTH_URL` | Yes | — | Publicly accessible URL of the backend |
| `CORS_ORIGIN` | Yes | — | Frontend origin sent in CORS headers |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Yes | — | Google Generative AI API key |
| `REDIS_HOST` | No | `localhost` | Redis hostname |
| `REDIS_PORT` | No | `6379` | Redis port |
| `CONTEXT_SUMMARY_THRESHOLD` | No | `5` | Messages before context summarisation triggers |
| `CONTEXT_TOKEN_BUDGET` | No | `2000` | Max tokens in assembled node context |
| `CONTEXT_STALENESS_HOURS` | No | `24` | Hours before context is rebuilt |
| `VITE_SERVER_URL` | Yes | — | Backend URL as seen from the browser |

See `.env.example` for a ready-to-edit template.

---

## Available Scripts

Run from the repository root with `bun`:

```sh
bun dev:ws        # Backend + web frontend (hot reload)
bun dev           # All apps in parallel
bun db:start      # Start Postgres + Redis via Docker
bun db:stop       # Stop infrastructure containers
bun db:migrate    # Run Prisma migrations (dev)
bun db:push       # Push schema without migrations (rapid prototyping)
bun db:studio     # Open Prisma Studio at http://localhost:5555
bun check         # Lint and format check
bun fix           # Auto-fix lint and formatting issues
```

---

## Contributing

Contributions are welcome. Please follow the standard fork-and-PR flow:

1. Fork the repository and create a branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Run `bun fix` to auto-fix any lint or formatting issues
4. Commit and push your branch, then open a Pull Request against `main`

### Code conventions

- **Strict TypeScript** — `strict: true` is enforced across all packages; avoid `any`
- **Bun only** — all package management and scripts use `bun`; do not use npm or yarn
- **Monorepo layout** — shared logic belongs in `packages/`, application code in `apps/`
- **Formatting** — [Biome](https://biomejs.dev/) via [Ultracite](https://ultracite.dev/) handles all linting and formatting automatically

---

## License

[MIT](./LICENSE) © 2026 Utkarsh Patel
