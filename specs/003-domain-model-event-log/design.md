# 003 Domain Model and Event Log - Design

## Core concepts

TableMind state is server-authoritative and event-backed.

The event log is not optional. It is how we debug AI decisions, replay sessions, and keep multiplayer state consistent.

## IDs

Use opaque string IDs.

Recommended prefixes:

```txt
session_
player_
char_
scene_
npc_
monster_
encounter_
clue_
event_
```

## Visibility

```ts
export type Visibility = "public" | "dm_only" | "revealed" | "player_specific";
```

Visibility applies to adventure entities and state projections.

## SessionState

```ts
export type SessionState = {
  id: string;
  roomId: string;
  rulesetId: string;
  adventureModuleId: string;
  currentSceneId: string;
  phase: "lobby" | "playing" | "combat" | "paused" | "ended";
  players: Record<string, PlayerState>;
  characters: Record<string, CharacterState>;
  npcs: Record<string, NPCState>;
  monsters: Record<string, MonsterState>;
  discoveredClueIds: string[];
  revealedSecretIds: string[];
  combat?: CombatState;
  flags: Record<string, unknown>;
  version: number;
  updatedAt: string;
};
```

## SessionEvent

```ts
export type SessionEvent =
  | PlayerMessageEvent
  | AiMessageEvent
  | SystemMessageEvent
  | DiceRolledEvent
  | StatePatchEvent
  | SceneChangedEvent
  | ClueRevealedEvent
  | CombatStartedEvent
  | CombatTurnAdvancedEvent
  | CombatEndedEvent
  | HostOverrideEvent;
```

All events should include:

```ts
export type BaseEvent = {
  id: string;
  sessionId: string;
  type: string;
  actorId?: string;
  actorRole: "player" | "host" | "ai_dm" | "system";
  createdAt: string;
  correlationId?: string;
};
```

## State patches

State patches should be explicit and auditable.

A patch event should include:

```ts
export type StatePatchEvent = BaseEvent & {
  type: "state.patch";
  patch: JsonPatchOperation[];
  reason: string;
  approvedBy?: string;
};
```

Implementation may choose JSON Patch or a simpler typed patch model, but patch semantics must be deterministic.

## Projection

Role-aware projection must be implemented before exposing player state.

```ts
function projectSessionState(input: {
  state: SessionState;
  viewerRole: "player" | "host" | "system";
  viewerPlayerId?: string;
}): ProjectedSessionState
```

Rules:

- players see public/revealed information;
- players see their own player_specific information;
- players do not see dm_only information;
- Host sees all session information;
- system sees all information.

## Replay

```ts
function replaySessionEvents(events: SessionEvent[]): SessionState
```

Replay should be pure where possible.

Dice randomness must be stored in events, not regenerated during replay.

## Error handling

Invalid events should fail loudly in tests.

At runtime, invalid event append should be rejected before commit.

## Persistence notes

The MVP may persist events in a relational DB, document DB, or local JSON store during early prototyping. The domain package should not depend on the persistence implementation.
