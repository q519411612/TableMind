# 016 MVP-0.8 Transport Contract - Tasks

## MVP-0.8A command dispatcher

### Command model

- [x] Create `apps/server/src/room-actions.mjs` or equivalent.
- [x] Define command input shape.
- [x] Define success/error result shape.
- [x] Define stable error code mapping.
- [x] Add command dispatcher factory with injected room service.

### Commands

- [x] Implement `room.create`.
- [x] Implement `room.join`.
- [x] Implement `room.leave`.
- [x] Implement `room.reconnect`.
- [x] Implement `room.snapshot`.
- [x] Implement `message.send`.
- [x] Implement `character.create`.
- [x] Implement `adventure.load`.
- [x] Implement `session.start`.
- [x] Implement `scene.change`.
- [x] Implement `clue.reveal`.
- [x] Implement `combat.start`.
- [x] Implement `combat.attack`.
- [x] Implement `combat.advance_turn`.
- [x] Implement `combat.patch_hp`.
- [x] Implement `combat.patch_condition`.
- [x] Implement `combat.end`.
- [x] Implement `ai.pause`.
- [x] Implement `session.complete`.

### Authorization and tests

- [x] Test Host-only command rejection for players.
- [x] Test unknown command rejection.
- [x] Test player command with missing actor rejection.
- [x] Test successful command returns projected snapshot.
- [x] Test broadcasts are role-aware.

## MVP-0.8B HTTP API smoke

### Server adapter

- [x] Add local HTTP server module.
- [x] Add JSON body parser helper with size limit.
- [x] Add `POST /rooms`.
- [x] Add `POST /rooms/:roomId/join`.
- [x] Add `POST /rooms/:roomId/actions`.
- [x] Add `GET /rooms/:roomId/snapshot`.
- [x] Map dispatcher error codes to HTTP status codes.
- [x] Add server start/stop helper for tests.

### HTTP tests

- [x] Test create room endpoint.
- [x] Test join room endpoint.
- [x] Test action endpoint for public message.
- [x] Test snapshot endpoint for Host.
- [x] Test snapshot endpoint for player.
- [ ] Assert player HTTP response excludes DM-only fixture text.

## MVP-0.8C event stream smoke

### Event stream adapter

- [x] Choose SSE or WebSocket adapter and document the choice.
- [x] Add subscriber registry keyed by room/viewer.
- [x] Push command broadcasts to subscribers.
- [x] Remove subscribers on disconnect.
- [x] Ensure stream payloads use projected broadcasts only.

### Event stream tests

- [x] Test stream connection as player.
- [x] Test public update delivery.
- [x] Test player stream excludes DM-only content.
- [x] Test reconnect/snapshot flow.

## Verification

Latest verification in this workspace used a Node 20+ executable directly because `npm` is not installed.

- [x] Run `node scripts/check-js.mjs`.
- [x] Run `node scripts/run-tests.mjs packages apps tests`.
- [x] Run `node scripts/run-tests.mjs tests/acceptance`.
- [ ] Run `npm run build`; not runnable in this workspace because `npm` is unavailable. The equivalent build script commands passed.

## Deferrals

These deferrals describe the MVP-0.8 slice boundary. Browser UI and provider-gated AI wrapper work appear in later slices.

- [x] Do NOT implement production auth.
- [x] Do NOT implement durable persistence.
- [x] Do NOT implement browser UI in MVP-0.8.
- [x] Do NOT implement live AI provider calls in MVP-0.8.
- [x] Do NOT implement horizontal scaling or distributed pub/sub.
