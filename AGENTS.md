# AGENTS.md

## Project overview

TableMind is an AI-assisted tabletop session engine for D&D 5e-compatible one-shot play. The MVP target is a playable 60–90 minute demo one-shot for one Host and 2–4 players.

## Read first

Before making non-trivial changes, read the relevant project docs:

- `README.md`
- `docs/PRD.md`
- `docs/CURRENT_STATUS.md`
- `docs/DEVELOPMENT.md`
- `docs/open-source-integration-strategy.md`
- `specs/README.md`
- `specs/000-constitution.md`
- `specs/000-prd-analysis.md`
- `specs/GOAL_ACCEPTANCE_GATES.md`
- the active milestone/spec directory, if the task names one

## Core invariants

- The LLM is not the source of truth.
- Dice, checks, attacks, damage, initiative, HP, and combat turn outcomes must be deterministic system/rules operations.
- AI output must not directly mutate session state.
- Host review is mandatory for low-confidence AI output, spoiler risk, reveal proposals, and state patch proposals.
- Player snapshots, HTTP responses, SSE streams, browser UI, and player recaps must never include `dm_only` / Host-only secrets, rejected AI output, private review payloads, or raw state patches.
- Keep business logic in domain/room/command/rules modules, not in UI or HTTP handlers.
- Default tests must not call live AI providers.
- Never commit provider keys, session tokens, authorization headers, real provider payloads, or realistic secrets.

## Architecture expectations

- Prefer incremental changes over rewrites.
- Preserve first-party room service, command dispatcher, event log, role-aware projections, and rules-engine boundaries.
- UI and HTTP layers should be thin adapters over command/API contracts.
- Avoid adding production dependencies. If a dependency is truly necessary, justify it and keep it behind a first-party adapter.
- Do not introduce production auth, durable DB, payment, deployment, marketplace, PDF import, D&D Beyond sync, full VTT map/token/fog/lighting, or full 5e automation unless the task explicitly re-scopes the MVP.

## UI expectations

- Current browser UI is zero-dependency static HTML/CSS/ES modules under `apps/web`.
- Player UI must use only player-projected APIs/snapshots/adventure snapshots.
- Host UI may show DM-only information, review payloads, and override controls.
- Demo UX should avoid asking users to type internal IDs when a dropdown or button can be derived from projected state.
- Show friendly error and next-step messages for demo flow.

## Bilingual expectations

- Support `en` and `zh-CN` for fixed UI text.
- Keep `?lang=` and localStorage language behavior stable.
- Add translations for new labels, buttons, errors, empty states, flow hints, combat/review/recap headings.
- For authored gameplay text, prefer explicit localized fields; otherwise preserve the original authored text. Do not invent translations for user-uploaded content.
- Locale behavior must not weaken no-DM-leak guarantees.

## Testing commands

Use Node 20 or newer.

Run the narrowest useful tests while developing, then run the full required checks before finishing if the environment allows:

```bash
npm run check
npm test
npm run acceptance
npm run build
```

For repeatable demo smoke, also run when relevant:

```bash
TABLEMIND_AI_PROVIDER_ENABLED=false npm run smoke:playtest
```

If a command cannot run, report the exact command, the observed Node/npm version, and the reason.

## Final response format for coding tasks

Include:

```txt
Scope implemented:
Files changed:
Tests added/updated:
Commands run:
Acceptance criteria satisfied:
Deferred work:
Known risks:
```
