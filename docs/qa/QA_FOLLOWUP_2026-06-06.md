# TableMind QA Follow-up - 2026-06-06

## Scope

Non-blocking cleanup after `CODEX_QA_REPORT_2026-06-06.md`. This note does not rewrite the historical QA report and does not claim production readiness.

## Cleanup Done

- Added `scripts/smoke-playtest-flow.mjs` and `npm run smoke:playtest` for the provider-disabled HTTP API flow.
- Added acceptance coverage for the scripted smoke harness.
- Added Node 20+ local setup guidance in `docs/DEVELOPMENT.md`.
- Renamed realistic-looking test API keys, bearer tokens, and session-token placeholders to obvious sentinels.
- Documented routine `.worktrees/` exclusion guidance for local secret-scan noise.

## Smoke Status

`npm run smoke:playtest` passes with a Node 20+ runtime in `PATH`.

The smoke starts the playtest server with `TABLEMIND_AI_PROVIDER_ENABLED=false`, completes the QA API flow, verifies player-safe snapshots/adventure snapshots/recap output, and verifies Host adventure/recap access to Host-only truth.

## Safety

No live provider calls were run for this cleanup. The second supervised live-provider run remains safe to attempt under the constraints from the QA report: credentials supplied only through local environment variables, provider calls intentionally enabled only for that supervised run, and no production-readiness claim.
