# TableMind

TableMind is an AI DM system for D&D 5e-compatible one-shot adventures.

The MVP is intentionally narrow: help 2-4 players complete a 60-90 minute short adventure with a structured adventure module, deterministic rules resolution, spoiler-safe player views, and Host oversight.

## Current status

This repository is in the foundation phase. The product requirements and implementation specs live in `docs/` and `specs/`. The first implementation milestone focuses on a testable TypeScript monorepo scaffold and core package boundaries, not production UI or real LLM integration.

## MVP principles

- The LLM is not the source of truth for game state.
- Dice rolls and rules resolution are deterministic system operations.
- DM-only information must not leak through player-facing views.
- Important gameplay changes are represented as events.
- Host review and override are required MVP capabilities.
- MVP scope is a short text-first one-shot, not a full VTT.

## Repository layout

```txt
apps/
  web/       Placeholder for the player room and Host panel UI.
  server/    Placeholder for realtime room, persistence, and orchestration.
packages/
  domain/                Shared state, event, visibility, and projection contracts.
  rules-engine/          Deterministic dice and core 5e-compatible helpers.
  compendium/            SRD/open-content entry contracts and fixture search helpers.
  adventure-loader/      Structured adventure module contracts and loader helpers.
  shared-test-fixtures/  Small reusable fixtures for tests and future playtest flows.
docs/                    Product docs and implementation strategy.
specs/                   Spec-driven development source of truth.
```

## Reading order

Start here when planning implementation work:

1. `docs/PRD.md`
2. `docs/open-source-integration-strategy.md`
3. `specs/README.md`
4. `specs/000-constitution.md`
5. `specs/000-prd-analysis.md`
6. `specs/SPEC_MATRIX.md`
7. `specs/CODEX_PLAN_PROMPT.md`

For the first implementation milestone, also read:

- `specs/002-project-foundation/**`
- `specs/003-domain-model-event-log/**`
- `specs/006-rules-engine/**`
- `specs/007-srd-compendium/**`
- `specs/014-demo-adventure/**`

## Local setup

```bash
pnpm install
pnpm typecheck
pnpm test
pnpm lint
pnpm build
```

The foundation packages are intentionally small. They exist to lock in package boundaries, compiler settings, and deterministic test flow before AI orchestration and realtime gameplay are added.

## First milestone scope

The first milestone should produce:

- monorepo/app scaffold;
- shared domain types;
- event log and replay skeleton;
- deterministic dice utilities and rules-engine tests;
- SRD compendium fixture loader contract;
- demo adventure fixture shell;
- no production LLM provider integration.

## Explicitly out of scope for foundation work

- Production LLM provider integration.
- Full UI implementation.
- Authentication and accounts.
- PDF import.
- Full SRD ingestion.
- Full D&D 5e automation.
- Marketplace or public adventure sharing.
- Full VTT map, lighting, or token movement.

## Third-party dependency policy

Third-party libraries must stay behind TableMind-owned adapters when they touch dice, rules, content ingestion, AI orchestration, or gameplay state. GPL/AGPL VTT projects are reference-only unless the project intentionally adopts compatible open-source obligations.

Record runtime dependencies and embedded content sources in `THIRD_PARTY_NOTICES.md`.
