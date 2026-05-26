# 004 Realtime Room - Requirements

## Goal

Provide a multiplayer room where Host, players, and AI DM share authoritative session state in near real time.

## User stories

### Story 1: Host creates a room

As a Host, I want to create a room and invite players, so that a one-shot can start quickly.

#### Acceptance criteria

- WHEN a Host creates a room THEN the system returns a room ID and invite link.
- WHEN players join THEN they appear in the room player list.
- WHEN the Host starts the session THEN the room phase changes from lobby to playing.

### Story 2: Players share messages and state

As a player, I want messages, dice results, and state changes to appear for everyone, so that the table stays synchronized.

#### Acceptance criteria

- WHEN a player sends a public message THEN all room participants receive it.
- WHEN dice are rolled THEN all authorized participants receive the result.
- WHEN state changes THEN clients receive the committed event or state projection.

### Story 3: Role permissions are respected

As a Host, I want Host-only state to remain private, so that hidden information is not exposed to players.

#### Acceptance criteria

- WHEN a player connects THEN they receive a player projection.
- WHEN Host connects THEN Host receives Host projection.
- WHEN DM-only data exists THEN it is not broadcast to player clients.

## Functional requirements

1. Support room creation, join, leave, reconnect, and phase changes.
2. Support public chat events.
3. Support system and AI DM events.
4. Broadcast only committed events or authorized projections.
5. Keep server as the authority for state.
6. Include basic presence tracking.

## Non-goals

- Public matchmaking.
- Voice/video.
- Full auth provider.
- Offline-first sync.
- CRDT collaboration.
