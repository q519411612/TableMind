import assert from "node:assert/strict";
import { test } from "node:test";
import { createRoomActionDispatcher } from "../src/room-actions.mjs";
import { createRoomService } from "../src/room-service.mjs";

const roomInput = {
  hostDisplayName: "Host",
  rulesetId: "5e-srd-5.2.1",
  adventureModuleId: "adventure_lantern_beneath_hill",
  startingSceneId: "scene_village_square",
};

test("dispatcher returns typed success results with events and broadcasts", () => {
  const dispatcher = createRoomActionDispatcher({
    roomService: createRoomService(),
  });
  const created = dispatcher.dispatchRoomCommand({
    type: "room.create",
    now: "2026-06-02T13:00:00.000Z",
    payload: roomInput,
  });
  const joined = dispatcher.dispatchRoomCommand({
    type: "room.join",
    roomId: created.data.roomId,
    now: "2026-06-02T13:01:00.000Z",
    payload: { displayName: "Ada" },
  });
  const message = dispatcher.dispatchRoomCommand({
    type: "message.send",
    roomId: created.data.roomId,
    actorPlayerId: joined.data.playerId,
    now: "2026-06-02T13:02:00.000Z",
    payload: { text: "I inspect the lantern." },
  });

  assert.equal(created.ok, true);
  assert.equal(created.commandType, "room.create");
  assert.equal(created.events[0].type, "player.joined");
  assert.equal(joined.events[0].type, "player.joined");
  assert.equal(message.events[0].type, "player.message");
  assert.deepEqual(
    message.broadcasts.map((broadcast) => [broadcast.playerId, broadcast.event.type]),
    [
      [created.data.hostPlayerId, "player.message"],
      [joined.data.playerId, "player.message"],
    ],
  );
  assert.equal(message.snapshot.players[joined.data.playerId].displayName, "Ada");
});

test("dispatcher maps Host-only command attempts to typed forbidden errors", () => {
  const dispatcher = createRoomActionDispatcher({
    roomService: createRoomService(),
  });
  const created = dispatcher.dispatchRoomCommand({
    type: "room.create",
    now: "2026-06-02T13:00:00.000Z",
    payload: roomInput,
  });
  const joined = dispatcher.dispatchRoomCommand({
    type: "room.join",
    roomId: created.data.roomId,
    now: "2026-06-02T13:01:00.000Z",
    payload: { displayName: "Ada" },
  });
  const result = dispatcher.dispatchRoomCommand({
    type: "session.start",
    roomId: created.data.roomId,
    actorPlayerId: joined.data.playerId,
    now: "2026-06-02T13:02:00.000Z",
  });

  assert.deepEqual(result, {
    ok: false,
    commandType: "session.start",
    error: {
      code: "forbidden",
      message: "forbidden",
    },
  });
});

test("dispatcher rejects unknown commands and missing player actors", () => {
  const dispatcher = createRoomActionDispatcher({
    roomService: createRoomService(),
  });

  assert.deepEqual(dispatcher.dispatchRoomCommand({ type: "dragon.arrive" }), {
    ok: false,
    commandType: "dragon.arrive",
    error: {
      code: "unknown_command",
      message: "Unsupported room command: dragon.arrive",
    },
  });
  assert.deepEqual(
    dispatcher.dispatchRoomCommand({
      type: "message.send",
      roomId: "room_0001",
      now: "2026-06-02T13:02:00.000Z",
      payload: { text: "Hello." },
    }),
    {
      ok: false,
      commandType: "message.send",
      error: {
        code: "bad_request",
        message: "actorPlayerId is required",
      },
    },
  );
});

test("dispatcher validates command payload contracts before mutating state", () => {
  const dispatcher = createRoomActionDispatcher({
    roomService: createRoomService(),
  });
  const created = dispatcher.dispatchRoomCommand({
    type: "room.create",
    now: "2026-06-02T13:00:00.000Z",
    payload: roomInput,
  });
  const joined = dispatcher.dispatchRoomCommand({
    type: "room.join",
    roomId: created.data.roomId,
    now: "2026-06-02T13:01:00.000Z",
    payload: { displayName: "Ada" },
  });

  const missingText = dispatcher.dispatchRoomCommand({
    type: "message.send",
    roomId: created.data.roomId,
    actorPlayerId: joined.data.playerId,
    now: "2026-06-02T13:02:00.000Z",
    payload: {},
  });
  const invalidCondition = dispatcher.dispatchRoomCommand({
    type: "combat.patch_condition",
    roomId: created.data.roomId,
    actorPlayerId: created.data.hostPlayerId,
    now: "2026-06-02T13:03:00.000Z",
    payload: {
      combatantId: "combatant_missing",
      condition: "condition_prone",
      action: "apply",
      reason: "Invalid contract.",
    },
  });

  assert.equal(missingText.ok, false);
  assert.equal(missingText.error.code, "bad_request");
  assert.match(missingText.error.message, /payload.text/);
  assert.equal(invalidCondition.ok, false);
  assert.equal(invalidCondition.error.code, "bad_request");
  assert.match(invalidCondition.error.message, /payload.condition.conditionId/);
});

test("dispatcher snapshots are role projected", () => {
  const roomService = createRoomService();
  const dispatcher = createRoomActionDispatcher({ roomService });
  const created = dispatcher.dispatchRoomCommand({
    type: "room.create",
    now: "2026-06-02T13:00:00.000Z",
    payload: roomInput,
  });
  const joined = dispatcher.dispatchRoomCommand({
    type: "room.join",
    roomId: created.data.roomId,
    now: "2026-06-02T13:01:00.000Z",
    payload: { displayName: "Ada" },
  });
  roomService.setRoomFlag({
    roomId: created.data.roomId,
    key: "hiddenTruth",
    value: {
      visibility: "dm_only",
      value: "Mira broke the shrine seal.",
    },
  });

  const playerSnapshot = dispatcher.dispatchRoomCommand({
    type: "room.snapshot",
    roomId: created.data.roomId,
    viewerRole: "player",
    viewerPlayerId: joined.data.playerId,
  });
  const hostSnapshot = dispatcher.dispatchRoomCommand({
    type: "room.snapshot",
    roomId: created.data.roomId,
    viewerRole: "host",
  });

  assert.equal(playerSnapshot.snapshot.flags.hiddenTruth, undefined);
  assert.equal(hostSnapshot.snapshot.flags.hiddenTruth.value, "Mira broke the shrine seal.");
});

test("dispatcher exposes Host review list only to the Host actor", () => {
  const roomService = createRoomService();
  const dispatcher = createRoomActionDispatcher({ roomService });
  const created = dispatcher.dispatchRoomCommand({
    type: "room.create",
    now: "2026-06-02T13:00:00.000Z",
    payload: roomInput,
  });
  const joined = dispatcher.dispatchRoomCommand({
    type: "room.join",
    roomId: created.data.roomId,
    now: "2026-06-02T13:01:00.000Z",
    payload: { displayName: "Ada" },
  });
  roomService.addHostReviewItem({
    roomId: created.data.roomId,
    type: "ai_output",
    proposedPayload: { publicMessage: "The lantern flickers." },
    reason: "AI confidence is low.",
    riskLevel: "medium",
    now: "2026-06-02T13:02:00.000Z",
  });

  const hostList = dispatcher.dispatchRoomCommand({
    type: "host.review.list",
    roomId: created.data.roomId,
    actorPlayerId: created.data.hostPlayerId,
    now: "2026-06-02T13:03:00.000Z",
  });
  const playerList = dispatcher.dispatchRoomCommand({
    type: "host.review.list",
    roomId: created.data.roomId,
    actorPlayerId: joined.data.playerId,
    now: "2026-06-02T13:03:00.000Z",
  });

  assert.equal(hostList.ok, true);
  assert.equal(hostList.data.reviewQueue[0].reason, "AI confidence is low.");
  assert.deepEqual(playerList, {
    ok: false,
    commandType: "host.review.list",
    error: {
      code: "forbidden",
      message: "forbidden",
    },
  });
});
