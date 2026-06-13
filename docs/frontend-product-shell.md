# Frontend Product Shell

## Scope

This change productizes the current local `apps/web` Host and Player playtest UI into the first TableMind Web Play shell. It keeps the existing vanilla HTML/CSS/ES module renderer, command hooks, HTTP API contract, room service behavior, rules engine behavior, Host review flow, combat rules, event log, spoiler guard, and recap generation.

The shell now emphasizes a dark fantasy archive style, clearer Host Console and Player Room layouts, typed narrative/event cards, and a rules-engine-oriented dice log. It is still the local MVP playtest surface, not a production web platform.

## Information Boundaries

Host view may render Host-only content because it is fed by Host snapshots and Host adventure snapshots. Host-only scene notes, hidden truth, review payloads, reveal controls, AI pause/resume, HP patches, condition patches, combat controls, audit feed, and Host recap controls are visually isolated with Host-only styling.

Player view must only render player-projected inputs: player snapshot, player adventure snapshot, player recap, current player id, room id, and player command state. It must not render DM-only notes, hidden truth, unrevealed clue text, hidden encounter setup, Host review payloads, raw state patches, `host.override` / `state.patch` internal event names, AI prompts, private payloads, provider credentials, or session tokens.

The UI does not rely on CSS to hide secrets. Player-facing DOM should not receive secret strings in the first place.

## Vanilla Renderer Structure

The current frontend is intentionally small and zero-dependency:

- `apps/web/public/host.html` and `apps/web/public/player.html` provide static entry shells.
- `apps/web/src/host-app.mjs` and `apps/web/src/player-app.mjs` own browser state, form handling, command dispatch, locale switching, SSE refresh, and recap sync.
- `apps/web/src/render-host.mjs` renders the Host Console from already-authorized Host inputs.
- `apps/web/src/render-player.mjs` renders the Player Room from player-safe inputs.
- `apps/web/src/render-utils.mjs` owns shared escaping, notices, feed cards, rules log cards, combat display, markdown display, and role-neutral helpers.
- `apps/web/src/i18n.mjs` owns fixed English and Simplified Chinese UI labels.
- `apps/web/public/styles.css` owns the product shell visual language and responsive layout.

Renderers may add UI-only grouping and labels, but they must not mutate game state, compute rules outcomes, authorize visibility, or infer hidden facts.

## Why Not React Yet

This stage avoids React because the current playtest path is already covered by acceptance tests and relies on stable static entry points, browser ES modules, and `data-action` / `data-command` hooks. Replacing the stack now would increase risk without improving the MVP proof: one Host and 2-4 players completing a supervised one-shot.

A React or Vite migration should wait until the P0 play shell is stable, component complexity justifies it, and the command/snapshot/SSE contracts are even more settled.

## Deferred Product Areas

This shell intentionally does not add:

- full VTT maps, token movement, fog of war, dynamic lighting, or 3D scenes;
- Dashboard / My Sessions production history;
- Adventure Studio, NPC editors, clue boards, asset libraries, or import pipelines;
- production auth, accounts, durable database, payments, marketplace, or deployment work;
- full D&D character builder or complete 5e automation;
- provider configuration UI or live-provider dependency for tests.

## Suggested Follow-up PRs

1. Split feed, rules log, combat, scene, and recap rendering into smaller first-party modules once this shell proves stable.
2. Add a lightweight local launchpad polish pass for `index.html` without changing Host/player command paths.
3. Add player-safe friendly names for revealed clue and scene events so public feed text does not need raw IDs.
4. Add compact mobile affordances for Host review and combat controls after browser smoke feedback.
5. Add visual regression smoke coverage for Host and Player pages if the project adopts a browser automation runner.
