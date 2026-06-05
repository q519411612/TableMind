# 018 MVP-1.0 Live AI Playtest - Tasks

## MVP-1.0A room-aware live AI wrapper

### Context builder

- [x] Add `ai-context-builder` module or equivalent.
- [x] Include Host session snapshot.
- [x] Include current scene with DM-only context for AI only.
- [x] Include unrevealed clues and DM-only secrets for spoiler checking.
- [x] Include relevant recent public history.
- [x] Include active combat state when present.
- [ ] Add context size guard or summary strategy.
- [x] Test context includes required fields and excludes secrets/config values.

### Room-aware runner

- [x] Add `runAiTurnForRoom` or equivalent.
- [x] Load room/adventure context through room service boundaries.
- [x] Call injected AI adapter.
- [x] Validate structured AI response.
- [x] Run spoiler guard.
- [x] Route allowed rule requests through rules engine.
- [x] Commit safe public AI message events.
- [x] Create Host review item for review-required output.
- [x] Return role-aware broadcasts/snapshots.

### Provider config gate

- [x] Add provider config loader with `enabled` default false.
- [x] Require endpoint/apiKey/model only when enabled.
- [x] Add timeout/error handling wrapper.
- [x] Ensure tests use mock provider and do not call network.
- [ ] Document local env variables without committing secrets.

## MVP-1.0B AI eval gates

### Golden AI-turn tests

- [x] Test safe narration auto-commits.
- [x] Test exact DM-only secret blocks output.
- [ ] Test hidden entity alias blocks output.
- [x] Test low confidence requires Host review.
- [x] Test reveal proposal requires Host review.
- [x] Test state patch requires Host review.
- [x] Test fabricated dice results are rejected.
- [x] Test unsupported attack/action request is rejected or review-required.
- [x] Test skill check routes through rules engine with deterministic RNG.
- [x] Test provider disabled returns controlled error.

### Regression protection

- [x] Add no-live-provider default test guard.
- [x] Add player recap no rejected AI output test if not already covered.
- [ ] Add player transport/event stream no AI private payload test.

## MVP-1.0C live playtest finalization

### Playtest docs

- [x] Add `docs/playtests/MVP_1_0_PLAYTEST_CHECKLIST.md`.
- [x] Add `docs/playtests/MVP_1_0_PLAYTEST_REPORT_TEMPLATE.md`.
- [x] Add `docs/playtests/README.md` explaining pass/fail evidence.

### Final acceptance path

- [ ] Add script or documented command sequence for local playtest setup.
- [x] Add final MVP-1.0 acceptance checklist.
- [x] Document known limitations and non-goals.
- [ ] Record completed playtest report before marking MVP-1.0 complete.

## Verification

Latest verification in this workspace used a Node 20+ executable directly because `npm` is not installed.

- [x] Run `node scripts/check-js.mjs`.
- [x] Run `node scripts/run-tests.mjs packages apps tests`.
- [x] Run `node scripts/run-tests.mjs tests/acceptance`.
- [ ] Run `npm run build`; not runnable in this workspace because `npm` is unavailable. The equivalent build script commands passed.

## Deferrals

- [x] Do NOT allow AI direct state mutation.
- [x] Do NOT enable live provider calls in default tests.
- [x] Do NOT commit API keys or secrets.
- [x] Do NOT launch unsupervised public rooms.
- [x] Do NOT implement full campaign memory.
- [x] Do NOT implement full 5e automation.
- [x] Do NOT implement arbitrary PDF import.
