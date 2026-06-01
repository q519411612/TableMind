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
      nextPlayerNumber: 2,
      nextEventNumber: 1,
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
    getPresence,
    getCommittedEvents,
    getSnapshot,
  };
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
