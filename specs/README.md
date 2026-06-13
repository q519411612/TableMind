# TableMind Spec Pack

This directory contains the spec-driven development source of truth for TableMind.

TableMind is an AI DM system for D&D 5e-compatible one-shot adventures. The MVP focuses on a multiplayer room, a structured adventure module, a deterministic rules engine, an SRD compendium, a spoiler guard, and Host oversight.

## Related Product Planning

For the later Web product shell roadmap, see
[`docs/product/tablemind-web-product-architecture/README.md`](../docs/product/tablemind-web-product-architecture/README.md).
That package is planning context and does not replace this spec pack, the PRD,
or the current implementation status.

## How to use these specs

1. Read `docs/PRD.md` for the product-level intent.
2. Read `specs/000-constitution.md` for non-negotiable engineering principles.
3. Read `specs/000-prd-analysis.md` for how the PRD decomposes into implementable slices.
4. Read `docs/open-source-integration-strategy.md` before selecting third-party libraries or copying reference implementations.
5. Use `specs/CODEX_PLAN_PROMPT.md` when asking Codex or another coding agent to produce an implementation plan.
6. Implement specs in dependency order, not numerical order if dependencies differ.

## Spec format

Each feature spec should contain:

- `requirements.md`: user stories, functional requirements, EARS-style acceptance criteria, and explicit non-goals.
- `design.md`: domain model, architecture, APIs/events, storage notes, error cases, and implementation constraints.
- `tasks.md`: small implementation tasks that can be converted into issues or coding-agent work items.

## P0 foundation specs

These specs define the initial implementation base:

| Spec | Purpose |
|---|---|
| `002-project-foundation` | Repository scaffold, tooling, lint/test baseline, environment conventions. |
| `003-domain-model-event-log` | Core types, session state, append-only events, replay model. |
| `006-rules-engine` | Deterministic dice and 5e core checks, attacks, damage, conditions. |
| `007-srd-compendium` | SRD entry model, search interface, attribution metadata, fixture loading. |
| `014-demo-adventure` | Original 5e-compatible demo module used for end-to-end testing. |

## Feature dependency map

```txt
002-project-foundation
  -> 003-domain-model-event-log
      -> 006-rules-engine
      -> 007-srd-compendium
      -> 014-demo-adventure
          -> 004-realtime-room
          -> 005-character-sheet
          -> 008-adventure-importer
              -> 009-ai-dm-orchestrator
                  -> 010-spoiler-guard
                  -> 011-host-panel
                  -> 012-combat-mvp
                  -> 013-session-recap
```

## Implementation principles

- The LLM is not the source of truth for state.
- Dice and rules resolution must be deterministic system tools.
- DM-only content must never be returned through player-facing APIs.
- All important state transitions must be represented as events.
- Host override is a product requirement, not a nice-to-have.
- Core TableMind state, visibility, event log, Host authority, and AI orchestration must remain first-party code; third-party libraries may be used behind stable adapters for dice parsing, compendium ingestion helpers, and optional visual enhancements.
- MVP scope is a short, low-level 5e-compatible one-shot, not a full VTT.

## Recommended first Codex request

Ask Codex to read:

```txt
docs/PRD.md
docs/open-source-integration-strategy.md
specs/000-constitution.md
specs/000-prd-analysis.md
specs/README.md
specs/CODEX_PLAN_PROMPT.md
specs/002-project-foundation/**
specs/003-domain-model-event-log/**
specs/006-rules-engine/**
specs/007-srd-compendium/**
specs/014-demo-adventure/**
```

Then ask it to produce an implementation plan only. Do not ask it to write code in the same pass.

## First milestone recommendation

Milestone 1 should produce:

- A minimal monorepo or app scaffold.
- Shared domain types.
- Event log and state replay skeleton.
- Rules engine dice/check/attack/damage tests.
- SRD compendium fixture loader.
- Demo adventure fixture.
- No production LLM provider integration yet.

## Out of scope for first implementation PR

- Full character builder.
- Full PDF import.
- Full VTT map, fog, lighting, or token movement.
- D&D Beyond integration.
- Commercial D&D book ingestion.
- Complete 5e rules automation.
- Payments, marketplace, public adventure sharing.

## Terminology

- **Host**: the human operator who can review, approve, override, or pause AI DM behavior.
- **AI DM**: the LLM-backed narrator/orchestrator that proposes public narration, rules requests, state patches, and reveals.
- **Rules Engine**: deterministic system code that rolls dice and computes rule results.
- **Session State**: current truth of the room, derived from persisted state and event log.
- **Adventure Module**: structured scenes, NPCs, encounters, clues, secrets, and endings.
- **Compendium**: SRD-derived rule/reference database.
- **Visibility**: content permission layer such as `public`, `dm_only`, `revealed`, or `player_specific`.
