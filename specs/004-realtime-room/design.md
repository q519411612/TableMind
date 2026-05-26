# 004 Realtime Room - Design

## Transport

MVP may use WebSocket, Socket.IO, Server-Sent Events plus HTTP, or framework-native realtime transport.

The design requirement is not the specific transport; it is server-authoritative event propagation.

## Room lifecycle

```txt
created -> lobby -> playing -> paused -> ended
```

## Core events

Client to server:

```ts
type ClientEvent =
  | { type: "room.join"; roomId: string; displayName: string }
  | { type: "message.send"; roomId: string; text: string }
  | { type: "player.ready"; roomId: string }
  | { type: "roll.confirm"; requestId: string }
```

Server to client:

```ts
type ServerEvent =
  | { type: "room.snapshot"; state: ProjectedSessionState }
  | { type: "event.committed"; event: SessionEvent }
  | { type: "presence.updated"; players: Presence[] }
  | { type: "error"; code: string; message: string }
```

## Projections

The room server must never broadcast raw internal state to all clients.

It must compute projections based on viewer role.

## Persistence

The server should persist committed events before broadcasting them.

For early MVP, persistence can be simple, but the API should assume events are durable.

## Reconnect

On reconnect, the client receives a fresh snapshot and may optionally receive missed events after a known version.

## Ordering

The server assigns event order.

Clients must not assume their local order is authoritative.

## Error handling

- invalid room: return room_not_found
- unauthorized role: return forbidden
- invalid phase action: return invalid_room_phase
- stale client state: send fresh snapshot
