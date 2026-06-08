# Demo Acceptance Report 2026-06-08

## Session

- Date/time: 2026-06-08 23:51 CST
- Branch: `codex/demo-playable-p0`
- Runtime code baseline: `e5157c6 demo-p4: localize demo experience`
- Documentation pass: P5 local demo acceptance documentation
- Duration: Automated local verification and browser-like smoke
- Pass/fail decision: Pass

## Participants

- Host: Simulated Host
- Player 1: Ada
- Player 2: Bran
- Optional Player 3: Not used
- Optional Player 4: Not used

## Adventure

- Adventure: The Lantern Beneath the Hill
- Source: Original TableMind fixture
- Ruleset: `5e-srd-5.2.1`
- Characters used: Ada Thorne, Bran Vale
- Scenes reached: Village Square, Lantern Tower
- Ending: Repair the Lantern

## Browser Demo Coverage

- Host room creation: Covered by `demo-browser-setup.acceptance.test.mjs`,
  `mvp-ui-playtest.acceptance.test.mjs`, and `smoke-playtest-flow.mjs`.
- Invite link with `roomId`: Covered by browser setup acceptance.
- Two player joins: Covered by browser setup, UI playtest, and smoke flow.
- Demo-ready character creation: Covered by UI playtest and smoke flow.
- Adventure load and session start: Covered by UI playtest and smoke flow.
- Player scene/feed/dice/character/combat/recap rendering: Covered by UI render,
  UI playtest, and smoke flow.
- Host DM-only scene, review, combat, AI pause, and recap controls: Covered by
  UI render tests and acceptance tests.
- English and Simplified Chinese fixed labels: Covered by UI render tests,
  browser locale tests, session recap tests, and UI playtest acceptance.

## AI Provider

- AI provider enabled: false for default smoke and automated verification.
- Provider/model: Mock adapter or disabled provider mode.
- Config source: Default disabled config plus explicit
  `TABLEMIND_AI_PROVIDER_ENABLED=false` smoke command.
- Live provider calls made: No.
- Provider errors: None in provider-disabled smoke.

## Spoiler And Review

- Spoiler incidents in this local pass: None observed in automated local pass.
- Low-confidence review items: Covered by golden AI-room-runner tests.
- Reveal proposal review items: Covered by golden AI-room-runner tests and Host
  review UI summary tests.
- State patch proposal review items: Covered by golden AI-room-runner tests and
  Host review UI summary tests.
- Host interventions: AI pause/resume, clue reveal, scene change, review
  approve/edit/reject, combat end, session complete.
- Approved AI messages: Covered by Host review and recap tests.
- Edited AI messages: Covered by P3 review edit transport and player no-leak
  acceptance.
- Rejected AI messages: Covered by review audit, recap, UI, and SSE no-leak
  tests.

## Rules And Combat

- Rules checks resolved: Investigation skill check through deterministic rules.
- Dice outcomes: Deterministic dice recorded in dice log and event log.
- Unsupported AI actions rejected: Covered by AI validation tests.
- Combat encounter: Hill Scavengers.
- Combat rounds: At least one player attack resolved in acceptance and smoke
  flows.
- Player attacks resolved: Ada Thorne attacks a hill scavenger.
- Host combat overrides: HP/condition patch forms covered by UI tests; combat
  end covered by acceptance and smoke.

## Recap

- Player recap generated: Yes.
- Host recap generated: Yes.
- English recap fixed labels: Covered by existing session recap tests.
- Simplified Chinese recap fixed labels: Covered by session recap tests and UI
  playtest acceptance.
- Player recap DM-only leak check: Passed in automated tests.
- Host recap unresolved threads: Present in Host recap tests.

## No-Leak Evidence

- Player snapshot no-leak: Covered by domain, HTTP, UI playtest, and smoke
  tests.
- Player HTTP no-leak: Covered by HTTP tests.
- Player SSE no-leak: Covered by event stream and HTTP SSE tests.
- Player UI no-leak: Covered by UI render, browser setup, UI playtest, and
  smoke paths.
- Player recap no-leak: Covered by session recap and review acceptance tests.
- English and Simplified Chinese paths: Covered by UI render, recap, and UI
  playtest acceptance.

## Requested Demo Pack Availability

The following requested files were absent at the start of the final
documentation pass and are now present:

- `docs/codex/demo-goal-pack/README.md`
- `docs/codex/demo-goal-pack/DEMO_SCOPE_GAP_ANALYSIS.md`
- `docs/codex/demo-goal-pack/TABLEMIND_DEMO_GOAL_RUNBOOK.md`
- `docs/codex/demo-goal-pack/DEMO_ACCEPTANCE_CHECKLIST.md`

This report uses the demo goal pack, the active goal text, `docs/PRD.md`,
`specs/GOAL_ACCEPTANCE_GATES.md`, `docs/codex/GOAL_RUNBOOK_MVP_1_0.md`, and the
existing `docs/playtests` checklist/report artifacts as the acceptance source.

## Final Command Matrix

The requested npm commands were attempted first:

- `npm run check`
  - Result: Not runnable in this workspace.
  - Reason: `zsh:1: command not found: npm`.
- `npm test`
  - Result: Not runnable in this workspace.
  - Reason: `zsh:1: command not found: npm`.
- `npm run acceptance`
  - Result: Not runnable in this workspace.
  - Reason: `zsh:1: command not found: npm`.
- `npm run build`
  - Result: Not runnable in this workspace.
  - Reason: `zsh:1: command not found: npm`.
- `TABLEMIND_AI_PROVIDER_ENABLED=false npm run smoke:playtest`
  - Result: Not runnable in this workspace.
  - Reason: `zsh:1: command not found: npm`.

Direct Node equivalents were run with bundled Node v24.14.0:

- `/Users/chenminghui/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/check-js.mjs`
  - Result: Passed.
  - Output summary: Checked 62 JavaScript files.
- `/Users/chenminghui/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/run-tests.mjs packages apps tests`
  - Result: Passed.
  - Output summary: 153 tests, 0 failures.
- `/Users/chenminghui/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/run-tests.mjs tests/acceptance`
  - Result: Passed.
  - Output summary: 14 tests, 0 failures.
- Build equivalent:
  `/Users/chenminghui/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/check-js.mjs`
  plus
  `/Users/chenminghui/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/run-tests.mjs packages apps tests`
  plus
  `/Users/chenminghui/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/run-tests.mjs tests/acceptance`
  - Result: Passed through the component commands above.
- `TABLEMIND_AI_PROVIDER_ENABLED=false /Users/chenminghui/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/smoke-playtest-flow.mjs`
  - Result: Passed.
  - Output summary: provider mode mock/disabled, room `room_0001`,
    phase `ended`, scene `scene_lantern_tower`.

## Known Limitations

- Local in-memory room runtime only.
- No production auth, account system, durable database, payment, marketplace,
  deployment, PDF full import, D&D Beyond sync, full VTT, full character
  builder, or complete 5e automation.
- Live provider use remains a supervised internal playtest path and is disabled
  by default.
- The browser UI is text-first and playtest-focused.
- The local shell used for this pass has no `npm` executable in `PATH`; direct
  Node commands are used as package-script equivalents.

## Decision Notes

The local mock-provider browser demo acceptance pass is accepted for internal
demo use. The evidence proves the Host plus two-player flow, deterministic
rules/combat path, Host review safety, player no-leak boundaries, recap
generation, and bilingual fixed UI/recap labels under the documented local
limitations. Production readiness and unsupervised live-provider use remain
deferred.
