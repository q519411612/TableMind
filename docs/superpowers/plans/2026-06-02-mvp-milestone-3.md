# MVP Milestone 3 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development if subagents are explicitly authorized for the session; otherwise use superpowers:executing-plans. Track work with checklist syntax.

**Goal:** Add adventure execution runtime support so a Host can load the demo adventure into a room and participants receive role-aware current scene, clue, NPC, and secret projections.

**Architecture:** Keep parsing in `packages/adventure-loader` and room authority in `apps/server`. The room service stores the approved adventure module for the room and exposes viewer-specific adventure snapshots derived from the committed session state.

**Tech Stack:** JavaScript ESM, Node built-in `node:test`, in-memory runtime storage for Milestone 3, no runtime npm dependencies.

---

## Scope

Included:

- Host loads a parsed demo adventure into a room;
- room exposes the current scene;
- Host adventure snapshot includes DM-only truth, scene notes, and hidden clues;
- player adventure snapshot excludes DM-only truth, scene notes, and unrevealed clues;
- clue reveal uses committed domain events and updates player projections.

Deferred:

- production adventure upload UI;
- arbitrary Markdown authoring UX;
- PDF import;
- public module publishing;
- AI orchestration over the loaded adventure.

## File Structure

- `apps/server/src/room-service.mjs`: adventure module load, adventure projection, clue reveal helpers.
- `apps/server/test/adventure-runtime.test.mjs`: targeted adventure runtime tests.
- `tests/acceptance/milestone-3.acceptance.test.mjs`: simulated Host/player adventure execution flow.

## Increment 1: Adventure Runtime Projection

- [x] Write failing tests for loading a demo adventure, Host current scene visibility, player-safe current scene visibility, and clue reveal projection.
- [x] Run tests and confirm they fail for missing room service API.
- [x] Implement room service adventure runtime helpers.
- [x] Run adventure runtime tests and previous room tests.

Verification:

```bash
/Users/chenminghui/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/run-tests.mjs apps/server/test/adventure-runtime.test.mjs apps/server/test/room-service.test.mjs
```

## Increment 2: Milestone 3 Acceptance

- [x] Write a simulated flow where Host loads the demo adventure, inspects the current scene, player receives a safe scene projection, Host reveals a clue, and player receives the revealed clue.
- [x] Run acceptance and confirm it fails before final integration.
- [x] Wire missing behavior.
- [x] Run full syntax and test verification.

Verification:

```bash
/Users/chenminghui/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/check-js.mjs
/Users/chenminghui/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/run-tests.mjs
```
