# 016 MVP-0.8 Transport Contract - Requirements

## Goal

Expose the eventized room core through a stable command/result contract and a thin local transport layer.

The transport layer must not contain game rules, visibility filtering logic, AI orchestration logic, or Host authority decisions. It delegates to first-party room/domain/command modules.

## User stories

### Story 1: Commands can be dispatched without a server

As a developer, I want room actions to be callable through a typed command dispatcher, so that HTTP, event streams, UI, CLI, and tests can share the same behavior.

#### Acceptance criteria

- WHEN a command is dispatched THEN it returns a typed success or error result.
- WHEN a command changes state THEN the result includes committed events and/or broadcasts as appropriate.
- WHEN a player attempts a Host-only command THEN the result is a forbidden error.
- WHEN tests call the dispatcher THEN no network server is required.

### Story 2: Local HTTP clients can create and join rooms

As a Host/player, I want a local HTTP API for basic room actions, so that a browser UI can drive the MVP.

#### Acceptance criteria

- WHEN Host calls create room endpoint THEN a room ID, Host player ID, invite link, and Host snapshot are returned.
- WHEN player calls join endpoint THEN a player ID and player-safe snapshot are returned.
- WHEN viewer calls snapshot endpoint THEN the snapshot is projected for that viewer.
- WHEN invalid input is sent THEN the response is structured and does not crash the server.

### Story 3: Connected viewers receive role-aware updates

As a player, I want to receive room updates without polling manually, so that multiplayer state feels live.

#### Acceptance criteria

- WHEN an event is committed THEN connected viewers receive role-aware broadcast payloads.
- WHEN player is connected THEN they never receive Host-only or DM-only payloads.
- WHEN a viewer reconnects THEN they can fetch a fresh projected snapshot.

## Functional requirements

1. Add a command dispatcher such as `dispatchRoomCommand` that wraps room service methods.
2. Define command input and result shapes in first-party code.
3. Return role-aware snapshots and broadcasts from command results.
4. Add authorization checks at the command/room boundary.
5. Add a minimal local HTTP server adapter over the dispatcher.
6. Add a minimal event stream adapter using SSE or a WebSocket adapter behind a first-party boundary.
7. Add smoke tests for create room, join room, command action, snapshot, and event stream role safety.
8. Keep all business logic out of HTTP handlers and stream handlers.

## Non-goals

- Production authentication.
- User accounts.
- Durable database persistence.
- Horizontal scaling.
- Distributed pub/sub.
- Production deployment automation.
- Full websocket infrastructure if SSE is enough for MVP.
- Browser UI implementation; that belongs to MVP-0.9.
