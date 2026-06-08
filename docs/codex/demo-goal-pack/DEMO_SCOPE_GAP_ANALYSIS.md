# Demo Scope Gap Analysis

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
- Deterministic skill check, dice log, initiative, attack, damage, HP, combat
  turn, Host HP/condition patch controls, and combat end.
- Review-required AI paths for low confidence, spoiler risk, reveal proposals,
  and state patch proposals.
- Player snapshot, HTTP response, SSE stream, UI, and recap no-leak coverage.
- English and Simplified Chinese fixed UI and recap labels.

## Closed Gaps

- Undefined fixed UI labels: covered by label parity and render tests.
- Setup flow drift: covered by browser setup and UI playtest acceptance.
- Combat form raw ID entry: player attack controls derive attacker, attack, and
  targets from projected combat state.
- Review payload opacity: Host review renders type, risk, reason, public
  message, reveal proposal, and state patch summaries.
- Review edit submission: Host edit form submits edited `publicMessage` or
  `proposedPayload`.
- Player leakage through review/rejected/private payloads: covered by review
  acceptance tests and player projection/recap tests.
- Locale persistence: `?lang=` and localStorage behavior are covered by browser
  locale tests.

## Deferred Work

- Real human feedback from a completed second supervised live-provider run.
- Production auth and accounts.
- Durable database and multi-process room runtime.
- Full public deployment workflow.
- Full VTT map/token/fog/lighting features.
- Full D&D character builder and complete 5e automation.
- PDF full import and D&D Beyond sync.
- Payment, marketplace, or public adventure sharing.
- Permanent production provider integration.

## Evidence

- `docs/playtests/DEMO_ACCEPTANCE_CHECKLIST_2026-06-08.md`
- `docs/playtests/DEMO_ACCEPTANCE_REPORT_2026-06-08.md`
- `tests/acceptance/demo-browser-setup.acceptance.test.mjs`
- `tests/acceptance/mvp-ui-playtest.acceptance.test.mjs`
- `tests/acceptance/smoke-playtest-flow.acceptance.test.mjs`
- `apps/web/test/ui-render.test.mjs`
- `apps/web/test/browser-locale.test.mjs`
- `packages/session-recap/test/session-recap.test.mjs`
