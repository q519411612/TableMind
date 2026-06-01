# MVP Milestone 1 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development if subagents are explicitly authorized for the session; otherwise use superpowers:executing-plans. Track work with checklist syntax.

**Goal:** Build the first runnable TableMind MVP foundation without production UI or LLM integration.

**Architecture:** Use a dependency-light ESM workspace so domain logic, rules, compendium data, and adventure fixtures can be tested with Node's built-in test runner. Keep state authority in `packages/domain`, deterministic game math in `packages/rules-engine`, content lookup in `packages/compendium`, and demo parsing/loading in `packages/adventure-loader`.

**Tech Stack:** JavaScript ESM, Node built-in `node:test`, JSON/Markdown fixtures, no runtime npm dependencies for the first milestone.

---

## Scope

Included:

- repository scaffolding and runnable scripts;
- event-backed domain state and role-aware projections;
- deterministic dice/check/attack/damage helpers;
- small SRD/original compendium fixtures with source metadata;
- original demo adventure Markdown fixture and loader;
- simulated acceptance tests for the milestone exit criteria.

Deferred:

- production web UI;
- production API/websocket server;
- authentication;
- real LLM provider integration;
- PDF import;
- full SRD ingestion;
- full spell/class automation;
- tactical grid/VTT features.

## File Structure

- `package.json`: workspace metadata and command documentation.
- `scripts/run-tests.mjs`: dependency-free test runner wrapper around Node's built-in test runner.
- `apps/web/README.md`: placeholder web app boundary.
- `apps/server/README.md`: placeholder server app boundary.
- `packages/domain/src/index.mjs`: session state, event validation/replay, projections.
- `packages/domain/test/domain.test.mjs`: domain unit tests.
- `packages/rules-engine/src/index.mjs`: deterministic dice and MVP 5e helpers.
- `packages/rules-engine/test/rules-engine.test.mjs`: rules unit tests.
- `packages/compendium/src/index.mjs`: entry validation, fixture loading, keyword search.
- `packages/compendium/test/compendium.test.mjs`: compendium unit tests.
- `packages/adventure-loader/src/index.mjs`: structured Markdown parser and fixture loader.
- `packages/adventure-loader/test/adventure-loader.test.mjs`: adventure loader unit tests.
- `packages/shared-test-fixtures/compendium/srd-mini.json`: tiny licensed/open fixture set.
- `packages/shared-test-fixtures/adventures/the-lantern-beneath-the-hill.md`: original demo adventure.
- `tests/acceptance/milestone-1.acceptance.test.mjs`: simulated acceptance test for Milestone 1.

## Increment 1: Repository Foundation

- [x] Write failing simulated acceptance checks for documented scripts, package directories, app placeholders, and fixture directories.
- [x] Run the acceptance test and confirm it fails because the foundation does not exist.
- [x] Add minimal scaffolding and test runner.
- [x] Run foundation acceptance and confirm it passes.

Verification:

```bash
/Users/chenminghui/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/run-tests.mjs tests/acceptance/milestone-1.acceptance.test.mjs
```

## Increment 2: Domain Event Log

- [x] Write failing tests for deterministic replay, invalid event rejection, clue reveal, scene change, stored dice events, and player-safe projections.
- [x] Run domain tests and confirm they fail for missing implementation.
- [x] Implement domain state, event validation/application, replay, and projection.
- [x] Run domain tests and the milestone acceptance test.

Verification:

```bash
/Users/chenminghui/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/run-tests.mjs packages/domain/test/domain.test.mjs tests/acceptance/milestone-1.acceptance.test.mjs
```

## Increment 3: Rules Engine

- [x] Write failing tests for dice formulas, RNG injection, ability modifiers, proficiency, checks, saves, initiative sorting, attacks, damage, healing, and conditions.
- [x] Run rules tests and confirm they fail for missing implementation.
- [x] Implement deterministic rules helpers behind TableMind-owned result objects.
- [x] Run rules tests and the milestone acceptance test.

Verification:

```bash
/Users/chenminghui/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/run-tests.mjs packages/rules-engine/test/rules-engine.test.mjs tests/acceptance/milestone-1.acceptance.test.mjs
```

## Increment 4: Compendium Fixtures

- [x] Write failing tests for entry validation, source/license metadata, allowlist enforcement, fixture loading, keyword search, and attribution output.
- [x] Run compendium tests and confirm they fail for missing implementation.
- [x] Add compendium loader and tiny SRD/original fixtures.
- [x] Run compendium tests and the milestone acceptance test.

Verification:

```bash
/Users/chenminghui/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/run-tests.mjs packages/compendium/test/compendium.test.mjs tests/acceptance/milestone-1.acceptance.test.mjs
```

## Increment 5: Demo Adventure Fixture

- [x] Write failing tests for loading the original demo adventure, required metadata, scenes, NPCs, clues, encounter, endings, and DM-only truth separation.
- [x] Run adventure tests and confirm they fail for missing implementation.
- [x] Add the structured Markdown fixture and loader.
- [x] Run adventure tests and the milestone acceptance test.

Verification:

```bash
/Users/chenminghui/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/run-tests.mjs packages/adventure-loader/test/adventure-loader.test.mjs tests/acceptance/milestone-1.acceptance.test.mjs
```

## Completion Verification

- [x] Run the full test suite.
- [x] Review the diff against the plan and source specs.
- [x] Run an independent review pass before reporting completion.

Verification:

```bash
/Users/chenminghui/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/run-tests.mjs
git status --short
git diff --stat main...
```
