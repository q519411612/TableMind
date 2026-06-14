# Frontend Product Shell

## Scope

This change productizes the current local `apps/web` Host and Player playtest UI into the first TableMind Web Play shell. It keeps the existing vanilla HTML/CSS/ES module renderer, command hooks, HTTP API contract, room service behavior, rules engine behavior, Host review flow, combat rules, event log, spoiler guard, and recap generation.

The shell now emphasizes a dark fantasy archive style, clearer Host Console and Player Room layouts, typed narrative/event cards, and a rules-engine-oriented dice log. It is still the local MVP playtest surface, not a production web platform.

## Information Boundaries

Host view may render Host-only content because it is fed by Host snapshots and Host adventure snapshots. Host-only scene notes, hidden truth, review payloads, reveal controls, AI pause/resume, HP patches, condition patches, combat controls, audit feed, and Host recap controls are visually isolated with Host-only styling.

Player view must only render player-projected inputs: player snapshot, player adventure snapshot, player recap, current player id, room id, and player command state. It must not render DM-only notes, hidden truth, unrevealed clue text, hidden encounter setup, Host review payloads, raw state patches, `host.override` / `state.patch` internal event names, AI prompts, private payloads, provider credentials, or session tokens.

The UI does not rely on CSS to hide secrets. Player-facing DOM should not receive secret strings in the first place.

## Player-safe Rendering Hardening

Player UI does not rely on CSS hiding for secrets. The Player renderer consumes
only player-projected inputs: player snapshot, player adventure snapshot, player
recap, current player id, room id, and command state. It must not read Host
snapshots, Host review payloads, raw state patches, DM notes, hidden truth,
hidden encounter setup, hidden NPC or monster setup, AI prompts, provider
credentials, or session tokens to improve copy.

Friendly scene and clue names in the Player public feed must come from the
player-safe adventure snapshot. When a scene or clue event cannot be mapped to a
visible scene or clue in that snapshot, the Player feed renders generic public
copy instead of raw internal IDs or event-carried titles. The Host renderer may
use Host-authorized snapshots and Host-authorized event titles for the audit
feed.

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

## PR #26 Usability Guidance

The Web Play shell may add UI-only guidance derived from already-visible room
snapshot, combat, review queue, and adventure snapshot data. Session phase
banners, next-step hints, action composer helper text, suggested player actions,
combat turn hints, and friendlier public feed summaries must not create new game
state or alter command/API/SSE behavior.

Player-facing public feed summaries must only use the player snapshot and player
adventure snapshot supplied to the player renderer. If a revealed clue or scene
change cannot be mapped to a player-safe title from those inputs, render a
generic safe summary instead of a raw internal ID. Do not read Host snapshots,
truth, DM notes, hidden encounter setup, unrevealed clue text, review payloads,
or state patches to improve Player copy.

## Host Review UX Boundary

The Host Review Queue clarity pass only improves the Host Console UI. It groups
pending review items into clearer status, risk, reason, public message, reveal
proposal, state patch proposal, decision, and edit sections.

This UI work does not change Host review business logic, state patch semantics,
command payloads, the spoiler guard, rules-engine authority, or the existing
review commit path. It does not auto approve or auto reject AI output, and it
does not let the AI DM directly mutate deterministic rules state.

The Host view may display Host-authorized review payloads because it is rendered
from Host-scoped data. Player views must not receive Host review payloads,
state patch proposals, rejected AI output, DM-only notes, or other Host-only
content.
