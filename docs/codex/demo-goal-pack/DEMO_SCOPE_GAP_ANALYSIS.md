# TableMind Demo Scope Gap Analysis

This document records the gap analysis for the local browser demo goal and the
current closure status. It intentionally does not claim production readiness.

## Reusable Foundation

The project is not a blank rewrite target. The current repository already has:

- Node 20+, ESM, npm scripts, and workspace-style package boundaries.
- A local mock-provider MVP covering room creation, two player joins, character
  creation, demo adventure load, session start, AI turn, checks, clue reveal,
  combat, session completion, and recap.
- `apps/server` room service, command dispatcher, HTTP API, SSE event stream,
  AI room runner, and provider boundary.
- `apps/web` zero-dependency static Host and Player UI.
- `packages` for deterministic rules, compendium, adventure loading, spoiler
  guard, session recap, and shared fixtures.
- English and Simplified Chinese fixed UI label dictionaries.
- no-DM-leak, spoiler guard, provider-disabled default tests, and mock AI
  regression tests.

## Current Demo Capability

The local browser demo can complete the monitored one-shot flow with one Host
and two simulated players through the static browser UI contracts and local
HTTP/SSE adapters.

Implemented and verified:

- Host room creation, invite link generation, invite copy/open affordance, demo
  adventure loading, player readiness, session start, next-step hints, AI run
  control, Host review queue, combat controls, AI pause/resume, and recap panel.
- Player join from invite `roomId`, nickname entry, demo-ready character
  creation, scene/feed/dice/character/combat/recap panels, projected combat
  attack form, and localized fixed UI labels.
- Explicit English and Simplified Chinese authored adventure text for the
  built-in Lantern demo, selected through locale-aware Host/player adventure
  snapshots.
- Deterministic skill check, dice log, initiative, attack, damage, HP, combat
  turn, Host HP/condition patch controls, and combat end.
- Review-required AI paths for low confidence, spoiler risk, reveal proposals,
  and state patch proposals.
- Player snapshot, HTTP response, SSE stream, UI, and recap no-leak coverage.
- English and Simplified Chinese fixed UI and recap labels.
- Player-safe localized adventure snapshots and recaps for the built-in demo.

## Closed Gaps

- Undefined fixed UI labels: covered by label parity and render tests.
- Setup flow drift: covered by browser setup and UI playtest acceptance.
- Combat form raw ID entry: player attack controls derive attacker, attack, and
  targets from projected combat state.
- Host combat patch raw ID entry: Host HP/condition controls derive selectable
  combatants from projected combat state.
- Review payload opacity: Host review renders type, risk, reason, public
  message, reveal proposal, and state patch summaries.
- Review edit submission: Host edit form submits edited `publicMessage` or
  `proposedPayload`.
- Player leakage through review/rejected/private payloads: covered by review
  acceptance tests and player projection/recap tests.
- Locale persistence: `?lang=` and localStorage behavior are covered by browser
  locale tests.
- Authored gameplay localization: the built-in Lantern demo now carries explicit
  `zh-CN` fields for scenes, truth, NPCs, clues, encounter setup, endings, and
  player-safe recap text, while missing localized fields preserve canonical
  source text.

## Remaining Non-Production Gaps

- Real human feedback from a completed second supervised live-provider run.
- Production auth and accounts.
- Durable database and multi-process room runtime.
- Full public deployment workflow.
- Full VTT map/token/fog/lighting features.
- Full D&D character builder and complete 5e automation.
- PDF full import and D&D Beyond sync.
- Payment, marketplace, or public adventure sharing.
- Permanent production provider integration.
- Production localization workflow for arbitrary uploaded adventures.

## Demo Definition Of Done

The local demo target is satisfied when:

1. Host and two players can complete the demo adventure through browser UI.
2. The flow includes create/join/character/scene/feed/AI/check/clue/combat/recap.
3. Player-facing surfaces do not leak DM-only or Host-only data.
4. Host can inspect DM-only truth, review/edit/reject AI, and manually correct
   or advance the session.
5. English and Simplified Chinese UI can be selected, and demo authored text has
   an explicit locale strategy.
6. Verification commands pass or document environment constraints.
7. Documentation explains startup, demo script, and known limitations.

The current branch satisfies the local demo target through automated checks and
recorded local smoke evidence.

## Evidence

- `docs/playtests/DEMO_ACCEPTANCE_CHECKLIST_2026-06-08.md`
- `docs/playtests/DEMO_ACCEPTANCE_REPORT_2026-06-08.md`
- `tests/acceptance/demo-browser-setup.acceptance.test.mjs`
- `tests/acceptance/mvp-ui-playtest.acceptance.test.mjs`
- `tests/acceptance/smoke-playtest-flow.acceptance.test.mjs`
- `apps/web/test/ui-render.test.mjs`
- `apps/web/test/browser-locale.test.mjs`
- `packages/session-recap/test/session-recap.test.mjs`
- `packages/spoiler-guard/test/spoiler-guard.test.mjs`
- `packages/adventure-loader/test/adventure-loader.test.mjs`
