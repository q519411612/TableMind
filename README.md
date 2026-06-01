# TableMind

TableMind is an AI-assisted tabletop session engine for 5e-compatible one-shot play.

## MVP Scope

The current implementation follows `docs/PRD.md` and `specs/SPEC_MATRIX.md`.

Milestone 1 builds the foundation only:

- package boundaries for domain, rules, compendium, and adventure loading;
- deterministic unit tests;
- event replay and projection contracts;
- tiny SRD/original fixtures;
- an original demo adventure fixture.

Deferred for later milestones:

- production UI;
- production websocket/API server;
- authentication;
- PDF import;
- production LLM provider integration.

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
