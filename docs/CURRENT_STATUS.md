# Current Status

Date: 2026-06-06

TableMind is ready to attempt a supervised live-provider dry run after Phase 1.2 readiness gates. No real live-provider playtest report has been recorded in this repository.

## Readiness Gates

- AI context size: bounded deterministic public-history context is implemented, with required spoiler-check inputs retained.
- Provider setup: documented in `docs/playtests/LIVE_PROVIDER_SETUP.md` with placeholder-only local commands.
- Player HTTP adventure snapshot: direct no-leak regression covers hidden truth, hidden clue IDs, hidden encounter IDs, hidden NPC IDs, and hidden combatant data before reveal.
- AI golden safety: runner coverage includes hidden entity alias review and player transport/public recap coverage for AI private payloads.
- Dry run execution: documented in `docs/playtests/LIVE_PROVIDER_DRY_RUN.md`.

## Live Provider Policy

- Live provider calls remain disabled by default.
- Default tests must not require live network calls.
- Host supervision is mandatory for any live-provider run.
- Provider secrets must stay outside committed files, fixtures, logs, reports, and screenshots.

## Current Decision

Status: ready for supervised live-provider dry run, pending a human-run session and completed report.

Do not claim MVP-1.0 live-provider completion until a real report records provider status, spoiler incidents, Host interventions, rules outcomes, combat outcomes, recap status, blockers, and a pass/fail decision.
