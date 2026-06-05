import { createSequenceRandomSource } from "../../../packages/rules-engine/src/index.mjs";
import { runAiTurnForRoom } from "./ai-room-runner.mjs";

const knownErrorCodes = new Set([
  "adventure_not_loaded",
  "forbidden",
  "invalid_combat_action",
  "invalid_room_phase",
  "player_not_found",
  "review_item_not_approved",
  "review_item_not_found",
  "room_not_found",
]);

export function createRoomActionDispatcher(input) {
  const roomService = input.roomService;
  if (!roomService) {
    throw new Error("roomService is required");
  }

  function dispatchRoomCommand(command) {
    const commandType = command?.type ?? "unknown";
    try {
      if (!command || typeof command !== "object") {
        throw commandError("bad_request", "command is required");
      }

      const result = dispatchKnownCommand(command);
      if (result && typeof result.then === "function") {
        return result
          .then((resolved) => successResult(command.type, resolved))
          .catch((error) => errorResult(commandType, error));
      }
      return successResult(command.type, result);
    } catch (error) {
      return errorResult(commandType, error);
    }
  }

  function dispatchKnownCommand(command) {
    const payload = command.payload ?? {};
    validateCommandPayload(command.type, payload);
    switch (command.type) {
      case "room.create": {
        const result = roomService.createRoom({
          ...payload,
          now: requireNow(command),
        });
        return {
          ...result,
          events: roomService.getCommittedEvents(result.roomId).slice(-1),
        };
      }
      case "room.join":
        return roomService.joinRoom({
          roomId: requireRoomId(command),
          displayName: payload.displayName,
          now: requireNow(command),
        });
      case "room.leave":
        return roomService.leaveRoom({
          roomId: requireRoomId(command),
          playerId: requireActor(command),
          now: requireNow(command),
        });
      case "room.reconnect":
        return roomService.reconnect({
          roomId: requireRoomId(command),
          playerId: requireActor(command),
          now: requireNow(command),
        });
      case "room.snapshot":
        return {
          snapshot: roomService.getSnapshot({
            roomId: requireRoomId(command),
            viewerRole: command.viewerRole,
            viewerPlayerId: command.viewerPlayerId,
          }),
        };
      case "message.send":
        return roomService.sendPublicMessage({
          roomId: requireRoomId(command),
          playerId: requireActor(command),
          text: payload.text,
          now: requireNow(command),
        });
      case "character.create":
        return roomService.createCharacterForPlayer({
          roomId: requireRoomId(command),
          playerId: requireActor(command),
          character: payload.character,
          now: requireNow(command),
        });
      case "adventure.load":
        return roomService.loadAdventureModule({
          roomId: requireRoomId(command),
          hostPlayerId: requireActor(command),
          adventure: payload.adventure,
          now: requireNow(command),
        });
      case "adventure.snapshot":
        return {
          snapshot: roomService.getAdventureSnapshot({
            roomId: requireRoomId(command),
            viewerRole: command.viewerRole,
            viewerPlayerId: command.viewerPlayerId,
          }),
        };
      case "session.start":
        return roomService.startSession({
          roomId: requireRoomId(command),
          hostPlayerId: requireActor(command),
          now: requireNow(command),
        });
      case "scene.change":
        return roomService.changeScene({
          roomId: requireRoomId(command),
          hostPlayerId: requireActor(command),
          sceneId: payload.sceneId,
          reason: payload.reason,
          now: requireNow(command),
        });
      case "clue.reveal":
        return roomService.revealClue({
          roomId: requireRoomId(command),
          hostPlayerId: requireActor(command),
          clueId: payload.clueId,
          now: requireNow(command),
        });
      case "combat.start":
        return roomService.startCombatFromEncounter({
          roomId: requireRoomId(command),
          hostPlayerId: requireActor(command),
          encounterId: payload.encounterId,
          characterIds: payload.characterIds,
          compendiumEntries: payload.compendiumEntries,
          randomSource: randomSourceFromPayload(payload),
          now: requireNow(command),
        });
      case "combat.attack":
        return roomService.resolveCombatAttack({
          roomId: requireRoomId(command),
          actorPlayerId: requireActor(command),
          attackerCombatantId: payload.attackerCombatantId,
          targetCombatantId: payload.targetCombatantId,
          attackId: payload.attackId,
          advantage: payload.advantage,
          reason: payload.reason,
          randomSource: randomSourceFromPayload(payload),
          now: requireNow(command),
        });
      case "combat.attack_override":
        return roomService.resolveCombatAttack({
          roomId: requireRoomId(command),
          actorPlayerId: requireHostActor(command, roomService),
          attackerCombatantId: payload.attackerCombatantId,
          targetCombatantId: payload.targetCombatantId,
          attackId: payload.attackId,
          advantage: payload.advantage,
          reason: payload.reason,
          hostOverrideReason: requirePayloadString(payload, "reason"),
          randomSource: randomSourceFromPayload(payload),
          now: requireNow(command),
        });
      case "combat.advance_turn":
        return roomService.advanceCombatTurn({
          roomId: requireRoomId(command),
          hostPlayerId: requireActor(command),
          now: requireNow(command),
        });
      case "combat.patch_hp":
        return roomService.patchCombatantHitPoints({
          roomId: requireRoomId(command),
          hostPlayerId: requireActor(command),
          combatantId: payload.combatantId,
          currentHp: payload.currentHp,
          reason: payload.reason,
          now: requireNow(command),
        });
      case "combat.patch_condition":
        return roomService.patchCombatantCondition({
          roomId: requireRoomId(command),
          hostPlayerId: requireActor(command),
          combatantId: payload.combatantId,
          condition: payload.condition,
          action: payload.action,
          reason: payload.reason,
          now: requireNow(command),
        });
      case "combat.end":
        return roomService.endCombat({
          roomId: requireRoomId(command),
          hostPlayerId: requireActor(command),
          reason: payload.reason,
          now: requireNow(command),
        });
      case "ai.pause":
        return roomService.setAiPaused({
          roomId: requireRoomId(command),
          hostPlayerId: requireActor(command),
          paused: payload.paused,
          reason: payload.reason,
          now: requireNow(command),
        });
      case "host.review.update":
        return roomService.updateHostReviewItem({
          roomId: requireRoomId(command),
          hostPlayerId: requireActor(command),
          itemId: payload.itemId,
          action: payload.action,
          reason: payload.reason,
          proposedPayload: payload.proposedPayload,
          now: requireNow(command),
        });
      case "host.review.list":
        return {
          reviewQueue: roomService.getHostReviewQueue({
            roomId: requireRoomId(command),
            hostPlayerId: requireHostActor(command, roomService),
          }),
        };
      case "ai.turn.run":
        return runAiTurnForRoom({
          roomService,
          roomId: requireRoomId(command),
          hostPlayerId: requireHostActor(command, roomService),
          adapter: payload.adapter ?? input.aiAdapter,
          providerConfig: payload.providerConfig ?? input.providerConfig,
          randomSource: randomSourceFromPayload(payload),
          now: requireNow(command),
        });
      case "ai.message.commit":
        return roomService.commitApprovedAiMessage({
          roomId: requireRoomId(command),
          hostPlayerId: requireActor(command),
          reviewItemId: payload.reviewItemId,
          message: payload.message,
          reviewStatus: payload.reviewStatus,
          now: requireNow(command),
        });
      case "dice.commit":
        requireActor(command);
        throw commandError("forbidden", "forbidden");
      case "dice.override_commit":
        requirePayloadString(payload, "reason");
        return roomService.commitDiceRoll({
          roomId: requireRoomId(command),
          hostPlayerId: requireHostActor(command, roomService),
          roll: payload.roll,
          reason: payload.reason,
          now: requireNow(command),
        });
      case "session.complete":
        return roomService.completeSession({
          roomId: requireRoomId(command),
          hostPlayerId: requireActor(command),
          ending: payload.ending,
          rewards: payload.rewards,
          now: requireNow(command),
        });
      default:
        throw commandError(
          "unknown_command",
          `Unsupported room command: ${command.type}`,
        );
    }
  }

  return { dispatchRoomCommand, roomService };
}

function successResult(commandType, result) {
  const events = collectEvents(result);
  const output = {
    ok: true,
    commandType,
    events,
    broadcasts: result.broadcasts ?? [],
    snapshot: result.snapshot,
    data: stripTransportFields(result),
  };
  validateCommandSuccessResult(output);
  return output;
}

function collectEvents(result) {
  if (Array.isArray(result.events)) {
    return structuredClone(result.events);
  }

  return ["event", "attackEvent", "damageEvent"]
    .map((key) => result[key])
    .filter(Boolean)
    .map((event) => structuredClone(event));
}

function stripTransportFields(result) {
  const output = { ...result };
  delete output.event;
  delete output.events;
  delete output.attackEvent;
  delete output.damageEvent;
  delete output.broadcasts;
  delete output.snapshot;
  return structuredClone(output);
}

function errorResult(commandType, error) {
  const code = error.code ?? error.message;
  if (code === "unknown_command") {
    return typedError(commandType, "unknown_command", error.message);
  }
  if (code === "bad_request") {
    return typedError(commandType, "bad_request", error.message);
  }
  if (knownErrorCodes.has(code)) {
    return typedError(commandType, code, code);
  }
  return typedError(commandType, "internal_error", error.message);
}

function typedError(commandType, code, message) {
  return {
    ok: false,
    commandType,
    error: { code, message },
  };
}

function requireRoomId(command) {
  if (!command.roomId) {
    throw commandError("bad_request", "roomId is required");
  }
  return command.roomId;
}

function requireActor(command) {
  if (!command.actorPlayerId) {
    throw commandError("bad_request", "actorPlayerId is required");
  }
  return command.actorPlayerId;
}

function validateCommandPayload(type, payload) {
  if (!payload || typeof payload !== "object") {
    throw commandError("bad_request", "payload must be an object");
  }
  if (type === "message.send") {
    if (typeof payload.text !== "string" || payload.text.length === 0) {
      throw commandError("bad_request", "payload.text is required");
    }
  }
  if (type === "combat.patch_condition") {
    requirePayloadString(payload, "combatantId");
    requirePayloadString(payload, "action");
    requirePayloadString(payload, "reason");
    if (
      !payload.condition ||
      typeof payload.condition !== "object" ||
      typeof payload.condition.conditionId !== "string" ||
      payload.condition.conditionId.length === 0
    ) {
      throw commandError("bad_request", "payload.condition.conditionId is required");
    }
    if (!["apply", "remove"].includes(payload.action)) {
      throw commandError("bad_request", "payload.action must be apply or remove");
    }
  }
  if (type === "ai.turn.run" && payload.adapter !== undefined) {
    if (
      !payload.adapter ||
      typeof payload.adapter.generateStructuredResponse !== "function"
    ) {
      throw commandError("bad_request", "payload.adapter must be an AI adapter");
    }
  }
}

function validateCommandSuccessResult(result) {
  if (result.ok !== true) {
    throw new Error("Command success result must set ok true");
  }
  if (typeof result.commandType !== "string" || result.commandType.length === 0) {
    throw new Error("Command success result requires commandType");
  }
  if (!Array.isArray(result.events)) {
    throw new Error("Command success result requires events array");
  }
  if (!Array.isArray(result.broadcasts)) {
    throw new Error("Command success result requires broadcasts array");
  }
  if (result.snapshot !== undefined) {
    validateSnapshotShape(result.snapshot);
  }
}

function validateSnapshotShape(snapshot) {
  if (!snapshot || typeof snapshot !== "object") {
    throw new Error("snapshot must be an object");
  }
  if (snapshot.roomId !== undefined && typeof snapshot.roomId !== "string") {
    throw new Error("snapshot.roomId must be a string");
  }
  if (snapshot.phase !== undefined && typeof snapshot.phase !== "string") {
    throw new Error("snapshot.phase must be a string");
  }
  if (snapshot.players !== undefined && typeof snapshot.players !== "object") {
    throw new Error("snapshot.players must be an object");
  }
}

function requireHostActor(command, roomService) {
  const actorPlayerId = requireActor(command);
  const roomId = requireRoomId(command);
  const snapshot = roomService.getSnapshot({
    roomId,
    viewerRole: "host",
  });
  if (snapshot.players[actorPlayerId]?.role !== "host") {
    throw commandError("forbidden", "forbidden");
  }
  return actorPlayerId;
}

function requireNow(command) {
  if (!command.now) {
    throw commandError("bad_request", "now is required");
  }
  return command.now;
}

function requirePayloadString(payload, key) {
  if (typeof payload?.[key] !== "string" || payload[key].length === 0) {
    throw commandError("bad_request", `${key} is required`);
  }
  return payload[key];
}

function randomSourceFromPayload(payload) {
  if (payload.randomSource) {
    return payload.randomSource;
  }
  if (payload.randomValues !== undefined) {
    return createSequenceRandomSource(payload.randomValues);
  }
  return undefined;
}

function commandError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}
