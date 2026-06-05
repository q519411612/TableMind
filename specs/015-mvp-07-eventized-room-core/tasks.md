# 015 MVP-0.7 Eventized Room Core - Tasks

## MVP-0.7A lifecycle eventization

### Domain event validation

- [x] Add validator for `player.joined`.
- [x] Add validator for `character.created`.
- [x] Add validator for `adventure.loaded`.
- [x] Add validator for `session.started`.
- [x] Add unit tests for valid and invalid lifecycle events.

### Domain reducer

- [x] Apply `player.joined` to `state.players`.
- [x] Apply `character.created` to `state.characters` and player `characterId`.
- [x] Apply `adventure.loaded` to `adventureModuleId` and `currentSceneId`.
- [x] Apply `session.started` to `phase = "playing"`.
- [x] Reject `character.created` when the player is missing.

### Room service refactor

- [x] Refactor `joinRoom` to commit `player.joined`.
- [x] Keep presence as runtime state in `joinRoom`.
- [x] Refactor `createCharacterForPlayer` to commit `character.created`.
- [x] Refactor `loadAdventureModule` to commit `adventure.loaded` while caching full adventure side state.
- [x] Refactor `startSession` to commit `session.started` instead of `state.patch`.
- [x] Ensure returned snapshots remain unchanged from caller perspective.

### Replay acceptance

- [x] Add replay acceptance test covering join, character creation, adventure load, session start, scene/clue/combat/session completion.
- [x] Compare replayed critical fields against live room state.
- [x] Exclude presence, counters, and cached adventure module content from replay comparison.

## MVP-0.7B review and AI message eventization

### Host review events

- [x] Add validator for `host.review.created`.
- [x] Add validator for `host.review.updated`.
- [x] Commit `host.review.created` when adding review items.
- [x] Commit `host.review.updated` when approving, rejecting, or editing review items.
- [x] Ensure rejected review payloads remain Host-only.

### AI message commitment

- [x] Add or reuse `ai.message` event shape for approved public AI output.
- [x] Add room service helper to commit approved AI public messages.
- [x] Link committed AI message to review item ID when relevant.
- [x] Ensure player broadcasts contain only public AI message data.

### Projection and recap safety

- [x] Add player projection test for Host review events.
- [x] Add player recap test excluding rejected AI output.
- [x] Add Host recap/audit test including relevant review history without leaking to players.

## Verification

Latest verification in this workspace used a Node 20+ executable directly because `npm` is not installed.

- [x] Run `node scripts/check-js.mjs`.
- [x] Run `node scripts/run-tests.mjs packages apps tests`.
- [x] Run `node scripts/run-tests.mjs tests/acceptance`.
- [ ] Run `npm run build`; not runnable in this workspace because `npm` is unavailable. The equivalent build script commands passed.

## Deferrals

These deferrals describe the MVP-0.7 slice boundary. Later MVP-0.8/MVP-0.9/MVP-1.0 slices add HTTP, UI, and provider-gated AI adapter code.

- [x] Do NOT implement HTTP server in MVP-0.7.
- [x] Do NOT implement browser UI in MVP-0.7.
- [x] Do NOT implement live AI provider calls in MVP-0.7.
- [x] Do NOT implement durable database persistence in MVP-0.7.
