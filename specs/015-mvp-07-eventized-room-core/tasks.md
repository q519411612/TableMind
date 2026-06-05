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

- [ ] Add validator for `host.review.created`.
- [ ] Add validator for `host.review.updated`.
- [ ] Commit `host.review.created` when adding review items.
- [ ] Commit `host.review.updated` when approving, rejecting, or editing review items.
- [ ] Ensure rejected review payloads remain Host-only.

### AI message commitment

- [ ] Add or reuse `ai.message` event shape for approved public AI output.
- [ ] Add room service helper to commit approved AI public messages.
- [ ] Link committed AI message to review item ID when relevant.
- [ ] Ensure player broadcasts contain only public AI message data.

### Projection and recap safety

- [ ] Add player projection test for Host review events.
- [ ] Add player recap test excluding rejected AI output.
- [ ] Add Host recap/audit test including relevant review history without leaking to players.

## Verification

- [ ] Run `npm run check`.
- [ ] Run `npm test`.
- [ ] Run `npm run acceptance`.
- [ ] Run `npm run build`.

## Deferrals

- [ ] Do NOT implement HTTP server in MVP-0.7.
- [ ] Do NOT implement browser UI in MVP-0.7.
- [ ] Do NOT implement live AI provider calls in MVP-0.7.
- [ ] Do NOT implement durable database persistence in MVP-0.7.
