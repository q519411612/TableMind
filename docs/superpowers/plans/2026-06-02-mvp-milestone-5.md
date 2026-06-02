# MVP Milestone 5 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development if subagents are explicitly authorized for the session; otherwise use superpowers:executing-plans. Track work with checklist syntax.

**Goal:** Add enough combat and Host override controls to run the demo adventure's simple encounter through authoritative events.

**Architecture:** Keep combat orchestration in `apps/server/src/room-service.mjs`, deterministic math in `packages/rules-engine`, and event application in `packages/domain`. Combat starts from the loaded adventure encounter plus compendium monster data; attacks and damage are resolved by the rules engine and committed as events.

**Tech Stack:** JavaScript ESM, Node built-in `node:test`, in-memory room service, deterministic random sources.

---

## Scope

Included:

- start combat from the demo encounter;
- roll deterministic initiative and expose the current turn;
- resolve attack and damage through rules-engine helpers;
- update combatant HP and defeated status;
- advance and end combat through committed events;
- Host override controls for HP, conditions, and AI pause/resume.

Deferred:

- grid movement;
- opportunity attacks and reactions;
- full spell automation;
- advanced monster AI;
- rich Host panel UI.

## File Structure

- `packages/domain/src/index.mjs`: combat event validation/application for combat state.
- `apps/server/src/room-service.mjs`: combat lifecycle and Host override helpers.
- `apps/server/test/combat-runtime.test.mjs`: combat start, attack, damage, turn, end tests.
- `apps/server/test/host-controls.test.mjs`: Host override and AI pause/resume tests.
- `tests/acceptance/milestone-5.acceptance.test.mjs`: simulated combat and Host control acceptance flow.

## Increment 1: Combat Runtime

- [x] Write failing tests for start combat, initiative order, current turn, attack/damage update, defeated combatant handling, turn advance, and combat end.
- [x] Run tests and confirm missing combat service APIs.
- [x] Implement combat event application and room service combat helpers.
- [x] Run combat tests and rules tests.

## Increment 2: Host Controls

- [x] Write failing tests for Host HP patch, condition patch, AI pause/resume, and player forbidden access.
- [x] Run tests and confirm missing Host control APIs.
- [x] Implement Host override helpers through committed events or auditable state patches.
- [x] Run Host control and room tests.

## Increment 3: Milestone 5 Acceptance

- [x] Write a simulated flow where Host starts combat, a player defeats a scavenger, Host patches HP/condition, pauses AI, and ends combat.
- [x] Run acceptance and confirm it fails before final integration.
- [x] Wire missing behavior.
- [x] Run full syntax and test verification.

Verification:

```bash
/Users/chenminghui/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/check-js.mjs
/Users/chenminghui/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/run-tests.mjs
```
