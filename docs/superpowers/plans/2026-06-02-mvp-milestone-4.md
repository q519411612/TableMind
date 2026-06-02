# MVP Milestone 4 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development if subagents are explicitly authorized for the session; otherwise use superpowers:executing-plans. Track work with checklist syntax.

**Goal:** Add mock AI DM orchestration with schema validation, deterministic spoiler checks, rules-engine routing, and Host review queue basics.

**Architecture:** Keep the AI DM orchestrator provider-agnostic and mock-first. Public AI output must be validated, checked by spoiler guard, and either marked broadcast-ready or sent to Host review; rule requests are resolved by deterministic rules helpers, never by AI-provided dice.

**Tech Stack:** JavaScript ESM, Node built-in `node:test`, in-memory room service review queue, no production LLM integration.

---

## Scope

Included:

- `AiDmResponse` schema validation;
- mock AI adapter;
- deterministic spoiler guard for hidden phrases, aliases, unrevealed clue titles, and DM-only secrets;
- skill/ability/save rule request routing through the rules engine;
- Host review queue add/list/update basics;
- simulated Milestone 4 acceptance flow.

Deferred:

- production LLM provider adapter;
- prompt optimization;
- semantic spoiler detection;
- multi-agent orchestration;
- full Host panel UI.

## File Structure

- `packages/spoiler-guard/src/index.mjs`: deterministic spoiler check helpers.
- `packages/spoiler-guard/test/spoiler-guard.test.mjs`: hidden string and alias tests.
- `apps/server/src/ai-dm-orchestrator.mjs`: mock adapter, response validation, rule routing, review decision.
- `apps/server/test/ai-dm-orchestrator.test.mjs`: orchestrator and rule routing tests.
- `apps/server/test/host-review.test.mjs`: review queue access and status tests.
- `tests/acceptance/milestone-4.acceptance.test.mjs`: mock AI orchestration acceptance flow.

## Increment 1: Spoiler Guard

- [x] Write failing tests for safe output, hidden phrase detection, alias detection, unrevealed clue title detection, and secret phrase detection.
- [x] Run spoiler guard tests and confirm missing implementation.
- [x] Implement deterministic spoiler guard.
- [x] Run spoiler guard tests.

## Increment 2: AI DM Mock Orchestration

- [x] Write failing tests for response schema validation, rejecting AI-provided dice results, routing skill checks through rules engine, and risky output requiring review.
- [x] Run orchestrator tests and confirm missing implementation.
- [x] Implement mock adapter, response validation, rule request routing, and review decision.
- [x] Run orchestrator and rules tests.

## Increment 3: Host Review Queue

- [x] Write failing tests for adding review items, Host-only queue access, and approve/reject/edit status changes.
- [x] Run review queue tests and confirm missing implementation.
- [x] Implement review queue helpers in the room service.
- [x] Run review queue and room tests.

## Increment 4: Milestone 4 Acceptance

- [x] Write a simulated flow where mock AI proposes a safe rule request and an unsafe public message.
- [x] Run acceptance and confirm it fails before final integration.
- [x] Wire missing behavior.
- [x] Run full syntax and test verification.

Verification:

```bash
/Users/chenminghui/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/check-js.mjs
/Users/chenminghui/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/run-tests.mjs
```
