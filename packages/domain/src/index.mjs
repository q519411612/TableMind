export const visibilityValues = [
  "public",
  "dm_only",
  "revealed",
  "player_specific",
];

const actorRoles = ["player", "host", "ai_dm", "system"];
export const abilityKeys = [
  "strength",
  "dexterity",
  "constitution",
  "intelligence",
  "wisdom",
  "charisma",
];

export const skillKeys = [
  "athletics",
  "acrobatics",
  "sleight_of_hand",
  "stealth",
  "arcana",
  "history",
  "investigation",
  "nature",
  "religion",
  "animal_handling",
  "insight",
  "medicine",
  "perception",
  "survival",
  "deception",
  "intimidation",
  "performance",
  "persuasion",
];

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
    if (!event.combat || typeof event.combat !== "object") {
      throw new Error("combat.started requires combat");
    }
    if (!Array.isArray(event.combat.combatants)) {
      throw new Error("combat.started requires combat.combatants");
    }
  },
  "combat.turn_advanced": (event) => {
    requireString(event, "activeCombatantId");
  },
  "combat.ended": (event) => {
    requireString(event, "reason");
  },
  "attack.resolved": (event) => {
    requireString(event, "attackerCombatantId");
    requireString(event, "targetCombatantId");
    if (!event.attackResult || typeof event.attackResult !== "object") {
      throw new Error("attack.resolved requires attackResult");
    }
  },
  "damage.applied": (event) => {
    requireString(event, "targetCombatantId");
    if (!event.damageResult || typeof event.damageResult !== "object") {
      throw new Error("damage.applied requires damageResult");
    }
    if (!Number.isFinite(event.damageResult.resultingHp)) {
      throw new Error("damage.applied requires damageResult.resultingHp");
    }
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

export function createCharacter(input) {
  validateCharacter(input);
  return {
    ...clone(input),
    ...deriveCharacterStats(input),
    visibility: input.visibility ?? "public",
  };
}

export function deriveCharacterStats(input) {
  validateAbilityScores(input.abilities);

  return {
    abilityModifiers: Object.fromEntries(
      abilityKeys.map((ability) => [
        ability,
        Math.floor((input.abilities[ability] - 10) / 2),
      ]),
    ),
    proficiencyBonus: proficiencyBonusForLevel(input.level),
  };
}

export function validateCharacter(input) {
  if (!input || typeof input !== "object") {
    throw new Error("Character is required");
  }

  for (const key of ["id", "playerId", "name", "className"]) {
    requireString(input, key);
  }

  if (input.level !== 1) {
    throw new Error("MVP character level must be 1");
  }

  validateAbilityScores(input.abilities);
  validateHitPoints(input.hitPoints);

  if (!Number.isInteger(input.armorClass) || input.armorClass < 1) {
    throw new Error("armorClass must be positive");
  }

  if (!Number.isInteger(input.speed) || input.speed < 0) {
    throw new Error("speed must be a non-negative integer");
  }

  validateStringList(input.savingThrowProficiencies, abilityKeys, "savingThrowProficiencies");
  validateStringList(input.skillProficiencies, skillKeys, "skillProficiencies");
  validateAttacks(input.attacks);

  for (const key of ["spells", "inventory", "conditions"]) {
    if (!Array.isArray(input[key])) {
      throw new Error(`${key} must be an array`);
    }
  }

  return input;
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
      state.combat = clone(event.combat);
      break;
    case "combat.turn_advanced":
      if (!state.combat) {
        throw new Error("combat.turn_advanced requires active combat");
      }
      state.combat.activeCombatantId = event.activeCombatantId;
      state.combat.round = event.round ?? state.combat.round;
      state.combat.turnIndex = event.turnIndex ?? state.combat.turnIndex;
      break;
    case "combat.ended":
      state.phase = "playing";
      delete state.combat;
      break;
    case "attack.resolved":
      state.lastAttackResult = clone(event.attackResult);
      break;
    case "damage.applied":
      applyDamageEvent(state, event);
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
    if (!["add", "replace"].includes(operation.op)) {
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
    if (operation.op === "replace" && !(key in target)) {
      throw new Error(`Patch path does not exist: ${operation.path}`);
    }
    target[key] = clone(operation.value);
  }
}

function applyDamageEvent(state, event) {
  if (!state.combat) {
    throw new Error("damage.applied requires active combat");
  }

  const combatant = state.combat.combatants.find(
    (candidate) => candidate.id === event.targetCombatantId,
  );
  if (!combatant) {
    throw new Error(`combatant not found: ${event.targetCombatantId}`);
  }

  combatant.hitPoints.current = event.damageResult.resultingHp;
  combatant.status = combatant.hitPoints.current === 0 ? "defeated" : "active";
  state.lastDamageResult = clone(event.damageResult);
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

function proficiencyBonusForLevel(level) {
  if (!Number.isInteger(level) || level < 1 || level > 20) {
    throw new Error(`Invalid level: ${level}`);
  }
  return Math.ceil(level / 4) + 1;
}

function validateAbilityScores(abilities) {
  if (!abilities || typeof abilities !== "object") {
    throw new Error("abilities are required");
  }

  for (const ability of abilityKeys) {
    const score = abilities[ability];
    if (!Number.isInteger(score) || score < 1 || score > 30) {
      throw new Error(`${ability} ability score must be an integer from 1 to 30`);
    }
  }
}

function validateHitPoints(hitPoints) {
  if (!hitPoints || typeof hitPoints !== "object") {
    throw new Error("hitPoints are required");
  }

  for (const key of ["current", "max", "temporary"]) {
    if (!Number.isInteger(hitPoints[key]) || hitPoints[key] < 0) {
      throw new Error(`${key} HP must be a non-negative integer`);
    }
  }

  if (hitPoints.max < 1) {
    throw new Error("max HP must be positive");
  }

  if (hitPoints.current > hitPoints.max + hitPoints.temporary) {
    throw new Error("current HP cannot exceed max plus temporary HP");
  }
}

function validateStringList(values, allowed, label) {
  if (!Array.isArray(values)) {
    throw new Error(`${label} must be an array`);
  }

  for (const value of values) {
    if (!allowed.includes(value)) {
      throw new Error(`Invalid ${label} entry: ${value}`);
    }
  }
}

function validateAttacks(attacks) {
  if (!Array.isArray(attacks)) {
    throw new Error("attacks must be an array");
  }

  for (const attack of attacks) {
    for (const key of ["id", "name", "damage"]) {
      requireString(attack, key);
    }
    if (!Number.isInteger(attack.attackBonus)) {
      throw new Error("attackBonus must be an integer");
    }
    if (!isDiceFormula(attack.damage)) {
      throw new Error(`Invalid attack damage formula: ${attack.damage}`);
    }
  }
}

function isDiceFormula(formula) {
  if (typeof formula !== "string") {
    return false;
  }

  const normalized = formula.replace(/\s+/g, "");
  const match = /^(\d+)d(\d+)([+-]\d+)?$/.exec(normalized);
  if (!match) {
    return false;
  }

  const count = Number.parseInt(match[1], 10);
  const sides = Number.parseInt(match[2], 10);
  return count >= 1 && count <= 100 && [4, 6, 8, 10, 12, 20, 100].includes(sides);
}
