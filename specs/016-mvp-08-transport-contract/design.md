# 016 MVP-0.8 Transport Contract - Design

## Responsibility

MVP-0.8 introduces a transport-independent command layer, then thin network adapters.

Layering:

```txt
Browser/CLI/test
  -> HTTP/SSE or direct command call
    -> command dispatcher
      -> room service
        -> domain reducer / rules engine / spoiler guard / AI orchestrator
```

The dispatcher is the stable contract. HTTP/SSE/WebSocket are adapters.

## Command dispatcher

Suggested module:

```txt
apps/server/src/room-actions.mjs
```

Suggested API:

```ts
type RoomCommand = {
  type: string;
  roomId?: string;
  actorPlayerId?: string;
  viewerRole?: "host" | "player" | "system";
  viewerPlayerId?: string;
  payload?: unknown;
  now: string;
};

type RoomCommandResult =
  | {
      ok: true;
      commandType: string;
      events?: SessionEvent[];
      broadcasts?: RoomBroadcast[];
      snapshot?: SessionProjection;
      data?: unknown;
    }
  | {
      ok: false;
      commandType: string;
      error: {
        code: string;
        message: string;
      };
    };
```

The command dispatcher may accept dependencies:

```ts
function createRoomActionDispatcher({ roomService, clock, randomSourceFactory }) { ... }
```

## Initial command set

### Room/session commands

- `room.create`
- `room.join`
- `room.leave`
- `room.reconnect`
- `room.snapshot`
- `message.send`
- `character.create`
- `adventure.load`
- `session.start`
- `session.complete`

### Adventure commands

- `scene.change`
- `clue.reveal`

### Combat commands

- `combat.start`
- `combat.attack`
- `combat.advance_turn`
- `combat.patch_hp`
- `combat.patch_condition`
- `combat.end`

### AI/Host commands

- `ai.pause`
- `host.review.update`
- `ai.message.commit` if MVP-0.7B added it

## Authorization

Authorization remains simple for MVP:

- Host-only commands require the room Host player ID.
- Player commands require an existing player ID.
- A player can act only as their own character/combatant unless command explicitly allows Host override.
- Snapshot commands require viewer identity and role.

The command dispatcher should return structured forbidden errors rather than throw raw errors to transport adapters.

## Broadcast result

Suggested shape:

```ts
type RoomBroadcast = {
  playerId: string;
  event?: SessionEvent;
  snapshot: SessionProjection;
};
```

Transport adapters can serialize this shape directly after projection.

## HTTP adapter

Suggested module:

```txt
apps/server/src/http-server.mjs
```

Initial endpoints:

```txt
POST /rooms
POST /rooms/:roomId/join
POST /rooms/:roomId/actions
GET  /rooms/:roomId/snapshot?viewerRole=...&viewerPlayerId=...
GET  /rooms/:roomId/events?viewerRole=...&viewerPlayerId=...
```

The `actions` endpoint accepts a command payload:

```json
{
  "type": "message.send",
  "actorPlayerId": "player_0002",
  "payload": { "text": "I inspect the lantern." }
}
```

HTTP handlers should:

1. parse JSON;
2. call dispatcher;
3. map result to status code;
4. return JSON;
5. never inspect or mutate domain state directly.

Suggested status mapping:

| Error code | HTTP status |
|---|---:|
| `bad_request` | 400 |
| `forbidden` | 403 |
| `not_found` | 404 |
| `invalid_phase` | 409 |
| `internal_error` | 500 |

## Event stream adapter

Preferred MVP option: Server-Sent Events (SSE) because it can be implemented over Node HTTP without introducing a WebSocket dependency.

WebSocket is allowed if wrapped behind a first-party adapter boundary and justified in the implementation report.

Event stream responsibilities:

- register connected viewer;
- deliver only broadcasts where `broadcast.playerId` matches viewer or viewer is Host according to projected rules;
- send projected snapshot on connect or require client to fetch snapshot separately;
- remove subscriber on disconnect.

## Test strategy

### Dispatcher tests

- valid command success;
- invalid command type;
- Host-only command forbidden for player;
- player-safe snapshot for player commands;
- events/broadcasts returned for mutating commands.

### HTTP tests

- start server on ephemeral port;
- create room;
- join room;
- send public message;
- fetch Host snapshot;
- fetch player snapshot;
- assert player response does not contain known DM-only fixture text.

### Event stream tests

- connect as player;
- commit a public message/action;
- receive projected update;
- assert no DM-only content appears.

## Error handling

The dispatcher should catch known domain/room errors and convert them into stable error codes.

Transport adapters may log errors but must not include raw stack traces or secrets in responses.

## Dependency policy

- Prefer Node built-in modules for MVP-0.8 where practical.
- If adding a server framework or WebSocket library, wrap it behind TableMind-owned modules and document why the dependency is necessary.
- Do not put domain logic into framework-specific handlers.
