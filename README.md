# TableMind

TableMind is an AI-assisted tabletop session engine for 5e-compatible one-shot play.

## Demo Status

The current local demo is a text-first browser playtest for one Host and two
players. With the mock/disabled provider mode, the flow can create a room, share
a player invite link, join two players, create demo-ready characters, load the
original demo adventure, start play, run a safe AI DM turn through the room
boundary, resolve a deterministic check, reveal a clue, run combat, complete the
session, and render player/Host recaps in English or Simplified Chinese. The
built-in Lantern demo includes explicit English and Simplified Chinese authored
adventure text for the local playtest path; missing localized authored fields
fall back to the canonical source text.

This is not production readiness. It remains an internal/local MVP demo with
in-memory room state and supervised Host control.

## MVP Scope

The current implementation follows `docs/PRD.md` and `specs/SPEC_MATRIX.md`.

The local MVP engine now covers:

- deterministic domain state, event log replay, and role-aware projection contracts;
- a compact rules engine for dice, skill checks, attacks, damage, initiative, and combat turns;
- tiny SRD-style compendium fixtures and an original demo adventure fixture with
  explicit Simplified Chinese authored text;
- an in-memory room service for Host-owned rooms, player joins, reconnection, characters, and committed messages;
- adventure runtime projections with Host-only truth, player-safe localized scene text, clue reveals, and scene changes;
- mock AI DM orchestration with spoiler checks, structured response validation, Host review queues, and rules-engine routing;
- Host combat controls for encounter start, HP/condition edits, attack resolution, turn advancement, and AI pause/resume;
- zero-dependency browser Host/player UI for room setup, character creation, AI turns, review, combat, recap, and bilingual fixed UI labels;
- session recap generation plus a full local simulated playtest across room setup, exploration, rules, combat, and recap.

Deferred beyond this local engine MVP:

- production auth and accounts;
- durable database or multi-process room runtime;
- payment, marketplace, public adventure sharing, or deployment automation;
- PDF import and D&D Beyond sync;
- full VTT map grids, token movement, fog of war, dynamic lighting, or 3D scenes;
- full D&D character builder or complete 5e automation;
- full production LLM provider configuration and live provider usage.

## Local Commands

Use Node 20 or newer. The project is ESM-only and uses the built-in
`node:test` runner.

```bash
node scripts/check-js.mjs
node scripts/run-tests.mjs
node scripts/run-tests.mjs tests/acceptance
node scripts/run-tests.mjs --list
```

When `npm` is available, the same commands are exposed as:

```bash
npm run check
npm test
npm run acceptance
npm run build
```

## Local Browser Demo

Start the local playtest server:

```bash
npm run playtest
```

Or, without npm:

```bash
node scripts/start-playtest.mjs
```

The server logs the local base URL. Open:

- Host UI: `http://127.0.0.1:<port>/host.html`
- Player UI: `http://127.0.0.1:<port>/player.html`

The Host creates the room and copies the generated invite link. Player invite
links include `roomId` automatically, for example:

```txt
http://127.0.0.1:<port>/player.html?roomId=room_0001
```

Mock/disabled provider mode is the default. To run the repeatable browser-like
smoke flow explicitly without provider calls:

```bash
TABLEMIND_AI_PROVIDER_ENABLED=false npm run smoke:playtest
```

Or, without npm:

```bash
TABLEMIND_AI_PROVIDER_ENABLED=false node scripts/smoke-playtest-flow.mjs
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
