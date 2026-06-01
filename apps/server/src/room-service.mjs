import {
  appendSessionEvent,
  createCharacter,
  createInitialSessionState,
  projectSessionState,
} from "../../../packages/domain/src/index.mjs";
import {
  resolveAttack,
  resolveDamage,
  resolveInitiative,
} from "../../../packages/rules-engine/src/index.mjs";

export function createRoomService(options = {}) {
  const baseInviteUrl = options.baseInviteUrl ?? "http://localhost:3000/rooms";
  const rooms = new Map();
  let roomCounter = 0;

  function createRoom(input) {
    const roomNumber = nextCounter(++roomCounter);
    const roomId = `room_${roomNumber}`;
    const sessionId = `session_${roomNumber}`;
    const hostPlayerId = "player_0001";
    const state = createInitialSessionState({
      id: sessionId,
      roomId,
      rulesetId: input.rulesetId,
      adventureModuleId: input.adventureModuleId,
      currentSceneId: input.startingSceneId,
      now: input.now,
    });

    state.players[hostPlayerId] = {
      id: hostPlayerId,
      displayName: input.hostDisplayName,
      role: "host",
      visibility: "public",
    };

    const room = {
      roomId,
      hostPlayerId,
      inviteLink: `${baseInviteUrl}/${roomId}`,
      state,
      adventure: undefined,
      presence: new Map([
        [
          hostPlayerId,
          {
            playerId: hostPlayerId,
            displayName: input.hostDisplayName,
            role: "host",
            connected: true,
            lastSeenAt: input.now,
          },
        ],
      ]),
      committedEvents: [],
      reviewQueue: [],
      nextPlayerNumber: 2,
      nextEventNumber: 1,
      nextReviewNumber: 1,
    };

    rooms.set(roomId, room);

    return {
      roomId,
      hostPlayerId,
      inviteLink: room.inviteLink,
      snapshot: projectSessionState({ state: room.state, viewerRole: "host" }),
    };
  }

  function joinRoom(input) {
    const room = requireRoom(input.roomId);
    const playerId = `player_${nextCounter(room.nextPlayerNumber)}`;
    room.nextPlayerNumber += 1;

    room.state.players[playerId] = {
      id: playerId,
      displayName: input.displayName,
      role: "player",
      visibility: "public",
    };
    room.presence.set(playerId, {
      playerId,
      displayName: input.displayName,
      role: "player",
      connected: true,
      lastSeenAt: input.now,
    });

    return {
      playerId,
      snapshot: getSnapshot({
        roomId: input.roomId,
        viewerRole: "player",
        viewerPlayerId: playerId,
      }),
    };
  }

  function leaveRoom(input) {
    const room = requireRoom(input.roomId);
    const presence = requirePresence(room, input.playerId);
    room.presence.set(input.playerId, {
      ...presence,
      connected: false,
      lastSeenAt: input.now,
    });

    return {
      presence: getPresence(input.roomId),
    };
  }

  function reconnect(input) {
    const room = requireRoom(input.roomId);
    const presence = requirePresence(room, input.playerId);
    room.presence.set(input.playerId, {
      ...presence,
      connected: true,
      lastSeenAt: input.now,
    });

    const viewerRole =
      room.state.players[input.playerId]?.role === "host" ? "host" : "player";

    return {
      snapshot: getSnapshot({
        roomId: input.roomId,
        viewerRole,
        viewerPlayerId: input.playerId,
      }),
      presence: getPresence(input.roomId),
    };
  }

  function startSession(input) {
    const room = requireRoom(input.roomId);
    requireHost(room, input.hostPlayerId);
    if (room.state.phase !== "lobby") {
      throw new Error("invalid_room_phase");
    }

    const event = buildEvent(room, {
      type: "state.patch",
      actorId: input.hostPlayerId,
      actorRole: "host",
      createdAt: input.now,
      patch: [{ op: "replace", path: "/phase", value: "playing" }],
      reason: "Host started the session.",
    });
    commitEvent(room, event);

    return {
      event,
      snapshot: getSnapshot({ roomId: input.roomId, viewerRole: "host" }),
    };
  }

  function sendPublicMessage(input) {
    const room = requireRoom(input.roomId);
    const player = room.state.players[input.playerId];
    if (!player) {
      throw new Error("player_not_found");
    }

    const event = buildEvent(room, {
      type: "player.message",
      actorId: input.playerId,
      actorRole: player.role === "host" ? "host" : "player",
      createdAt: input.now,
      message: input.text,
      visibility: "public",
    });
    commitEvent(room, event);

    return {
      event,
      broadcasts: buildBroadcasts(room, event),
      snapshot: getSnapshot({
        roomId: input.roomId,
        viewerRole: player.role === "host" ? "host" : "player",
        viewerPlayerId: input.playerId,
      }),
    };
  }

  function createCharacterForPlayer(input) {
    const room = requireRoom(input.roomId);
    const player = room.state.players[input.playerId];
    if (!player) {
      throw new Error("player_not_found");
    }

    const character = createCharacter({
      ...input.character,
      playerId: input.playerId,
    });
    room.state.characters[character.id] = character;
    room.state.players[input.playerId] = {
      ...player,
      characterId: character.id,
    };

    return {
      character,
      snapshot: getSnapshot({
        roomId: input.roomId,
        viewerRole: player.role === "host" ? "host" : "player",
        viewerPlayerId: input.playerId,
      }),
    };
  }

  function setRoomFlag(input) {
    const room = requireRoom(input.roomId);
    room.state.flags[input.key] = structuredClone(input.value);
  }

  function addHostReviewItem(input) {
    const room = requireRoom(input.roomId);
    const item = {
      id: `review_${nextCounter(room.nextReviewNumber)}`,
      sessionId: room.state.id,
      type: input.type,
      proposedPayload: structuredClone(input.proposedPayload),
      reason: input.reason,
      riskLevel: input.riskLevel,
      status: "pending",
      createdAt: input.now,
    };
    room.nextReviewNumber += 1;
    room.reviewQueue.push(item);
    return structuredClone(item);
  }

  function getHostReviewQueue(input) {
    requireRoom(input.roomId);
    if (input.viewerRole !== "host") {
      throw new Error("forbidden");
    }
    return structuredClone(requireRoom(input.roomId).reviewQueue);
  }

  function updateHostReviewItem(input) {
    const room = requireRoom(input.roomId);
    requireHost(room, input.hostPlayerId);
    const item = room.reviewQueue.find((candidate) => candidate.id === input.itemId);
    if (!item) {
      throw new Error("review_item_not_found");
    }

    if (input.action === "approve") {
      item.status = "approved";
    } else if (input.action === "reject") {
      item.status = "rejected";
      item.rejectionReason = input.reason;
    } else if (input.action === "edit") {
      item.status = "edited";
      item.proposedPayload = structuredClone(input.proposedPayload);
    } else {
      throw new Error(`Unsupported review action: ${input.action}`);
    }

    return structuredClone(item);
  }

  function loadAdventureModule(input) {
    const room = requireRoom(input.roomId);
    requireHost(room, input.hostPlayerId);
    validateAdventureForRoom(room, input.adventure);

    room.adventure = structuredClone(input.adventure);
    room.state.adventureModuleId = input.adventure.id;
    room.state.currentSceneId = input.adventure.startingSceneId;

    return {
      adventureId: input.adventure.id,
      snapshot: getAdventureSnapshot({
        roomId: input.roomId,
        viewerRole: "host",
      }),
    };
  }

  function getAdventureSnapshot(input) {
    const room = requireRoom(input.roomId);
    if (!room.adventure) {
      throw new Error("adventure_not_loaded");
    }

    if (input.viewerRole === "host" || input.viewerRole === "system") {
      return buildHostAdventureSnapshot(room);
    }

    if (input.viewerRole !== "player") {
      throw new Error(`Unsupported viewerRole: ${input.viewerRole}`);
    }

    if (!input.viewerPlayerId) {
      throw new Error("Player adventure snapshot requires viewerPlayerId");
    }

    return buildPlayerAdventureSnapshot(room);
  }

  function revealClue(input) {
    const room = requireRoom(input.roomId);
    requireHost(room, input.hostPlayerId);
    requireLoadedClue(room, input.clueId);

    const event = buildEvent(room, {
      type: "clue.revealed",
      actorId: input.hostPlayerId,
      actorRole: "host",
      createdAt: input.now,
      clueId: input.clueId,
      visibility: "revealed",
    });
    commitEvent(room, event);

    return {
      event,
      snapshot: getAdventureSnapshot({
        roomId: input.roomId,
        viewerRole: "host",
      }),
    };
  }

  function changeScene(input) {
    const room = requireRoom(input.roomId);
    requireHost(room, input.hostPlayerId);
    requireLoadedScene(room, input.sceneId);

    const event = buildEvent(room, {
      type: "scene.changed",
      actorId: input.hostPlayerId,
      actorRole: "host",
      createdAt: input.now,
      sceneId: input.sceneId,
      reason: input.reason,
    });
    commitEvent(room, event);

    return {
      event,
      snapshot: getAdventureSnapshot({
        roomId: input.roomId,
        viewerRole: "host",
      }),
    };
  }

  function startCombatFromEncounter(input) {
    const room = requireRoom(input.roomId);
    requireHost(room, input.hostPlayerId);
    const encounter = requireLoadedEncounter(room, input.encounterId);
    const combatants = [
      ...buildCharacterCombatants(room, input.characterIds),
      ...buildMonsterCombatants(encounter, input.compendiumEntries),
    ];
    const initiative = resolveInitiative({
      combatants: combatants.map((combatant) => ({
        id: combatant.id,
        dexterityScore: combatant.abilities.dexterity,
      })),
      randomSource: input.randomSource,
    });
    const initiativeById = new Map(
      initiative.map((entry) => [entry.combatantId, entry]),
    );
    const orderedCombatants = initiative.map((entry) => ({
      ...combatants.find((combatant) => combatant.id === entry.combatantId),
      initiative: entry.total,
      initiativeRoll: entry.roll,
    }));
    const combat = {
      id: `combat_${input.encounterId}`,
      encounterId: input.encounterId,
      status: "active",
      round: 1,
      turnIndex: 0,
      activeCombatantId: orderedCombatants[0].id,
      combatants: orderedCombatants,
      initiativeResults: orderedCombatants.map((combatant) =>
        initiativeById.get(combatant.id),
      ),
    };
    const event = buildEvent(room, {
      type: "combat.started",
      actorId: input.hostPlayerId,
      actorRole: "host",
      createdAt: input.now,
      encounterId: input.encounterId,
      combat,
    });
    commitEvent(room, event);

    return {
      event,
      snapshot: getSnapshot({ roomId: input.roomId, viewerRole: "host" }),
    };
  }

  function resolveCombatAttack(input) {
    const room = requireRoom(input.roomId);
    const actor = room.state.players[input.actorPlayerId];
    if (!actor) {
      throw new Error("player_not_found");
    }
    const combat = requireActiveCombat(room);
    const attacker = requireCombatant(combat, input.attackerCombatantId);
    const target = requireCombatant(combat, input.targetCombatantId);
    if (actor.role !== "host" && attacker.playerId !== input.actorPlayerId) {
      throw new Error("forbidden");
    }
    const attack = requireAttack(attacker, input.attackId);
    const attackResult = resolveAttack({
      attacker,
      target,
      attack,
      advantage: input.advantage ?? "normal",
      reason: input.reason ?? `Attack ${target.displayName}.`,
      randomSource: input.randomSource,
    });
    const attackEvent = buildEvent(room, {
      type: "attack.resolved",
      actorId: input.actorPlayerId,
      actorRole: actor.role === "host" ? "host" : "player",
      createdAt: input.now,
      attackerCombatantId: attacker.id,
      targetCombatantId: target.id,
      attackId: attack.id,
      attackResult,
    });
    commitEvent(room, attackEvent);

    let damageEvent;
    let damageResult;
    if (attackResult.hit) {
      damageResult = resolveDamage({
        target: {
          id: target.id,
          currentHp: target.hitPoints.current,
          maxHp: target.hitPoints.max,
          conditions: target.conditions,
        },
        formula: attack.damage,
        damageType: attack.damageType,
        critical: attackResult.critical,
        randomSource: input.randomSource,
      });
      damageEvent = buildEvent(room, {
        type: "damage.applied",
        actorId: input.actorPlayerId,
        actorRole: "system",
        createdAt: input.now,
        targetCombatantId: target.id,
        damageResult,
      });
      commitEvent(room, damageEvent);
    }

    return {
      attackEvent,
      damageEvent,
      attackResult,
      damageResult,
      snapshot: getSnapshot({ roomId: input.roomId, viewerRole: "host" }),
    };
  }

  function advanceCombatTurn(input) {
    const room = requireRoom(input.roomId);
    requireHost(room, input.hostPlayerId);
    const combat = requireActiveCombat(room);
    const next = nextTurn(combat);
    const event = buildEvent(room, {
      type: "combat.turn_advanced",
      actorId: input.hostPlayerId,
      actorRole: "host",
      createdAt: input.now,
      activeCombatantId: next.activeCombatantId,
      round: next.round,
      turnIndex: next.turnIndex,
    });
    commitEvent(room, event);

    return {
      event,
      snapshot: getSnapshot({ roomId: input.roomId, viewerRole: "host" }),
    };
  }

  function endCombat(input) {
    const room = requireRoom(input.roomId);
    requireHost(room, input.hostPlayerId);
    requireActiveCombat(room);
    const event = buildEvent(room, {
      type: "combat.ended",
      actorId: input.hostPlayerId,
      actorRole: "host",
      createdAt: input.now,
      reason: input.reason,
    });
    commitEvent(room, event);

    return {
      event,
      snapshot: getSnapshot({ roomId: input.roomId, viewerRole: "host" }),
    };
  }

  function patchCombatantHitPoints(input) {
    const room = requireRoom(input.roomId);
    requireHost(room, input.hostPlayerId);
    const combat = requireActiveCombat(room);
    const combatantIndex = combatantIndexById(combat, input.combatantId);
    const combatant = combat.combatants[combatantIndex];
    if (!Number.isInteger(input.currentHp) || input.currentHp < 0) {
      throw new Error("currentHp must be a non-negative integer");
    }
    if (input.currentHp > combatant.hitPoints.max + combatant.hitPoints.temporary) {
      throw new Error("currentHp cannot exceed max plus temporary HP");
    }
    const event = buildEvent(room, {
      type: "state.patch",
      actorId: input.hostPlayerId,
      actorRole: "host",
      createdAt: input.now,
      patch: [
        {
          op: "replace",
          path: `/combat/combatants/${combatantIndex}/hitPoints/current`,
          value: input.currentHp,
        },
        {
          op: "replace",
          path: `/combat/combatants/${combatantIndex}/status`,
          value: input.currentHp === 0 ? "defeated" : "active",
        },
      ],
      reason: input.reason,
    });
    commitEvent(room, event);

    return {
      event,
      snapshot: getSnapshot({ roomId: input.roomId, viewerRole: "host" }),
    };
  }

  function patchCombatantCondition(input) {
    const room = requireRoom(input.roomId);
    requireHost(room, input.hostPlayerId);
    const combat = requireActiveCombat(room);
    const combatantIndex = combatantIndexById(combat, input.combatantId);
    const combatant = combat.combatants[combatantIndex];
    const conditions = patchConditions(
      combatant.conditions,
      input.condition,
      input.action,
    );
    const event = buildEvent(room, {
      type: "state.patch",
      actorId: input.hostPlayerId,
      actorRole: "host",
      createdAt: input.now,
      patch: [
        {
          op: "replace",
          path: `/combat/combatants/${combatantIndex}/conditions`,
          value: conditions,
        },
      ],
      reason: input.reason,
    });
    commitEvent(room, event);

    return {
      event,
      snapshot: getSnapshot({ roomId: input.roomId, viewerRole: "host" }),
    };
  }

  function setAiPaused(input) {
    const room = requireRoom(input.roomId);
    requireHost(room, input.hostPlayerId);
    const operation = room.state.flags.aiPaused ? "replace" : "add";
    const event = buildEvent(room, {
      type: "state.patch",
      actorId: input.hostPlayerId,
      actorRole: "host",
      createdAt: input.now,
      patch: [
        {
          op: operation,
          path: "/flags/aiPaused",
          value: {
            visibility: "dm_only",
            value: input.paused,
          },
        },
      ],
      reason: input.reason,
    });
    commitEvent(room, event);

    return {
      event,
      snapshot: getSnapshot({ roomId: input.roomId, viewerRole: "host" }),
    };
  }

  function commitDiceRoll(input) {
    const room = requireRoom(input.roomId);
    const event = buildEvent(room, {
      type: "dice.rolled",
      actorRole: "system",
      createdAt: input.now,
      roll: input.roll,
      reason: input.reason,
    });
    commitEvent(room, event);

    return {
      event,
      snapshot: getSnapshot({ roomId: input.roomId, viewerRole: "host" }),
    };
  }

  function completeSession(input) {
    const room = requireRoom(input.roomId);
    requireHost(room, input.hostPlayerId);
    const event = buildEvent(room, {
      type: "state.patch",
      actorId: input.hostPlayerId,
      actorRole: "host",
      createdAt: input.now,
      patch: [
        { op: "replace", path: "/phase", value: "ended" },
        {
          op: room.state.flags.ending ? "replace" : "add",
          path: "/flags/ending",
          value: {
            visibility: "public",
            value: input.ending,
          },
        },
        {
          op: room.state.flags.rewards ? "replace" : "add",
          path: "/flags/rewards",
          value: {
            visibility: "public",
            value: structuredClone(input.rewards),
          },
        },
      ],
      reason: `Session completed: ${input.ending}`,
    });
    commitEvent(room, event);

    return {
      event,
      snapshot: getSnapshot({ roomId: input.roomId, viewerRole: "host" }),
    };
  }

  function getPresence(roomId) {
    const room = requireRoom(roomId);
    return Array.from(room.presence.values()).sort((left, right) =>
      left.playerId.localeCompare(right.playerId),
    );
  }

  function getCommittedEvents(roomId) {
    return structuredClone(requireRoom(roomId).committedEvents);
  }

  function getSnapshot(input) {
    const room = requireRoom(input.roomId);
    return projectSessionState({
      state: room.state,
      viewerRole: input.viewerRole,
      viewerPlayerId: input.viewerPlayerId,
    });
  }

  function buildBroadcasts(room, event) {
    return getPresence(room.roomId)
      .filter((presence) => presence.connected)
      .map((presence) => ({
        playerId: presence.playerId,
        event: structuredClone(event),
        snapshot: projectSessionState({
          state: room.state,
          viewerRole: presence.role === "host" ? "host" : "player",
          viewerPlayerId: presence.playerId,
        }),
      }));
  }

  function buildEvent(room, event) {
    const sequence = room.nextEventNumber;
    return {
      id: `event_${nextCounter(sequence)}`,
      sessionId: room.state.id,
      sequence,
      correlationId: `correlation_${nextCounter(sequence)}`,
      ...event,
    };
  }

  function commitEvent(room, event) {
    room.state = appendSessionEvent(room.state, event);
    room.committedEvents.push(structuredClone(event));
    room.nextEventNumber += 1;
  }

  function requireRoom(roomId) {
    const room = rooms.get(roomId);
    if (!room) {
      throw new Error("room_not_found");
    }
    return room;
  }

  return {
    createRoom,
    joinRoom,
    leaveRoom,
    reconnect,
    startSession,
    sendPublicMessage,
    createCharacterForPlayer,
    setRoomFlag,
    addHostReviewItem,
    getHostReviewQueue,
    updateHostReviewItem,
    loadAdventureModule,
    getAdventureSnapshot,
    revealClue,
    changeScene,
    startCombatFromEncounter,
    resolveCombatAttack,
    advanceCombatTurn,
    endCombat,
    patchCombatantHitPoints,
    patchCombatantCondition,
    setAiPaused,
    commitDiceRoll,
    completeSession,
    getPresence,
    getCommittedEvents,
    getSnapshot,
  };
}

function validateAdventureForRoom(room, adventure) {
  if (!adventure || typeof adventure !== "object") {
    throw new Error("adventure is required");
  }
  if (adventure.rulesetId !== room.state.rulesetId) {
    throw new Error("adventure ruleset does not match room");
  }
  if (!adventure.scenes?.some((scene) => scene.id === adventure.startingSceneId)) {
    throw new Error("adventure starting scene is missing");
  }
}

function buildHostAdventureSnapshot(room) {
  const adventure = room.adventure;
  const currentScene = requireCurrentScene(room);

  return {
    id: adventure.id,
    title: adventure.title,
    status: adventure.status,
    synopsis: adventure.synopsis,
    currentScene: {
      ...structuredClone(currentScene),
      clues: sceneClues(adventure, currentScene),
      npcs: sceneNpcs(adventure, currentScene, "host"),
      encounter: sceneEncounter(adventure, currentScene, "host"),
    },
    truth: structuredClone(adventure.truth),
    source: structuredClone(adventure.source),
  };
}

function buildPlayerAdventureSnapshot(room) {
  const adventure = room.adventure;
  const currentScene = requireCurrentScene(room);
  const revealed = new Set(room.state.discoveredClueIds);

  return {
    id: adventure.id,
    title: adventure.title,
    currentScene: {
      id: currentScene.id,
      title: currentScene.title,
      readAloud: structuredClone(currentScene.readAloud),
      clueIds: structuredClone(currentScene.clueIds),
      npcIds: structuredClone(currentScene.npcIds),
      encounterId: currentScene.encounterId,
      clues: sceneClues(adventure, currentScene)
        .filter((clue) => clue.visibility === "public" || revealed.has(clue.id))
        .map((clue) => ({
          ...structuredClone(clue),
          visibility: clue.visibility === "public" ? "public" : "revealed",
        })),
      npcs: sceneNpcs(adventure, currentScene, "player"),
      encounter: sceneEncounter(adventure, currentScene, "player"),
    },
    source: structuredClone(adventure.source),
  };
}

function requireCurrentScene(room) {
  const currentScene = room.adventure.scenes.find(
    (scene) => scene.id === room.state.currentSceneId,
  );
  if (!currentScene) {
    throw new Error(`current scene not found: ${room.state.currentSceneId}`);
  }
  return currentScene;
}

function sceneClues(adventure, scene) {
  return scene.clueIds.map((clueId) => {
    const clue = adventure.clues.find((candidate) => candidate.id === clueId);
    if (!clue) {
      throw new Error(`scene clue not found: ${clueId}`);
    }
    return structuredClone(clue);
  });
}

function sceneNpcs(adventure, scene, viewerRole) {
  return scene.npcIds.map((npcId) => {
    const npc = adventure.npcs.find((candidate) => candidate.id === npcId);
    if (!npc) {
      throw new Error(`scene NPC not found: ${npcId}`);
    }
    if (viewerRole === "host") {
      return structuredClone(npc);
    }
    return {
      id: npc.id,
      name: npc.name,
      publicDescription: npc.publicDescription,
      visibility: npc.visibility,
    };
  });
}

function sceneEncounter(adventure, scene, viewerRole) {
  if (!scene.encounterId) {
    return undefined;
  }
  const encounter = adventure.encounters.find(
    (candidate) => candidate.id === scene.encounterId,
  );
  if (!encounter) {
    throw new Error(`scene encounter not found: ${scene.encounterId}`);
  }
  if (viewerRole === "host") {
    return structuredClone(encounter);
  }
  return {
    id: encounter.id,
    title: encounter.title,
    publicSetup: encounter.publicSetup,
    combatants: structuredClone(encounter.combatants),
  };
}

function requireLoadedClue(room, clueId) {
  if (!room.adventure) {
    throw new Error("adventure_not_loaded");
  }
  if (!room.adventure.clues.some((clue) => clue.id === clueId)) {
    throw new Error(`clue not found: ${clueId}`);
  }
}

function requireLoadedScene(room, sceneId) {
  if (!room.adventure) {
    throw new Error("adventure_not_loaded");
  }
  if (!room.adventure.scenes.some((scene) => scene.id === sceneId)) {
    throw new Error(`scene not found: ${sceneId}`);
  }
}

function requireLoadedEncounter(room, encounterId) {
  if (!room.adventure) {
    throw new Error("adventure_not_loaded");
  }
  const encounter = room.adventure.encounters.find(
    (candidate) => candidate.id === encounterId,
  );
  if (!encounter) {
    throw new Error(`encounter not found: ${encounterId}`);
  }
  return encounter;
}

function buildCharacterCombatants(room, characterIds) {
  if (!Array.isArray(characterIds) || characterIds.length === 0) {
    throw new Error("characterIds are required");
  }

  return characterIds.map((characterId) => {
    const character = room.state.characters[characterId];
    if (!character) {
      throw new Error(`character not found: ${characterId}`);
    }

    return {
      id: `combatant_${character.id}`,
      sourceId: character.id,
      playerId: character.playerId,
      kind: "character",
      displayName: character.name,
      armorClass: character.armorClass,
      hitPoints: structuredClone(character.hitPoints),
      abilities: structuredClone(character.abilities),
      attacks: structuredClone(character.attacks),
      conditions: structuredClone(character.conditions),
      status: character.hitPoints.current === 0 ? "defeated" : "active",
    };
  });
}

function buildMonsterCombatants(encounter, compendiumEntries) {
  if (!Array.isArray(compendiumEntries)) {
    throw new Error("compendiumEntries are required");
  }

  const combatants = [];
  for (const encounterCombatant of encounter.combatants) {
    const entry = compendiumEntries.find(
      (candidate) => candidate.id === encounterCombatant.compendiumEntryId,
    );
    if (!entry) {
      throw new Error(`monster compendium entry not found: ${encounterCombatant.compendiumEntryId}`);
    }
    const monster = entry.structuredData;
    if (!monster) {
      throw new Error(`monster structured data missing: ${entry.id}`);
    }

    for (let index = 1; index <= encounterCombatant.count; index += 1) {
      combatants.push({
        id: `combatant_${entry.id}_${index}`,
        sourceId: entry.id,
        kind: "monster",
        displayName:
          encounterCombatant.count === 1 ? entry.name : `${entry.name} ${index}`,
        armorClass: monster.armorClass,
        hitPoints: {
          current: monster.hitPoints,
          max: monster.hitPoints,
          temporary: 0,
        },
        abilities: structuredClone(monster.abilities),
        attacks: monster.attacks.map((attack, attackIndex) => ({
          id: attack.id ?? `attack_${normalizeId(attack.name)}_${attackIndex + 1}`,
          ...structuredClone(attack),
        })),
        conditions: [],
        status: "active",
      });
    }
  }
  return combatants;
}

function requireActiveCombat(room) {
  if (!room.state.combat || room.state.combat.status !== "active") {
    throw new Error("active combat is required");
  }
  return room.state.combat;
}

function requireCombatant(combat, combatantId) {
  const combatant = combat.combatants.find(
    (candidate) => candidate.id === combatantId,
  );
  if (!combatant) {
    throw new Error(`combatant not found: ${combatantId}`);
  }
  return combatant;
}

function requireAttack(combatant, attackId) {
  const attack = combatant.attacks.find((candidate) => candidate.id === attackId);
  if (!attack) {
    throw new Error(`attack not found: ${attackId}`);
  }
  return attack;
}

function nextTurn(combat) {
  const combatants = combat.combatants;
  if (combatants.length === 0) {
    throw new Error("combat has no combatants");
  }

  let turnIndex = combat.turnIndex;
  let round = combat.round;
  for (let attempts = 0; attempts < combatants.length; attempts += 1) {
    turnIndex += 1;
    if (turnIndex >= combatants.length) {
      turnIndex = 0;
      round += 1;
    }

    const candidate = combatants[turnIndex];
    if (!["defeated", "dead", "fled"].includes(candidate.status)) {
      return {
        activeCombatantId: candidate.id,
        turnIndex,
        round,
      };
    }
  }

  return {
    activeCombatantId: combatants[combat.turnIndex].id,
    turnIndex: combat.turnIndex,
    round: combat.round,
  };
}

function combatantIndexById(combat, combatantId) {
  const index = combat.combatants.findIndex(
    (candidate) => candidate.id === combatantId,
  );
  if (index === -1) {
    throw new Error(`combatant not found: ${combatantId}`);
  }
  return index;
}

function patchConditions(currentConditions, condition, action) {
  if (!condition?.conditionId) {
    throw new Error("condition.conditionId is required");
  }

  if (action === "apply") {
    if (currentConditions.some((entry) => entry.conditionId === condition.conditionId)) {
      return structuredClone(currentConditions);
    }
    return [...structuredClone(currentConditions), structuredClone(condition)];
  }

  if (action === "remove") {
    return currentConditions.filter(
      (entry) => entry.conditionId !== condition.conditionId,
    );
  }

  throw new Error(`Unsupported condition action: ${action}`);
}

function normalizeId(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

function requirePresence(room, playerId) {
  const presence = room.presence.get(playerId);
  if (!presence) {
    throw new Error("player_not_found");
  }
  return presence;
}

function requireHost(room, playerId) {
  if (room.hostPlayerId !== playerId) {
    throw new Error("forbidden");
  }
}

function nextCounter(value) {
  return String(value).padStart(4, "0");
}
