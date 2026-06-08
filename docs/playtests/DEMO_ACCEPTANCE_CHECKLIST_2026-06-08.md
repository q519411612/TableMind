# Demo Acceptance Checklist 2026-06-08

## Source Note

The requested `docs/codex/demo-goal-pack/*` files were absent at the start of
the final documentation pass and are now present. This checklist maps that pack,
the active demo goal, `docs/PRD.md`, `specs/GOAL_ACCEPTANCE_GATES.md`, and the
existing `docs/playtests` MVP-1.0 checklist to the current local browser demo
evidence.

## Runtime And Scope

- [x] Node 20 or newer runtime identified for verification.
- [x] Default provider mode remains mock/disabled for automated tests.
- [x] No production auth, durable database, payment, marketplace, deployment,
  PDF full import, D&D Beyond sync, full VTT, or full character builder is
  claimed as complete.
- [x] Local demo remains an internal playtest path, not production readiness.

## Browser Demo Flow

- [x] Host can create a room from the browser UI.
- [x] Host can load the demo adventure.
- [x] Host can copy/open an invite link that carries `roomId`.
- [x] Two players can join from player UI links.
- [x] Players can create demo-ready characters.
- [x] Host can see player readiness and start the session.
- [x] Player UI shows projected scene, public feed, dice log, character panel,
  combat panel, and recap panel.
- [x] Host UI shows DM-only scene truth, review controls, combat controls, AI
  pause/resume, and recap controls.

## AI And Rules

- [x] AI output is routed through room/command boundaries.
- [x] Safe mock AI narration can become a public AI message.
- [x] Low-confidence output requires Host review.
- [x] Reveal proposals require Host review.
- [x] State patch proposals require Host review.
- [x] Spoiler-risk output requires Host review and is not broadcast directly.
- [x] Dice rolls, checks, attacks, damage, initiative, HP, and combat turns are
  produced by deterministic system code.
- [x] Default automated tests make no live provider calls.

## Player Safety

- [x] Player snapshots exclude `dm_only` and Host-only state.
- [x] Player HTTP responses are projected.
- [x] Player SSE streams do not expose Host review, `state.patch`, or
  `host.override` event details.
- [x] Player UI does not consume Host snapshots.
- [x] Player recap excludes DM-only truth, rejected AI output, private review
  payloads, and raw state patches.
- [x] English and Simplified Chinese player paths are covered by no-leak tests.

## Combat

- [x] Combat UI displays round, active combatant, turn order, initiative, HP,
  AC, status, and conditions.
- [x] Player attack form derives attacker, attack, and targets from projected
  combat state.
- [x] Host HP and condition patch forms use combatant selectors.
- [x] Attack, damage, and resulting HP appear in feed, dice log, and combat
  panels.

## Host Review

- [x] Review queue displays type, risk, reason, public message, reveal proposal,
  and state patch summary.
- [x] Host can approve review items.
- [x] Host can reject review items.
- [x] Host can submit edited public message or proposed payload.
- [x] Rejected/private review payloads are covered by player no-leak tests.
- [x] AI paused/active state is clear in Host UI.

## Bilingual Demo

- [x] English and Simplified Chinese fixed UI labels are present for new demo
  controls, errors, empty states, next-step hints, combat, review, and recap.
- [x] `?lang=` takes precedence over localStorage.
- [x] Locale changes persist to localStorage, document language, and URL.
- [x] Rendered fixed UI paths have no `undefined` labels.
- [x] Session recap supports localized fixed labels.
- [x] Authored gameplay text remains unchanged when no explicit localized field
  exists.

## Documentation And Verification

- [x] README documents Node 20+, local startup, Host/player URLs,
  mock-provider default, and known limitations.
- [x] `docs/CURRENT_STATUS.md` states only current internal/local demo status and
  limitations.
- [x] Demo acceptance report exists for this local verification pass.
- [x] Final command matrix recorded in `DEMO_ACCEPTANCE_REPORT_2026-06-08.md`.
