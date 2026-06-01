export const visibilityValues = [
  "public",
  "dm_only",
  "revealed",
  "player_specific",
];

const actorRoles = ["player", "host", "ai_dm", "system"];

const eventValidators = {
  "player.message": (event) => {
    requireString(event, "message");
  },
  "ai.message": (event) => {
    requireString(event, "message");
  },
  "system.message": (event) => {
    requireString(event, "message");
  },
  "dice.rolled": (event) => {
    if (!event.roll || typeof event.roll !== "object") {
      throw new Error("dice.rolled requires roll");
    }
    requireString(event.roll, "formula");
    if (!Number.isFinite(event.roll.total)) {
      throw new Error("dice.rolled requires numeric roll.total");
    }
  },
  "state.patch": (event) => {
    if (!Array.isArray(event.patch)) {
      throw new Error("state.patch requires patch");
    }
    requireString(event, "reason");
  },
  "scene.changed": (event) => {
    requireString(event, "sceneId");
  },
  "clue.revealed": (event) => {
    requireString(event, "clueId");
  },
  "combat.started": (event) => {
    requireString(event, "encounterId");
  },
  "combat.turn_advanced": (event) => {
    requireString(event, "activeCombatantId");
  },
  "combat.ended": (event) => {
    requireString(event, "reason");
  },
  "host.override": (event) => {
    requireString(event, "reason");
  },
};

export function createInitialSessionState(input) {
  for (const key of [
    "id",
    "roomId",
    "rulesetId",
    "adventureModuleId",
    "currentSceneId",
    "now",
  ]) {
    requireString(input, key);
  }

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
    discoveredClueIds: [],
    revealedSecretIds: [],
    diceLog: [],
    eventLog: [],
    flags: {},
    version: 0,
    updatedAt: input.now,
  };
}

export function validateSessionEvent(event, expectedSessionId) {
  if (!event || typeof event !== "object") {
    throw new Error("Session event must be an object");
  }

  for (const key of ["id", "sessionId", "type", "actorRole", "createdAt"]) {
    requireString(event, key);
  }

  if (event.sessionId !== expectedSessionId) {
    throw new Error(`Invalid sessionId: ${event.sessionId}`);
  }

  if (!actorRoles.includes(event.actorRole)) {
    throw new Error(`Unsupported actorRole: ${event.actorRole}`);
  }

  const validator = eventValidators[event.type];
  if (!validator) {
    throw new Error(`Unsupported event type: ${event.type}`);
  }

  validator(event);
  return event;
}

export function appendSessionEvent(state, event) {
  validateSessionEvent(event, state.id);
  const next = clone(state);
  applySessionEvent(next, event);
  next.eventLog.push(clone(event));
  next.version += 1;
  next.updatedAt = event.createdAt;
  return next;
}

export function replaySessionEvents(events, initialState) {
  let state = clone(initialState);
  for (const event of events) {
    state = appendSessionEvent(state, event);
  }
  return state;
}

export function projectSessionState(input) {
  const { state, viewerRole, viewerPlayerId } = input;

  if (!["player", "host", "system"].includes(viewerRole)) {
    throw new Error(`Unsupported viewerRole: ${viewerRole}`);
  }

  if (viewerRole === "host" || viewerRole === "system") {
    return clone(state);
  }

  if (!viewerPlayerId) {
    throw new Error("Player projection requires viewerPlayerId");
  }

  return filterVisibility(clone(state), viewerPlayerId);
}

function applySessionEvent(state, event) {
  switch (event.type) {
    case "scene.changed":
      state.currentSceneId = event.sceneId;
      break;
    case "clue.revealed":
      pushUnique(state.discoveredClueIds, event.clueId);
      break;
    case "dice.rolled":
      state.diceLog.push({
        eventId: event.id,
        formula: event.roll.formula,
        total: event.roll.total,
        reason: event.reason,
      });
      break;
    case "combat.started":
      state.phase = "combat";
      state.combat = {
        encounterId: event.encounterId,
        combatantOrder: event.combatantOrder ?? [],
        activeCombatantId: event.activeCombatantId,
        round: event.round ?? 1,
      };
      break;
    case "combat.turn_advanced":
      if (!state.combat) {
        throw new Error("combat.turn_advanced requires active combat");
      }
      state.combat.activeCombatantId = event.activeCombatantId;
      state.combat.round = event.round ?? state.combat.round;
      break;
    case "combat.ended":
      state.phase = "playing";
      delete state.combat;
      break;
    case "state.patch":
      applyStatePatch(state, event.patch);
      break;
    case "player.message":
    case "ai.message":
    case "system.message":
    case "host.override":
      break;
    default:
      throw new Error(`Unsupported event type: ${event.type}`);
  }
}

function applyStatePatch(state, patch) {
  for (const operation of patch) {
    if (operation.op !== "replace") {
      throw new Error(`Unsupported patch operation: ${operation.op}`);
    }

    const path = operation.path.split("/").filter(Boolean);
    if (path.length === 0) {
      throw new Error("Patch path cannot be empty");
    }

    let target = state;
    for (const segment of path.slice(0, -1)) {
      if (!(segment in target)) {
        throw new Error(`Patch path does not exist: ${operation.path}`);
      }
      target = target[segment];
    }

    const key = path[path.length - 1];
    if (!(key in target)) {
      throw new Error(`Patch path does not exist: ${operation.path}`);
    }
    target[key] = clone(operation.value);
  }
}

function filterVisibility(value, viewerPlayerId) {
  if (Array.isArray(value)) {
    return value
      .map((item) => filterVisibility(item, viewerPlayerId))
      .filter((item) => item !== undefined);
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  if (value.visibility === "dm_only") {
    return undefined;
  }

  if (
    value.visibility === "player_specific" &&
    value.playerId !== viewerPlayerId &&
    value.privateOwnerPlayerId !== viewerPlayerId
  ) {
    return undefined;
  }

  const output = {};
  for (const [key, child] of Object.entries(value)) {
    if (isPrivateField(key, value, viewerPlayerId)) {
      continue;
    }

    const filtered = filterVisibility(child, viewerPlayerId);
    if (filtered !== undefined) {
      output[key] = filtered;
    }
  }

  return output;
}

function isPrivateField(key, owner, viewerPlayerId) {
  if (!key.startsWith("private")) {
    return false;
  }

  return owner?.privateOwnerPlayerId !== viewerPlayerId;
}

function pushUnique(list, value) {
  if (!list.includes(value)) {
    list.push(value);
  }
}

function requireString(object, key) {
  if (typeof object?.[key] !== "string" || object[key].length === 0) {
    throw new Error(`${key} is required`);
  }
}

function clone(value) {
  return structuredClone(value);
}
