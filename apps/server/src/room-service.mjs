import {
  appendSessionEvent,
  createCharacter,
  createInitialSessionState,
  projectSessionState,
} from "../../../packages/domain/src/index.mjs";

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
