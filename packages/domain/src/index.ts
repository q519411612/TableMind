export type Id = string;
export type SessionId = Id;
export type RoomId = Id;
export type PlayerId = Id;
export type CharacterId = Id;
export type SceneId = Id;
export type NPCId = Id;
export type MonsterId = Id;
export type EncounterId = Id;
export type ClueId = Id;
export type EventId = Id;

export type Visibility = "public" | "dm_only" | "revealed" | "player_specific";
export type ViewerRole = "player" | "host" | "system";
export type ActorRole = "player" | "host" | "ai_dm" | "system";

export type ContentClass =
  | "embedded_srd"
  | "embedded_original"
  | "user_private_upload"
  | "licensed_partner_content"
  | "unknown";

export type ContentSource = {
  id: string;
  title: string;
  contentClass: ContentClass;
  license?: string;
  attribution?: string;
  ownerUserId?: PlayerId;
  roomId?: RoomId;
  visibility: "private" | "room" | "public";
  url?: string;
};

export type AbilityKey = "str" | "dex" | "con" | "int" | "wis" | "cha";

export type SkillKey =
  | "acrobatics"
  | "animal_handling"
  | "arcana"
  | "athletics"
  | "deception"
  | "history"
  | "insight"
  | "intimidation"
  | "investigation"
  | "medicine"
  | "nature"
  | "perception"
  | "performance"
  | "persuasion"
  | "religion"
  | "sleight_of_hand"
  | "stealth"
  | "survival";

export type HitPoints = {
  current: number;
  max: number;
  temporary: number;
};

export type ConditionRef = { id: string; name?: string; source?: string };
export type SpellRef = { id: string; name: string };
export type ItemRef = { id: string; name: string };

export type AttackDefinition = {
  id: string;
  name: string;
  attackBonus: number;
  damageFormula: string;
  damageType?: string;
};

export type PlayerState = {
  id: PlayerId;
  displayName: string;
  role: "host" | "player";
  ready: boolean;
};

export type CharacterState = {
  id: CharacterId;
  playerId: PlayerId;
  name: string;
  ancestry?: string;
  className: string;
  level: number;
  abilities: Record<AbilityKey, number>;
  proficiencyBonus: number;
  armorClass: number;
  hitPoints: HitPoints;
  speed: number;
  savingThrowProficiencies: AbilityKey[];
  skillProficiencies: SkillKey[];
  attacks: AttackDefinition[];
  spells: SpellRef[];
  inventory: ItemRef[];
  conditions: ConditionRef[];
  visibility: Visibility;
};

export type NPCState = {
  id: NPCId;
  displayName: string;
  publicDescription: string;
  dmOnlyNotes?: string;
  visibility: Visibility;
  status: "active" | "missing" | "dead" | "escaped";
};

export type MonsterState = {
  id: MonsterId;
  displayName: string;
  armorClass: number;
  hitPoints: HitPoints;
  abilities: Record<AbilityKey, number>;
  attacks: AttackDefinition[];
  conditions: ConditionRef[];
  visibility: Visibility;
  status: "active" | "defeated" | "unconscious" | "dead" | "fled";
};

export type ClueState = {
  id: ClueId;
  title: string;
  publicText: string;
  dmOnlyText?: string;
  visibility: Visibility;
  status: "hidden" | "revealed" | "spent";
};

export type CombatantState = {
  id: CharacterId | NPCId | MonsterId;
  kind: "character" | "npc" | "monster";
  displayName: string;
  armorClass: number;
  hitPoints: HitPoints;
  abilities: Record<AbilityKey, number>;
  attacks: AttackDefinition[];
  conditions: ConditionRef[];
  initiative?: number;
  status: "active" | "defeated" | "unconscious" | "dead" | "fled";
};

export type CombatState = {
  id: string;
  encounterId?: EncounterId;
  status: "active" | "ended";
  round: number;
  turnIndex: number;
  combatants: CombatantState[];
};

export type SessionPhase = "lobby" | "playing" | "combat" | "paused" | "ended";

export type SessionState = {
  id: SessionId;
  roomId: RoomId;
  rulesetId: string;
  adventureModuleId: string;
  currentSceneId: SceneId;
  phase: SessionPhase;
  players: Record<PlayerId, PlayerState>;
  characters: Record<CharacterId, CharacterState>;
  npcs: Record<NPCId, NPCState>;
  monsters: Record<MonsterId, MonsterState>;
  clues: Record<ClueId, ClueState>;
  discoveredClueIds: ClueId[];
  revealedSecretIds: string[];
  playerSecrets: Record<PlayerId, Record<string, unknown>>;
  combat?: CombatState;
  flags: Record<string, unknown>;
  version: number;
  updatedAt: string;
};

export type DiceEventPayload = {
  formula: string;
  rolls: Array<{ sides: number; value: number; kept?: boolean; label?: string }>;
  modifierTotal: number;
  total: number;
  engine: "tablemind-minimal" | "adapter";
};

export type StatePatchOperation =
  | { op: "set_phase"; phase: SessionPhase }
  | { op: "set_scene"; sceneId: SceneId }
  | { op: "reveal_clue"; clueId: ClueId }
  | { op: "set_character_hp"; characterId: CharacterId; hitPoints: HitPoints }
  | { op: "set_monster_hp"; monsterId: MonsterId; hitPoints: HitPoints }
  | { op: "set_flag"; key: string; value: unknown };

export type BaseEvent = {
  id: EventId;
  sessionId: SessionId;
  type: string;
  actorId?: string;
  actorRole: ActorRole;
  createdAt: string;
  correlationId?: string;
};

export type PlayerMessageEvent = BaseEvent & { type: "player.message"; playerId: PlayerId; text: string };
export type AiMessageEvent = BaseEvent & {
  type: "ai.message";
  publicMessage: string;
  reviewStatus: "approved" | "auto_approved" | "edited";
};
export type SystemMessageEvent = BaseEvent & { type: "system.message"; text: string };
export type DiceRolledEvent = BaseEvent & { type: "dice.rolled"; roll: DiceEventPayload; reason: string };
export type StatePatchEvent = BaseEvent & {
  type: "state.patch";
  patch: StatePatchOperation[];
  reason: string;
  approvedBy?: PlayerId;
};
export type SceneChangedEvent = BaseEvent & {
  type: "scene.changed";
  fromSceneId: SceneId;
  toSceneId: SceneId;
  reason: string;
};
export type ClueRevealedEvent = BaseEvent & { type: "clue.revealed"; clueId: ClueId; reason: string };
export type CombatStartedEvent = BaseEvent & { type: "combat.started"; combat: CombatState };
export type CombatTurnAdvancedEvent = BaseEvent & {
  type: "combat.turn_advanced";
  round: number;
  turnIndex: number;
};
export type CombatEndedEvent = BaseEvent & { type: "combat.ended"; reason: string };
export type HostOverrideEvent = BaseEvent & { type: "host.override"; patch: StatePatchOperation[]; reason: string };

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

export type ProjectedSessionState = SessionState;

export function createEmptySessionState(input: {
  id: SessionId;
  roomId: RoomId;
  rulesetId: string;
  adventureModuleId: string;
  currentSceneId: SceneId;
  now?: string;
}): SessionState {
  const now = input.now ?? new Date(0).toISOString();

  return {
    id: input.id,
    roomId: input.roomId,
    rulesetId: input.rulesetId,
    adventureModuleId: input.adventureModuleId,
    currentSceneId: input.currentSceneId,
    phase: "lobby",
    players: {},
    characters: {},
    npcs: {},
    monsters: {},
    clues: {},
    discoveredClueIds: [],
    revealedSecretIds: [],
    playerSecrets: {},
    flags: {},
    version: 0,
    updatedAt: now
  };
}

export function validateSessionEvent(event: SessionEvent): void {
  if (!event.id) throw new Error("SessionEvent.id is required");
  if (!event.sessionId) throw new Error("SessionEvent.sessionId is required");
  if (!event.actorRole) throw new Error("SessionEvent.actorRole is required");
  if (!event.createdAt) throw new Error("SessionEvent.createdAt is required");
}

export function appendSessionEvent(events: SessionEvent[], event: SessionEvent): SessionEvent[] {
  validateSessionEvent(event);
  if (events.some((existing) => existing.id === event.id)) {
    throw new Error(`Duplicate event id: ${event.id}`);
  }
  return [...events, event];
}

export function replaySessionEvents(initialState: SessionState, events: SessionEvent[]): SessionState {
  return events.reduce((state, event) => applySessionEvent(state, event), cloneSessionState(initialState));
}

export function applySessionEvent(state: SessionState, event: SessionEvent): SessionState {
  validateSessionEvent(event);
  let next = cloneSessionState(state);

  switch (event.type) {
    case "state.patch":
      next = applyStatePatchOperations(next, event.patch);
      break;
    case "scene.changed":
      next.currentSceneId = event.toSceneId;
      break;
    case "clue.revealed":
      next = revealClue(next, event.clueId);
      break;
    case "combat.started":
      next.combat = event.combat;
      next.phase = "combat";
      break;
    case "combat.turn_advanced":
      if (next.combat) {
        next.combat.round = event.round;
        next.combat.turnIndex = event.turnIndex;
      }
      break;
    case "combat.ended":
      if (next.combat) next.combat.status = "ended";
      next.phase = "playing";
      break;
    case "host.override":
      next = applyStatePatchOperations(next, event.patch);
      break;
    case "player.message":
    case "ai.message":
    case "system.message":
    case "dice.rolled":
      break;
  }

  next.version += 1;
  next.updatedAt = event.createdAt;
  return next;
}

export function applyStatePatchOperations(state: SessionState, patch: StatePatchOperation[]): SessionState {
  return patch.reduce((next, operation) => {
    switch (operation.op) {
      case "set_phase":
        next.phase = operation.phase;
        return next;
      case "set_scene":
        next.currentSceneId = operation.sceneId;
        return next;
      case "reveal_clue":
        return revealClue(next, operation.clueId);
      case "set_character_hp": {
        const character = next.characters[operation.characterId];
        if (!character) throw new Error(`Unknown character: ${operation.characterId}`);
        character.hitPoints = operation.hitPoints;
        return next;
      }
      case "set_monster_hp": {
        const monster = next.monsters[operation.monsterId];
        if (!monster) throw new Error(`Unknown monster: ${operation.monsterId}`);
        monster.hitPoints = operation.hitPoints;
        return next;
      }
      case "set_flag":
        next.flags[operation.key] = operation.value;
        return next;
    }
  }, cloneSessionState(state));
}

export function projectSessionState(input: {
  state: SessionState;
  viewerRole: ViewerRole;
  viewerPlayerId?: PlayerId;
}): ProjectedSessionState {
  if (input.viewerRole === "host" || input.viewerRole === "system") return cloneSessionState(input.state);

  const projected = cloneSessionState(input.state);

  projected.npcs = Object.fromEntries(
    Object.entries(projected.npcs)
      .filter(([, npc]) => npc.visibility !== "dm_only")
      .map(([id, npc]) => [id, stripNpcSecrets(npc)])
  );
  projected.monsters = Object.fromEntries(
    Object.entries(projected.monsters).filter(([, monster]) => monster.visibility !== "dm_only")
  );
  projected.clues = Object.fromEntries(
    Object.entries(projected.clues)
      .filter(([, clue]) => clue.visibility !== "dm_only" && clue.status !== "hidden")
      .map(([id, clue]) => [id, stripClueSecrets(clue)])
  );
  projected.playerSecrets = input.viewerPlayerId
    ? { [input.viewerPlayerId]: projected.playerSecrets[input.viewerPlayerId] ?? {} }
    : {};

  return projected;
}

function revealClue(state: SessionState, clueId: ClueId): SessionState {
  const next = cloneSessionState(state);
  const clue = next.clues[clueId];
  if (clue) {
    clue.status = "revealed";
    clue.visibility = "revealed";
  }
  if (!next.discoveredClueIds.includes(clueId)) next.discoveredClueIds.push(clueId);
  return next;
}

function stripNpcSecrets(npc: NPCState): NPCState {
  const clone = { ...npc };
  delete clone.dmOnlyNotes;
  return clone;
}

function stripClueSecrets(clue: ClueState): ClueState {
  const clone = { ...clue };
  delete clone.dmOnlyText;
  return clone;
}

function cloneSessionState(state: SessionState): SessionState {
  return JSON.parse(JSON.stringify(state)) as SessionState;
}
