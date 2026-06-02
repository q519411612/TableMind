# TableMind

TableMind is an AI-assisted tabletop session engine for 5e-compatible one-shot play.

## MVP Scope

The current implementation follows `docs/PRD.md` and `specs/SPEC_MATRIX.md`.

The local MVP engine now covers:

- deterministic domain state, event log replay, and role-aware projection contracts;
- a compact rules engine for dice, skill checks, attacks, damage, initiative, and combat turns;
- tiny SRD-style compendium fixtures and an original demo adventure fixture;
- an in-memory room service for Host-owned rooms, player joins, reconnection, characters, and committed messages;
- adventure runtime projections with Host-only truth, player-safe scene text, clue reveals, and scene changes;
- mock AI DM orchestration with spoiler checks, structured response validation, Host review queues, and rules-engine routing;
- Host combat controls for encounter start, HP/condition edits, attack resolution, turn advancement, and AI pause/resume;
- session recap generation plus a full local simulated playtest across room setup, exploration, rules, combat, and recap.

Deferred beyond this local engine MVP:

- production UI;
- production websocket/API server;
- authentication;
- PDF import;
- production persistence;
- full production LLM provider configuration and live provider usage.

## Local Commands

Use Node 20 or newer.

```bash
node scripts/run-tests.mjs
node scripts/run-tests.mjs tests/acceptance
node scripts/run-tests.mjs --list
```

When `npm` is available, the same commands are exposed as:

```bash
npm test
npm run acceptance
npm run build
```

## Specs

Start with:

- `docs/PRD.md`
- `specs/000-prd-analysis.md`
- `specs/SPEC_MATRIX.md`
- `specs/002-project-foundation`
- `specs/003-domain-model-event-log`
- `specs/006-rules-engine`
- `specs/007-srd-compendium`
- `specs/014-demo-adventure`
