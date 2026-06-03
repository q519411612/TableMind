# 015 MVP-0.7 Eventized Room Core - Design

## Responsibility

MVP-0.7 makes the room service a command handler that commits typed domain events for important session truth.

The domain package owns:

- event validation;
- event application/reduction;
- replay semantics;
- role-aware state projection.

The server room service owns:

- room lifecycle command methods;
- runtime presence;
- room counters;
- cached adventure module content;
- building events with IDs, sequence numbers, timestamps, actor IDs, and correlation IDs;
- returning role-aware snapshots and broadcasts.

## Replay boundary

Replay must restore gameplay-critical session truth.

Replayable through events:

- players;
- characters;
- session phase;
- loaded adventure ID and current scene ID;
- clue reveals;
- dice log;
- combat start/turn/end;
- attack/damage result state;
- session completion flags;
- approved AI public messages once MVP-0.7B is complete.

Runtime-only side state:

- presence connection status;
- room counters;
- in-memory `Map` indexes;
- cached full adventure module content;
- live stream subscribers;
- provider client instances.

## Event types

### `player.joined`

```ts
type PlayerJoinedEvent = SessionEventBase & {
  type: "player.joined";
  player: PlayerRecord;
};
```

Validation:

- `player.id` is required;
- `player.displayName` is required;
- `player.role` is `"player"` or `"host"`;
- `player.visibility` is `"public"`.

Reducer:

```ts
state.players[event.player.id] = clone(event.player);
```

### `character.created`

```ts
type CharacterCreatedEvent = SessionEventBase & {
  type: "character.created";
  playerId: string;
  character: CharacterState;
};
```

Validation:

- `playerId` is required;
- `character` is validated with existing character validation;
- `character.playerId === playerId`.

Reducer:

```ts
state.characters[event.character.id] = clone(event.character);
state.players[event.playerId].characterId = event.character.id;
```

If the player does not exist, reducer throws.

### `adventure.loaded`

```ts
type AdventureLoadedEvent = SessionEventBase & {
  type: "adventure.loaded";
  adventureModuleId: string;
  startingSceneId: string;
};
```

Validation:

- `adventureModuleId` is required;
- `startingSceneId` is required.

Reducer:

```ts
state.adventureModuleId = event.adventureModuleId;
state.currentSceneId = event.startingSceneId;
```

The room service still validates that the actual adventure module exists and matches the room ruleset before committing this event.

### `session.started`

```ts
type SessionStartedEvent = SessionEventBase & {
  type: "session.started";
  reason: string;
};
```

Reducer:

```ts
state.phase = "playing";
```

The room service should enforce that the current phase is `"lobby"` before committing this event.

### `host.review.created`

```ts
type HostReviewCreatedEvent = SessionEventBase & {
  type: "host.review.created";
  reviewItem: HostReviewItem;
};
```

Reducer options:

- MVP-0.7B may either keep `reviewQueue` as room side state and use the event only for audit, or add `state.hostReviewItems` if projections need it.
- If kept outside session state, the event must still be persisted in `committedEvents`.

### `host.review.updated`

```ts
type HostReviewUpdatedEvent = SessionEventBase & {
  type: "host.review.updated";
  itemId: string;
  action: "approve" | "reject" | "edit";
  reason?: string;
  proposedPayload?: unknown;
};
```

Player projections and recap must not expose rejected or edited private payloads.

### `ai.message.committed`

```ts
type AiMessageCommittedEvent = SessionEventBase & {
  type: "ai.message";
  message: string;
  reviewItemId?: string;
  reviewStatus?: "approved" | "auto_approved";
  visibility: "public";
};
```

This may reuse existing `ai.message` validation if it is sufficient. The important requirement is that approved public AI output becomes a committed event rather than a transient response.

## Room service changes

### `joinRoom`

Current behavior directly mutates `room.state.players`.

New behavior:

1. Generate `playerId`.
2. Build `player.joined` event.
3. Commit event.
4. Update runtime presence.
5. Return player snapshot.

### `createCharacterForPlayer`

Current behavior directly mutates `room.state.characters` and player record.

New behavior:

1. Validate player exists.
2. Create derived character.
3. Build `character.created` event.
4. Commit event.
5. Return character and projected snapshot.

### `loadAdventureModule`

Current behavior mutates cached adventure and session IDs directly.

New behavior:

1. Validate Host.
2. Validate adventure ruleset and starting scene.
3. Store full adventure module in room side state.
4. Commit `adventure.loaded` event for session state fields.
5. Return Host adventure snapshot.

### `startSession`

Current behavior uses `state.patch`.

New behavior:

1. Validate Host.
2. Validate phase is `lobby`.
3. Commit `session.started` event.
4. Return Host snapshot.

## Replay acceptance test

Add a test such as `tests/acceptance/eventized-room-replay.acceptance.test.mjs`.

Suggested flow:

1. create room;
2. join two players;
3. create two characters;
4. load demo adventure;
5. start session;
6. change scene;
7. reveal clue;
8. start combat;
9. resolve one attack;
10. complete session;
11. replay committed events from a fresh initial state;
12. compare critical fields.

Suggested critical fields:

- `phase`;
- `players`;
- `characters`;
- `adventureModuleId`;
- `currentSceneId`;
- `discoveredClueIds`;
- `diceLog`;
- `combat` or completed combat side effects depending on final phase;
- `lastAttackResult`;
- `lastDamageResult`;
- public completion flags.

Do not compare runtime-only fields such as presence, counters, or cached full adventure objects.

## Error handling

- Unknown event type should remain a hard error.
- Missing player for `character.created` should throw.
- Invalid adventure event payload should throw.
- Duplicate player ID should either replace deterministically or be rejected; rejecting is safer for MVP.
- `state.patch` should still reject invalid paths.

## Migration notes

No production data migration is required for MVP-0.7 unless durable persistence already exists.

Tests that previously asserted direct state mutation should be updated to assert committed events and resulting state.
