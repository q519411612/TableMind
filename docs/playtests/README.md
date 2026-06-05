# MVP-1.0 Playtest Evidence

This folder records the evidence required before TableMind MVP-1.0 can be accepted.

MVP-1.0 is an internal monitored playtest milestone. It is not an unsupervised public launch. The default automated test suite must make no live provider calls, and any AI provider run must be explicitly enabled and supervised by the Host.

## Required Artifacts

- `MVP_1_0_PLAYTEST_CHECKLIST.md` for setup and live or live-simulated session execution.
- `MVP_1_0_PLAYTEST_REPORT_TEMPLATE.md` for the session report and Pass/fail decision.
- `LIVE_PROVIDER_SETUP.md` for local provider environment variables and secret handling.
- `LIVE_PROVIDER_DRY_RUN.md` for the supervised Host plus two-player dry-run procedure.
- `LIVE_PROVIDER_DRY_RUN_REPORT_2026-06-06.md` for the failed provider
  startup preflight attempt.
- `LIVE_PROVIDER_DRY_RUN_REPORT_2026-06-06_DEEPSEEK.md` for the completed
  DeepSeek dry run through a temporary local structured-response bridge.

## Acceptance Policy

MVP-1.0 is not complete when blockers remain undocumented, when a player-facing surface leaks DM-only truth, when recap cannot be generated, or when the AI provider path requires default live network calls.

The final report must include participants, blockers, spoiler incidents, Host interventions, rules outcomes, combat outcomes, recap status, and the Pass/fail decision.
