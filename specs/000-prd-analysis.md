# PRD Analysis

This document decomposes `docs/PRD.md` into implementation-oriented specs.

## Product thesis

TableMind is not a generic chatbot. It is an AI-assisted tabletop engine where:

- the LLM narrates and orchestrates;
- the rules engine resolves deterministic outcomes;
- the event log records the truth;
- visibility rules prevent spoilers;
- the Host can override the AI.

## MVP thesis

The MVP should prove one thing:

> 2–4 players can complete a 60–90 minute D&D 5e-compatible one-shot with AI DM assistance, deterministic dice/rules, structured adventure state, and Host oversight.

## PRD decomposition

| Area | Spec | MVP priority |
|---|---|---|
| Repo/tooling | `002-project-foundation` | P0 |
| Domain state | `003-domain-model-event-log` | P0 |
| Realtime room | `004-realtime-room` | P1 after foundation |
| Character sheet | `005-character-sheet` | P1 after domain |
| Rules engine | `006-rules-engine` | P0 |
| SRD compendium | `007-srd-compendium` | P0 |
| Adventure importer | `008-adventure-importer` | P1 |
| AI DM orchestration | `009-ai-dm-orchestrator` | P1 |
| Spoiler guard | `010-spoiler-guard` | P1 |
| Host panel | `011-host-panel` | P1 |
| Combat MVP | `012-combat-mvp` | P1 |
| Recap | `013-session-recap` | P2 |
| Demo adventure | `014-demo-adventure` | P0 |

## Foundation first

The initial implementation should not start with UI or LLM integration.

It should start with:

1. domain types
2. event model
3. deterministic dice
4. core 5e rule helpers
5. compendium fixture model
6. demo adventure fixture

This makes later AI behavior testable instead of vibes-driven.

## Key risks from PRD

### Risk 1: AI leaks DM-only information

Mitigation:

- visibility metadata on every adventure entity;
- player-facing APIs filter by role;
- spoiler guard before broadcast;
- Host review queue for risky output.

### Risk 2: AI invents rules or rolls

Mitigation:

- AI only emits rule requests;
- rules engine performs rolls;
- all rolls become events;
- public dice log is derived from events.

### Risk 3: Multiplayer state divergence

Mitigation:

- authoritative server-side session state;
- event log;
- idempotent state patches;
- replay tests;
- websocket broadcast derived from committed events.

### Risk 4: Scope expands into full VTT

Mitigation:

- no full grid/map in MVP;
- no dynamic lighting;
- no complete character builder;
- use text-first room and minimal combat state.

### Risk 5: Copyright/content boundary confusion

Mitigation:

- internal demo uses original adventure text;
- embedded rules limited to SRD/open content;
- user uploads are private room assets;
- no D&D Beyond sync in MVP.

## Recommended first implementation milestone

Milestone 1 should produce a repo that can run tests for:

- dice formulas;
- ability modifier calculation;
- proficiency application;
- ability/skill check resolution;
- attack roll vs AC;
- damage application;
- event append/replay skeleton;
- loading a demo adventure fixture;
- loading a small SRD compendium fixture.

No real LLM provider should be needed for milestone 1.

## Acceptance signal

The first useful output for Codex should be an implementation plan, not code. The plan should explain:

- chosen framework or scaffold;
- package boundaries;
- type layout;
- storage choice for local MVP;
- test framework;
- first PR scope;
- what is intentionally deferred.
