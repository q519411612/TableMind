import assert from "node:assert/strict";
import { test } from "node:test";
import { createRoomEventStreamHub } from "../src/room-event-stream.mjs";

test("player event streams replace Host-only event details with generic snapshot updates", () => {
  const hub = createRoomEventStreamHub();
  const hostMessages = [];
  const playerMessages = [];
  const forbiddenTypes = [
    "host.review.created",
    "host.review.updated",
    "state.patch",
    "host.override",
  ];

  hub.subscribe({
    roomId: "room_test",
    viewerRole: "host",
    send: (message) => hostMessages.push(message),
  });
  hub.subscribe({
    roomId: "room_test",
    viewerRole: "player",
    viewerPlayerId: "player_0002",
    send: (message) => playerMessages.push(message),
  });

  hub.publish({
    roomId: "room_test",
    events: forbiddenTypes.map((type, index) => ({
      id: `event_${index + 1}`,
      sessionId: "session_test",
      sequence: index + 1,
      correlationId: `correlation_${index + 1}`,
      type,
      createdAt: "2026-06-02T14:00:00.000Z",
      reason: `Host-only ${type} detail.`,
      visibility: type.startsWith("host.review") ? undefined : "dm_only",
    })),
    snapshotForSubscriber(subscriber) {
      return {
        roomId: "room_test",
        viewerRole: subscriber.viewerRole,
        flags: {},
      };
    },
  });

  assert.deepEqual(
    hostMessages.map((message) => message.data.broadcast.event.type),
    forbiddenTypes,
  );
  assert.equal(playerMessages.length, forbiddenTypes.length);

  for (const message of playerMessages) {
    assert.equal(message.event, "room.broadcast");
    assert.equal(message.data.broadcast.event, undefined);
    assert.equal(message.data.broadcast.snapshot.viewerRole, "player");
    const serialized = JSON.stringify(message);
    for (const forbiddenType of forbiddenTypes) {
      assert.equal(serialized.includes(forbiddenType), false, forbiddenType);
    }
    assert.equal(serialized.includes("Host-only"), false);
  }
});
