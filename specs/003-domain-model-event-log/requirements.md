# 003 Domain Model and Event Log - Requirements

## Goal

Define the core domain model and append-only event log that make TableMind state reliable, replayable, and independent of LLM memory.

## User stories

### Story 1: Session state is authoritative

As a developer, I want session state to be represented as typed data, so that AI output cannot become the only place where gameplay truth exists.

#### Acceptance criteria

- WHEN a room is running THEN the current scene, characters, NPCs, monsters, clues, combat state, and flags are represented in SessionState.
- WHEN AI proposes a change THEN it is represented as a typed state patch or event before applying.
- WHEN state changes THEN the change is persisted as a SessionEvent.

### Story 2: Events can replay state

As a maintainer, I want important gameplay changes to be events, so that bugs can be diagnosed and sessions can be reconstructed.

#### Acceptance criteria

- WHEN a sequence of events is replayed THEN it produces the same derived state.
- WHEN a dice roll occurs THEN the dice result is stored as an event.
- WHEN a clue is revealed THEN the reveal is stored as an event.
- WHEN combat starts or advances THEN the combat event is stored.

### Story 3: Visibility is built into data

As a Host, I want DM-only and player-visible information to be separated, so that hidden information is not accidentally shown.

#### Acceptance criteria

- WHEN an entity contains private information THEN it has visibility metadata.
- WHEN a player requests state THEN dm_only fields are excluded.
- WHEN Host requests state THEN dm_only fields are included.

## Functional requirements

1. Define stable IDs for sessions, players, characters, scenes, NPCs, encounters, clues, and events.
2. Define `Visibility = public | dm_only | revealed | player_specific`.
3. Define `SessionState` as the authoritative room state.
4. Define `SessionEvent` variants for messages, dice, state patches, scene changes, clue reveals, combat, and Host overrides.
5. Define a pure replay function from events to state where possible.
6. Define role-aware state projection for player vs Host views.

## Non-goals

- Final database schema.
- Final websocket implementation.
- Full authorization system.
- Long-term campaign memory.
- CRDT/offline sync.
