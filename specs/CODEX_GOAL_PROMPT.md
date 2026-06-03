# Codex `/goal` Prompt for MVP-0.7 to MVP-1.0

Use this prompt when running Codex `/goal` for TableMind after the local MVP hardening pass.

## Copy-paste prompt

```txt
/goal You are working on TableMind, an AI DM system for D&D 5e-compatible one-shot adventures.

First read and obey:
- docs/PRD.md
- docs/open-source-integration-strategy.md
- specs/README.md
- specs/000-constitution.md
- specs/000-prd-analysis.md
- specs/SPEC_MATRIX.md
- specs/SPEC_MATRIX_MVP_0_7_TO_1_0.md
- specs/GOAL_ACCEPTANCE_GATES.md
- docs/roadmaps/MVP_0_7_to_1_0.md

Then read the active milestone spec directory named in this goal.

Implement only the active milestone slice. Do not implement later milestone slices unless a tiny interface stub is required and explicitly documented as a deferral.

Non-negotiable invariants:
- The LLM is not the source of truth.
- Dice and rules are deterministic system operations.
- Player views, player event streams, player API responses, and player recaps must not include dm_only or Host-only content.
- Host review is mandatory for risky AI output, reveal proposals, state patch proposals, and low-confidence responses.
- All important session state transitions must be committed typed events where the active spec requires them.
- Keep business logic in domain/room/command modules, not in UI or HTTP handlers.
- Do not add live provider network calls to default tests.
- Do not commit secrets.

Required workflow:
1. Restate the active milestone slice and its non-goals.
2. Inspect current code and tests.
3. Implement the smallest coherent change set.
4. Add or update unit/acceptance tests.
5. Run npm run check, npm test, npm run acceptance, and npm run build.
6. Final report must include: Scope implemented, Files changed, Tests added/updated, Commands run, Acceptance criteria satisfied, Deferred work, Known risks.
```

## First recommended `/goal`

```txt
/goal Read specs/CODEX_GOAL_PROMPT.md, specs/GOAL_ACCEPTANCE_GATES.md, docs/roadmaps/MVP_0_7_to_1_0.md, and specs/015-mvp-07-eventized-room-core/**. Implement MVP-0.7A only: eventize player.joined, character.created, adventure.loaded, and session.started; add replay acceptance coverage; do not implement transport, UI, or live AI. Run npm run check, npm test, npm run acceptance, and npm run build. Report changed files, tests run, acceptance criteria satisfied, and deferred work.
```

## Follow-up `/goal` prompts

### MVP-0.7B

```txt
/goal Continue TableMind MVP-0.7 according to specs/CODEX_GOAL_PROMPT.md and specs/GOAL_ACCEPTANCE_GATES.md. Implement MVP-0.7B only from specs/015-mvp-07-eventized-room-core/**: host.review.created, host.review.updated, and ai.message.committed eventization with player-safe projection/recap tests. Do not implement transport, UI, or live AI.
```

### MVP-0.8A

```txt
/goal Implement MVP-0.8A only according to specs/016-mvp-08-transport-contract/**: create a first-party room command dispatcher with typed command results, authorization checks, broadcasts/snapshots, and tests. Do not start a network server yet.
```

### MVP-0.8B

```txt
/goal Implement MVP-0.8B only according to specs/016-mvp-08-transport-contract/**: add a minimal local HTTP API adapter over the command dispatcher with create room, join room, send action, and get snapshot endpoints. Keep business logic out of HTTP handlers. Add server start/stop smoke tests and no-DM-leak response tests.
```

### MVP-0.8C

```txt
/goal Implement MVP-0.8C only according to specs/016-mvp-08-transport-contract/**: add a minimal role-aware event stream adapter using SSE or a first-party WebSocket adapter boundary. Add reconnect/snapshot tests and player stream no-DM-leak tests.
```

### MVP-0.9A

```txt
/goal Implement MVP-0.9A only according to specs/017-mvp-09-playtest-ui/**: build the minimal player browser UI skeleton for join, scene, message feed, character summary, dice log, and combat display using player-projected APIs only. Do not implement Host UI yet and do not add full VTT features.
```

### MVP-0.9B

```txt
/goal Implement MVP-0.9B only according to specs/017-mvp-09-playtest-ui/**: build minimal Host controls for room creation, invite link, DM-only scene view, clue reveal, scene change, AI pause/review, combat controls, session complete, and recap. Ensure Host-only data is never reused in player UI.
```

### MVP-0.9C

```txt
/goal Implement MVP-0.9C only according to specs/017-mvp-09-playtest-ui/**: add a simulated browser/local UI playtest acceptance flow using mock AI that completes the demo adventure, verifies player-safe UI content, and shows recap. Do not use live provider calls.
```

### MVP-1.0A

```txt
/goal Implement MVP-1.0A only according to specs/018-mvp-1-0-live-ai-playtest/**: add a room-aware AI turn wrapper and provider configuration gate. All risky output must enter Host review; safe outputs commit through room service/command boundaries; rule requests route to deterministic rules. Tests must mock provider behavior and default to provider disabled.
```

### MVP-1.0B

```txt
/goal Implement MVP-1.0B only according to specs/018-mvp-1-0-live-ai-playtest/**: add golden AI-turn eval tests for safe narration, spoiler blocking, low-confidence review, reveal proposal review, state patch review, fabricated dice rejection, unsupported action rejection, and rules routing. Do not require network calls.
```

### MVP-1.0C

```txt
/goal Implement MVP-1.0C only according to specs/018-mvp-1-0-live-ai-playtest/**: add live playtest checklist/report docs and final MVP-1.0 acceptance reporting path. Do not declare MVP-1.0 complete without a documented playtest report template and completion criteria.
```
