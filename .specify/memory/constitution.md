<!--
Sync Impact Report
- Version: N/A → 1.0.0
- Modified principles:
  - [PRINCIPLE_1_NAME] → Monorepo architecture & app boundaries
  - [PRINCIPLE_2_NAME] → Type-safe platform & API contracts
  - [PRINCIPLE_3_NAME] → Design system, layout & responsiveness
  - [PRINCIPLE_4_NAME] → State management & data fetching
  - [PRINCIPLE_5_NAME] → Canvas, editor & quality tooling
- Added sections:
  - Architecture & Technology Constraints
  - Development Workflow, Testing & Quality Gates
- Removed sections:
  - None (template placeholders were concretized)
- Templates requiring updates:
  - ✅ .specify/templates/plan-template.md
  - ✅ .specify/templates/spec-template.md
  - ✅ .specify/templates/tasks-template.md
  - ⚠ .specify/templates/commands/* (directory not present in this repo; no command templates to update)
- Follow-up TODOs:
  - None
-->

# BranchBook Constitution

## Core Principles

### Monorepo Architecture & App Boundaries

BranchBook MUST remain a single Turborepo monorepo with clearly defined applications and shared packages.
The primary apps are `apps/web` (web), `apps/native` (mobile/Expo), `apps/server` (API), and optional
desktop targets under `apps/web` (Tauri). Shared domain logic, API contracts, auth, and database
schemas MUST live in `packages/*` and be consumed by apps via package boundaries rather than direct
cross-app imports. Apps MUST NOT import from other apps; all cross-cutting concerns flow through
shared packages. Any new app or package MUST declare its purpose, dependencies, and public surface
area, and MUST not create circular dependencies in the workspace graph.

### Package manager and runtime

BranchBook MUST use `bun` for all commands, be it package management, runtine, execution.

### Type-Safe Platform & API Contracts

TypeScript strict mode (`"strict": true`) MUST be enabled and enforced for every project in the
monorepo. All runtime contracts between client and server MUST be expressed through tRPC routers and
inferred types, Prisma models, or other shared TypeScript types in `packages/api`, `packages/db`,
and related packages. Usage of `any` is prohibited in application logic; `unknown` is allowed only
at true trust boundaries and MUST be narrowed before use. API consumers (web, native, desktop) MUST
use the generated tRPC clients rather than constructing ad-hoc HTTP requests. Changes to shared
types MUST be backwards compatible or treated as breaking changes with explicit migration notes.

### Design System, Layout & Responsiveness

TailwindCSS and shadcn/ui components form the canonical design system for all BranchBook UIs. New UI
components MUST be built using Tailwind utility classes and shadcn primitives unless a justified
exception is documented in the feature spec. Layouts MUST be mobile-first and responsive, with
meaningful breakpoints that ensure all primary workflows are usable on small screens before being
enhanced for larger viewports. Accessibility is non-negotiable: semantics, focus management, and
color contrast MUST be considered for every new component. Rich text editors based on Lexical and
diagram/canvas experiences based on React Flow MUST follow shared patterns for theming, selection,
keyboard interaction, and serialization so that experiences remain consistent across web and native
surfaces where applicable.

### State Management & Data Fetching

React Query (TanStack Query) is the single source of truth for server state in BranchBook applications.
All data fetched from the API MUST flow through typed tRPC procedures wrapped by React Query hooks,
with cache keys, stale times, and invalidation strategies defined near the contract. Zustand is the
standard for local and UI/client state that needs to be shared across components; it MUST NOT be
used to mirror server state that belongs in React Query. Direct `fetch`/XHR calls in components are
forbidden unless they are part of an isolated experiment and explicitly documented. Complex state
flows MUST be modeled in small, focused stores with predictable update paths and tests for
non-trivial behaviors.

### Canvas, Editor & Quality Tooling

Canvas- and editor-heavy experiences (React Flow diagrams, Lexical editors, and similar surfaces)
MUST respect explicit performance and correctness budgets. Canvas flows MUST sustain at least 50
nodes (and associated edges) at interactive frame rates (target 60 fps on a reasonable development
machine) without jank during pan/zoom or selection; performance characteristics MUST be measured and
documented in the feature spec for any new canvas experience. Expensive calculations MUST be
memoized or moved off the critical render path, and React Flow/Lexical integrations MUST use shared
abstractions rather than ad-hoc wiring. Automated tests are REQUIRED for complex editor and canvas
behaviors (selection, undo/redo, persistence) and for all critical business logic. Biome/Ultracite
is the single source of truth for formatting and linting; `bun x ultracite check` MUST pass for all
changes, and the project-wide test suite MUST run cleanly. Each package MUST maintain and, over
time, improve its test coverage; new features MUST NOT introduce uncovered critical paths.

## Architecture & Technology Constraints

BranchBook is built as a modern TypeScript monorepo that combines React, TanStack Router, Fastify,
tRPC, Prisma, Turborepo, Bun, Expo, Tauri, and supporting tooling such as Biome and Husky. New
features MUST integrate with this stack rather than introducing parallel frameworks without strong,
documented justification and approval. Web, native, and desktop apps share business logic through
`packages/*`, with clear ownership boundaries and shared contracts. The API surface is provided by
Fastify + tRPC and backed by Prisma/PostgreSQL; direct database access from apps outside the server
and database packages is forbidden. Authentication flows MUST use the Better-Auth configuration and
shared auth utilities rather than rolling custom solutions per app.

Monorepo tooling (Turborepo pipelines, Husky hooks, Biome, TypeScript project references) MUST
remain green on the main branch. Any change that affects repository-wide tooling (e.g., tsconfig,
Biome configuration, Turborepo pipelines) MUST be reflected in the constitution-aligned quality
gates and captured in the relevant specs and plans.

## Development Workflow, Testing & Quality Gates

All work in BranchBook flows through feature branches with clear plans and specifications under
`/specs/[###-feature-name]/`. Implementation plans MUST include a "Constitution Check" section that
explicitly confirms compliance with the core principles: monorepo boundaries, strict TypeScript,
design system usage, state management patterns, canvas performance budgets where applicable, and
quality tooling (Biome + tests).

Before merge into `main`, the following gates MUST pass:

- TypeScript checks across the monorepo (`bun run check-types` or equivalent) MUST succeed.
- Biome/Ultracite formatting and linting (`bun x ultracite check` or `bun run check`) MUST pass
  with no remaining autofixable errors.
- Automated tests relevant to the change (unit, integration, and contract tests) MUST pass; new
  features MUST include tests for critical paths and regressions.
- For features involving canvases/editors or complex visualizations, performance MUST be measured
  against the canvas budget (50+ nodes at interactive frame rates) and recorded in the spec's
  success criteria.
- For API and data model changes, contract tests MUST validate tRPC procedures and Prisma models
  across server and clients.

Code review is required for all changes and MUST explicitly consider adherence to this constitution,
including monorepo boundaries, type safety, and quality gates. Exceptions (temporary or permanent)
MUST be documented in the feature plan with a clear expiry or follow-up task.

## Governance

This constitution defines the non-negotiable engineering principles for BranchBook and supersedes
individual preferences or ad-hoc practices. All contributors—internal and external—are expected to
understand and follow these rules when designing, implementing, and reviewing changes.

Amendments to this constitution MUST:

- Be proposed via a pull request that clearly describes the motivation and impact.
- Include updates to any affected templates under `.specify/templates/` (plan, spec, tasks, and
  related guidance) so new work automatically aligns with the amended principles.
- Bump the constitution version according to semantic versioning:
  - MAJOR: Backward-incompatible changes to principles or removal of guarantees.
  - MINOR: New principles or sections, or material expansion of existing guidance.
  - PATCH: Clarifications or wording improvements without changing semantics.
- Update dates in the version line, setting "Last Amended" to the date of ratification for the
  change.

Runtime development guidance (coding standards, lint rules, and day-to-day practices) is captured in
`AGENTS.md`, the project `README.md`, and other repo-local docs. Those documents MUST remain
consistent with this constitution; if conflicts arise, this constitution is the source of truth and
other docs MUST be updated accordingly.

**Version**: 1.0.0 | **Ratified**: 2026-02-09 | **Last Amended**: 2026-02-09

