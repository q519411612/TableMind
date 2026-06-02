# MVP Milestone 6 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development if subagents are explicitly authorized for the session; otherwise use superpowers:executing-plans. Track work with checklist syntax.

**Goal:** Add deterministic session recap generation and a full local playtest acceptance flow for the MVP one-shot.

**Architecture:** Keep recap generation in `packages/session-recap`, using committed events plus final room state and adventure data. Player recaps use revealed/public data only; Host recaps may include unresolved hidden clues and secrets for follow-up or debugging.

**Tech Stack:** JavaScript ESM, Node built-in `node:test`, deterministic recap generation, no AI prose polishing.

---

## Scope

Included:

- player-safe recap from event log and final state;
- Host recap with unresolved hidden clues and secrets;
- timeline, key rolls, discovered clues, combat outcomes, character states, rewards, and Markdown export;
- real AI provider adapter boundary behind an explicit feature flag;
- full local playtest acceptance across room, adventure, mock AI, rules, combat, Host override, and recap.

Deferred:

- UI polish;
- AI prose polishing;
- campaign wiki;
- production websocket and persistence.

## File Structure

- `packages/session-recap/src/index.mjs`: deterministic recap generator.
- `packages/session-recap/test/session-recap.test.mjs`: player/Host recap tests.
- `apps/server/src/provider-ai-adapter.mjs`: feature-flagged provider adapter boundary.
- `apps/server/test/provider-ai-adapter.test.mjs`: provider adapter feature flag and structured response tests.
- `tests/acceptance/mvp-local-playtest.acceptance.test.mjs`: complete local one-shot flow.

## Increment 1: Session Recap

- [x] Write failing tests for timeline, key rolls, discovered clues, combat outcomes, player-safe filtering, Host unresolved threads, and Markdown export.
- [x] Run recap tests and confirm missing implementation.
- [x] Implement deterministic recap generator.
- [x] Run recap tests and milestone acceptance tests.

## Increment 2: Full Local Playtest

- [x] Write a simulated flow with Host, two players, character creation, adventure start, mock AI check request, clue reveal, combat, Host override, ending, and recap.
- [x] Run acceptance and confirm it fails before final integration.
- [x] Wire missing behavior.
- [x] Run full syntax and test verification.

## Increment 3: Provider Adapter Boundary

- [x] Write failing tests for a disabled provider adapter and structured provider response validation.
- [x] Run adapter tests and confirm missing implementation.
- [x] Implement feature-flagged provider adapter with injected fetch.
- [x] Run adapter tests and full verification.

Verification:

```bash
/Users/chenminghui/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/check-js.mjs
/Users/chenminghui/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/run-tests.mjs
```
