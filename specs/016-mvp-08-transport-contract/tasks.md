# 016 MVP-0.8 Transport Contract - Tasks

## MVP-0.8A command dispatcher

### Command model

- [ ] Create `apps/server/src/room-actions.mjs` or equivalent.
- [ ] Define command input shape.
- [ ] Define success/error result shape.
- [ ] Define stable error code mapping.
- [ ] Add command dispatcher factory with injected room service.

### Commands

- [ ] Implement `room.create`.
- [ ] Implement `room.join`.
- [ ] Implement `room.leave`.
- [ ] Implement `room.reconnect`.
- [ ] Implement `room.snapshot`.
- [ ] Implement `message.send`.
- [ ] Implement `character.create`.
- [ ] Implement `adventure.load`.
- [ ] Implement `session.start`.
- [ ] Implement `scene.change`.
- [ ] Implement `clue.reveal`.
- [ ] Implement `combat.start`.
- [ ] Implement `combat.attack`.
- [ ] Implement `combat.advance_turn`.
- [ ] Implement `combat.patch_hp`.
- [ ] Implement `combat.patch_condition`.
- [ ] Implement `combat.end`.
- [ ] Implement `ai.pause`.
- [ ] Implement `session.complete`.

### Authorization and tests

- [ ] Test Host-only command rejection for players.
- [ ] Test unknown command rejection.
- [ ] Test player command with missing actor rejection.
- [ ] Test successful command returns projected snapshot.
- [ ] Test broadcasts are role-aware.

## MVP-0.8B HTTP API smoke

### Server adapter

- [ ] Add local HTTP server module.
- [ ] Add JSON body parser helper with size limit.
- [ ] Add `POST /rooms`.
- [ ] Add `POST /rooms/:roomId/join`.
- [ ] Add `POST /rooms/:roomId/actions`.
- [ ] Add `GET /rooms/:roomId/snapshot`.
- [ ] Map dispatcher error codes to HTTP status codes.
- [ ] Add server start/stop helper for tests.

### HTTP tests

- [ ] Test create room endpoint.
- [ ] Test join room endpoint.
- [ ] Test action endpoint for public message.
- [ ] Test snapshot endpoint for Host.
- [ ] Test snapshot endpoint for player.
- [ ] Assert player HTTP response excludes DM-only fixture text.

## MVP-0.8C event stream smoke

### Event stream adapter

- [ ] Choose SSE or WebSocket adapter and document the choice.
- [ ] Add subscriber registry keyed by room/viewer.
- [ ] Push command broadcasts to subscribers.
- [ ] Remove subscribers on disconnect.
- [ ] Ensure stream payloads use projected broadcasts only.

### Event stream tests

- [ ] Test stream connection as player.
- [ ] Test public update delivery.
- [ ] Test player stream excludes DM-only content.
- [ ] Test reconnect/snapshot flow.

## Verification

- [ ] Run `npm run check`.
- [ ] Run `npm test`.
- [ ] Run `npm run acceptance`.
- [ ] Run `npm run build`.

## Deferrals

- [ ] Do NOT implement production auth.
- [ ] Do NOT implement durable persistence.
- [ ] Do NOT implement browser UI in MVP-0.8.
- [ ] Do NOT implement live AI provider calls in MVP-0.8.
- [ ] Do NOT implement horizontal scaling or distributed pub/sub.
