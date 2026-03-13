<div align="center">

# BranchBook

**Turn AI conversations into structured knowledge — naturally.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-1.x-fbf0df?logo=bun&logoColor=black)](https://bun.sh/)

</div>

---

## The Problem

AI chat is great for exploring ideas — but it's terrible at keeping them. Every conversation is flat, linear, and forgotten the moment you close the tab. You end up re-explaining context, losing threads, and never actually building on what you've learned.

Note apps have the opposite problem: they force you to organize before you even understand what you're thinking.

## What BranchBook Does

BranchBook is a **thinking environment** that combines AI chat with a living note editor inside a structured workspace.

You chat to explore. When the conversation drifts into a subtopic deep enough to deserve its own space, BranchBook suggests branching it off — a child node that inherits just enough context from the parent, and no more. The main thread stays clean. The deeper idea gets room to breathe.

As you go, you can distill any conversation into a structured note with one click. Over time, you're not left with a pile of forgotten chats — you have an organized, navigable map of everything you've thought through.

> **In short:** BranchBook is where ideas stop getting lost.

---

## Demo

https://github.com/Utkarsh-Patel-13/BranchBook/raw/main/demo.mp4

> *Demo video coming soon.*

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Running with Docker](#running-with-docker)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [Contributing](#contributing)
- [License](#license)

---

## Features

| | Feature | What it means |
|---|---|---|
| 🌿 | **Branching conversations** | Split any chat thread into a child node. The branch inherits summarized context from the parent — no re-explaining, no noise. |
| 📝 | **Chat + Notes, side by side** | Every node has a rich-text note editor paired with an AI chat panel. They're equals, not an afterthought. |
| ✨ | **AI suggestions** | After a few turns, BranchBook surfaces follow-up questions and branch suggestions — when they're useful, invisible when they're not. |
| 🧠 | **Context Engine** | A background worker incrementally summarizes conversations and assembles inheritable context for child nodes, so the AI always knows where it is without being burdened by full history. |
| 📄 | **One-click summaries** | Promote an entire AI conversation into a structured note. No copy-pasting. |
| 📤 | **Note export** | Export notes to PDF directly from the editor. |
| 🔒 | **Persistent workspaces** | Everything is saved. Come back days later and pick up any thread exactly where you left off. |
| 🔐 | **Authentication** | Email/password and OAuth via Better Auth. |

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

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) ≥ 1.3 — `curl -fsSL https://bun.sh/install | bash`
- [Docker](https://docs.docker.com/get-docker/) — for running PostgreSQL and Redis
- A [Google Generative AI](https://ai.google.dev/) API key

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
nano .env

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
