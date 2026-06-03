# 018 MVP-1.0 Live AI Playtest - Tasks

## MVP-1.0A room-aware live AI wrapper

### Context builder

- [ ] Add `ai-context-builder` module or equivalent.
- [ ] Include Host session snapshot.
- [ ] Include current scene with DM-only context for AI only.
- [ ] Include unrevealed clues and DM-only secrets for spoiler checking.
- [ ] Include relevant recent public history.
- [ ] Include active combat state when present.
- [ ] Add context size guard or summary strategy.
- [ ] Test context includes required fields and excludes secrets/config values.

### Room-aware runner

- [ ] Add `runAiTurnForRoom` or equivalent.
- [ ] Load room/adventure context through room service boundaries.
- [ ] Call injected AI adapter.
- [ ] Validate structured AI response.
- [ ] Run spoiler guard.
- [ ] Route allowed rule requests through rules engine.
- [ ] Commit safe public AI message events.
- [ ] Create Host review item for review-required output.
- [ ] Return role-aware broadcasts/snapshots.

### Provider config gate

- [ ] Add provider config loader with `enabled` default false.
- [ ] Require endpoint/apiKey/model only when enabled.
- [ ] Add timeout/error handling wrapper.
- [ ] Ensure tests use mock provider and do not call network.
- [ ] Document local env variables without committing secrets.

## MVP-1.0B AI eval gates

### Golden AI-turn tests

- [ ] Test safe narration auto-commits.
- [ ] Test exact DM-only secret blocks output.
- [ ] Test hidden entity alias blocks output.
- [ ] Test low confidence requires Host review.
- [ ] Test reveal proposal requires Host review.
- [ ] Test state patch requires Host review.
- [ ] Test fabricated dice results are rejected.
- [ ] Test unsupported attack/action request is rejected or review-required.
- [ ] Test skill check routes through rules engine with deterministic RNG.
- [ ] Test provider disabled returns controlled error.

### Regression protection

- [ ] Add no-live-provider default test guard.
- [ ] Add player recap no rejected AI output test if not already covered.
- [ ] Add player transport/event stream no AI private payload test.

## MVP-1.0C live playtest finalization

### Playtest docs

- [ ] Add `docs/playtests/MVP_1_0_PLAYTEST_CHECKLIST.md`.
- [ ] Add `docs/playtests/MVP_1_0_PLAYTEST_REPORT_TEMPLATE.md`.
- [ ] Add `docs/playtests/README.md` explaining pass/fail evidence.

### Final acceptance path

- [ ] Add script or documented command sequence for local playtest setup.
- [ ] Add final MVP-1.0 acceptance checklist.
- [ ] Document known limitations and non-goals.
- [ ] Record completed playtest report before marking MVP-1.0 complete.

## Verification

- [ ] Run `npm run check`.
- [ ] Run `npm test`.
- [ ] Run `npm run acceptance`.
- [ ] Run `npm run build`.

## Deferrals

- [ ] Do NOT allow AI direct state mutation.
- [ ] Do NOT enable live provider calls in default tests.
- [ ] Do NOT commit API keys or secrets.
- [ ] Do NOT launch unsupervised public rooms.
- [ ] Do NOT implement full campaign memory.
- [ ] Do NOT implement full 5e automation.
- [ ] Do NOT implement arbitrary PDF import.
