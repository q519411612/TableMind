# Demo Acceptance Checklist

## Required Local Demo Outcome

- [x] One Host and two players can complete the local demo flow.
- [x] Host can create a room, load the demo adventure, copy/open invite, see
  readiness, start session, run AI, review AI output, control combat, pause or
  resume AI, complete session, and read recap.
- [x] Players can join from invite link, create demo-ready characters, see
  projected scene/feed/dice/character/combat/recap panels, attack from projected
  combat state, and read recap.
- [x] AI output is never authoritative state.
- [x] Deterministic system code resolves dice, checks, attacks, damage,
  initiative, HP, and combat turns.
- [x] Risky, low-confidence, spoiler-risk, reveal-proposal, and state-patch
  outputs enter Host review.
- [x] Player snapshot, HTTP response, SSE stream, UI, and recap paths do not leak
  `dm_only`, Host-only review details, rejected AI output, private review
  payloads, or raw state patches.
- [x] Default tests and smoke flow do not make live provider calls.
- [x] English and Simplified Chinese fixed labels cover demo UI and recap
  headings.
- [x] `?lang=` and localStorage locale behavior are preserved.
- [x] Authored gameplay text remains unchanged when no explicit localized field
  exists.

## Documentation Outcome

- [x] README documents Node 20+, startup commands, Host/player URLs,
  provider-disabled default, and known limitations.
- [x] `docs/CURRENT_STATUS.md` states local demo status without production
  readiness claims.
- [x] `docs/playtests/DEMO_ACCEPTANCE_CHECKLIST_2026-06-08.md` records the
  detailed self-check.
- [x] `docs/playtests/DEMO_ACCEPTANCE_REPORT_2026-06-08.md` records final
  command results and known limitations.

## Final Verification Outcome

- [x] `npm run check` attempted and documented as unavailable because npm is not
  in `PATH`.
- [x] `npm test` attempted and documented as unavailable because npm is not in
  `PATH`.
- [x] `npm run acceptance` attempted and documented as unavailable because npm is
  not in `PATH`.
- [x] `npm run build` attempted and documented as unavailable because npm is not
  in `PATH`.
- [x] `TABLEMIND_AI_PROVIDER_ENABLED=false npm run smoke:playtest` attempted and
  documented as unavailable because npm is not in `PATH`.
- [x] Direct Node check passed.
- [x] Direct Node full test suite passed.
- [x] Direct Node acceptance suite passed.
- [x] Direct Node provider-disabled smoke passed.
