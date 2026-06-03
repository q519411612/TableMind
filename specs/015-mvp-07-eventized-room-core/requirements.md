# 015 MVP-0.7 Eventized Room Core - Requirements

## Goal

Make room lifecycle and gameplay-critical state changes replayable through typed committed events.

The room service should behave like a command handler over the domain event reducer. Runtime side state such as presence, counters, and cached full adventure modules may remain in memory, but session truth must be derived from typed events wherever feasible.

## User stories

### Story 1: Room state can be replayed

As a developer, I want committed room events to reconstruct important session state, so that transport, audit logs, and future persistence can rely on a single event model.

#### Acceptance criteria

- WHEN players join THEN a committed event records the player record.
- WHEN a character is created THEN a committed event records the derived character and player ownership.
- WHEN an adventure is loaded THEN a committed event records the selected module ID and starting scene.
- WHEN the session starts THEN a committed event records the phase transition.
- WHEN replaying from initial session state THEN players, characters, adventure ID, current scene, phase, clue reveals, combat state, dice log, and completion flags match the live room state for those fields.

### Story 2: Host and AI actions are auditable

As a Host, I want review queue changes and approved AI messages to be auditable, so that I can understand what the AI proposed and what was actually shown.

#### Acceptance criteria

- WHEN AI output needs review THEN a Host review event can be committed.
- WHEN Host approves, rejects, or edits a review item THEN the decision can be represented as a committed event.
- WHEN AI output is approved for public display THEN an AI message event can be committed.
- WHEN a player recap is generated THEN rejected or Host-only review payloads are excluded.

### Story 3: Runtime presence remains lightweight

As an implementer, I want online/offline presence to remain simple runtime state, so that event replay does not over-model transient socket status.

#### Acceptance criteria

- WHEN a player disconnects THEN presence may update without changing replayable session truth.
- WHEN a player reconnects THEN the player receives a role-aware snapshot derived from current state.
- WHEN replaying committed session events THEN absence of runtime presence events does not break gameplay state.

## Functional requirements

1. Add typed domain event validation for `player.joined`, `character.created`, `adventure.loaded`, and `session.started`.
2. Apply those events in the domain reducer.
3. Refactor room service lifecycle commands to commit those typed events instead of directly mutating session truth.
4. Preserve direct runtime state only for presence, counters, cached full adventure module content, and other non-replay-critical side state.
5. Add replay acceptance tests that reconstruct critical session state from committed events.
6. Add typed events for Host review creation/update and approved AI message commitment in MVP-0.7B.
7. Keep `state.patch` available for Host override and emergency patches, but do not use it for normal lifecycle events once typed events exist.

## Non-goals

- Production HTTP/WebSocket transport.
- Browser UI.
- Durable database implementation.
- Live AI provider calls.
- Full event migration framework.
- Event sourcing for transient socket presence.
- Full undo/branching timeline.
