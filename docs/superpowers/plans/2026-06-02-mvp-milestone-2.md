# MVP Milestone 2 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development if subagents are explicitly authorized for the session; otherwise use superpowers:executing-plans. Track work with checklist syntax.

**Goal:** Add a single-room local gameplay skeleton where a Host can create a room, players can join with characters, public messages become committed events, and snapshots are role-aware.

**Architecture:** Keep transport out of scope and implement an in-memory server-authoritative room service in `apps/server`. Reuse `packages/domain` for session state, events, projections, and character validation so later websocket/API layers can wrap the same contracts.

**Tech Stack:** JavaScript ESM, Node built-in `node:test`, in-memory persistence for Milestone 2, no runtime npm dependencies.

---

## Scope

Included:

- local room lifecycle service;
- room creation, join, leave, reconnect, and start session;
- presence tracking;
- public message persistence as domain events;
- role-aware snapshots;
- minimal D&D 5e character creation and validation;
- simulated Milestone 2 acceptance flow.

Deferred:

- actual websocket transport;
- production database persistence;
- public matchmaking;
- auth provider integration;
- full character builder;
- level-up and D&D Beyond import.

## File Structure

- `apps/server/src/room-service.mjs`: in-memory room service with authoritative state and event order.
- `apps/server/test/room-service.test.mjs`: room lifecycle and projection tests.
- `packages/domain/src/index.mjs`: character model helpers and added event handling for player messages/phase changes.
- `packages/domain/test/character.test.mjs`: character validation and creation tests.
- `tests/acceptance/milestone-2.acceptance.test.mjs`: simulated local gameplay acceptance test.

## Increment 1: Character Sheet MVP

- [x] Write failing tests for valid level 1 character creation, derived modifiers/proficiency, invalid ability/HP/AC/attack data, and serialization.
- [x] Run character tests and confirm they fail for missing implementation.
- [x] Implement character validation and creation helpers in `packages/domain`.
- [x] Run character tests and existing Milestone 1 tests.

Verification:

```bash
/Users/chenminghui/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/run-tests.mjs packages/domain/test/character.test.mjs tests/acceptance/milestone-1.acceptance.test.mjs
```

## Increment 2: Local Room Service

- [x] Write failing tests for create, join, leave, reconnect, start, public messages, event ordering, presence, and role-aware snapshots.
- [x] Run room tests and confirm they fail for missing implementation.
- [x] Implement the in-memory room service.
- [x] Run room tests and character tests.

Verification:

```bash
/Users/chenminghui/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/run-tests.mjs apps/server/test/room-service.test.mjs packages/domain/test/character.test.mjs
```

## Increment 3: Milestone 2 Acceptance

- [x] Write a simulated flow where Host creates a room, two players join, one creates a character, Host starts the session, a public message commits, and player snapshots hide DM-only flags.
- [x] Run acceptance and confirm it fails before final integration.
- [x] Wire any missing behavior.
- [x] Run full test and syntax verification.

Verification:

```bash
/Users/chenminghui/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/check-js.mjs
/Users/chenminghui/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/run-tests.mjs
```
