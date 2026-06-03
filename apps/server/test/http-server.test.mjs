import assert from "node:assert/strict";
import { test } from "node:test";
import { createHttpServer } from "../src/http-server.mjs";
import { createRoomActionDispatcher } from "../src/room-actions.mjs";
import { createRoomService } from "../src/room-service.mjs";

const roomInput = {
  hostDisplayName: "Host",
  rulesetId: "5e-srd-5.2.1",
  adventureModuleId: "adventure_lantern_beneath_hill",
  startingSceneId: "scene_village_square",
  now: "2026-06-02T14:00:00.000Z",
};

test("HTTP adapter creates room, joins player, sends action, and returns projected snapshots", async () => {
  const app = createHttpServer({
    dispatcher: createRoomActionDispatcher({
      roomService: createRoomService(),
    }),
  });
  const { baseUrl } = await app.start();
  try {
    const created = await postJson(`${baseUrl}/rooms`, roomInput);
    const joined = await postJson(`${baseUrl}/rooms/${created.data.roomId}/join`, {
      displayName: "Ada",
      now: "2026-06-02T14:01:00.000Z",
    });
    const message = await postJson(`${baseUrl}/rooms/${created.data.roomId}/actions`, {
      type: "message.send",
      actorPlayerId: joined.data.playerId,
      payload: { text: "I inspect the lantern." },
      now: "2026-06-02T14:02:00.000Z",
    });
    await postJson(`${baseUrl}/rooms/${created.data.roomId}/actions`, {
      type: "ai.pause",
      actorPlayerId: created.data.hostPlayerId,
      payload: {
        paused: true,
        reason: "Host-only pause reason.",
      },
      now: "2026-06-02T14:03:00.000Z",
    });

    const hostSnapshot = await getJson(
      `${baseUrl}/rooms/${created.data.roomId}/snapshot?viewerRole=host`,
    );
    const playerSnapshotResponse = await fetch(
      `${baseUrl}/rooms/${created.data.roomId}/snapshot?viewerRole=player&viewerPlayerId=${joined.data.playerId}`,
    );
    const playerSnapshotText = await playerSnapshotResponse.text();
    const playerSnapshot = JSON.parse(playerSnapshotText);

    assert.equal(created.status, 200);
    assert.equal(joined.status, 200);
    assert.equal(message.events[0].type, "player.message");
    assert.equal(hostSnapshot.snapshot.flags.aiPaused.value, true);
    assert.equal(playerSnapshot.snapshot.flags.aiPaused, undefined);
    assert.equal(playerSnapshotText.includes("Host-only pause reason."), false);
  } finally {
    await app.stop();
  }
});

test("HTTP adapter returns structured errors without crashing", async () => {
  const app = createHttpServer({
    dispatcher: createRoomActionDispatcher({
      roomService: createRoomService(),
    }),
  });
  const { baseUrl } = await app.start();
  try {
    const response = await fetch(`${baseUrl}/rooms/room_missing/actions`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ type: "dragon.arrive" }),
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(body, {
      ok: false,
      commandType: "dragon.arrive",
      error: {
        code: "unknown_command",
        message: "Unsupported room command: dragon.arrive",
      },
    });
  } finally {
    await app.stop();
  }
});

test("SSE stream sends player-safe snapshots and public broadcasts", async () => {
  const app = createHttpServer({
    dispatcher: createRoomActionDispatcher({
      roomService: createRoomService(),
    }),
  });
  const { baseUrl } = await app.start();
  const streamAbort = new AbortController();
  try {
    const created = await postJson(`${baseUrl}/rooms`, roomInput);
    const joined = await postJson(`${baseUrl}/rooms/${created.data.roomId}/join`, {
      displayName: "Ada",
      now: "2026-06-02T14:01:00.000Z",
    });
    await postJson(`${baseUrl}/rooms/${created.data.roomId}/actions`, {
      type: "ai.pause",
      actorPlayerId: created.data.hostPlayerId,
      payload: {
        paused: true,
        reason: "Host-only pause reason.",
      },
      now: "2026-06-02T14:02:00.000Z",
    });

    const streamResponse = await fetch(
      `${baseUrl}/rooms/${created.data.roomId}/events?viewerRole=player&viewerPlayerId=${joined.data.playerId}`,
      { signal: streamAbort.signal },
    );
    const reader = streamResponse.body.getReader();
    const snapshotEvent = await readSseEvent(reader);

    assert.equal(streamResponse.status, 200);
    assert.equal(snapshotEvent.event, "room.snapshot");
    assert.equal(snapshotEvent.data.snapshot.flags.aiPaused, undefined);
    assert.equal(JSON.stringify(snapshotEvent.data).includes("Host-only pause reason."), false);

    await postJson(`${baseUrl}/rooms/${created.data.roomId}/actions`, {
      type: "message.send",
      actorPlayerId: joined.data.playerId,
      payload: { text: "I inspect the lantern." },
      now: "2026-06-02T14:03:00.000Z",
    });
    const broadcastEvent = await readSseEvent(reader);

    assert.equal(broadcastEvent.event, "room.broadcast");
    assert.equal(broadcastEvent.data.broadcast.event.type, "player.message");
    assert.equal(broadcastEvent.data.broadcast.snapshot.flags.aiPaused, undefined);
    assert.equal(JSON.stringify(broadcastEvent.data).includes("Host-only pause reason."), false);

    await reader.cancel();
    streamAbort.abort();
    await postJson(`${baseUrl}/rooms/${created.data.roomId}/actions`, {
      type: "room.reconnect",
      actorPlayerId: joined.data.playerId,
      now: "2026-06-02T14:04:00.000Z",
    });
    const snapshotAfterReconnect = await getJson(
      `${baseUrl}/rooms/${created.data.roomId}/snapshot?viewerRole=player&viewerPlayerId=${joined.data.playerId}`,
    );

    assert.equal(snapshotAfterReconnect.status, 200);
    assert.equal(snapshotAfterReconnect.snapshot.flags.aiPaused, undefined);
    assert.equal(
      JSON.stringify(snapshotAfterReconnect).includes("Host-only pause reason."),
      false,
    );
  } finally {
    streamAbort.abort();
    await app.stop();
  }
});

async function postJson(url, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return {
    status: response.status,
    ...(await response.json()),
  };
}

async function getJson(url) {
  const response = await fetch(url);
  return {
    status: response.status,
    ...(await response.json()),
  };
}

async function readSseEvent(reader) {
  const decoder = new TextDecoder();
  let buffer = "";

  while (!buffer.includes("\n\n")) {
    const read = await reader.read();
    if (read.done) {
      throw new Error("SSE stream closed before an event was received");
    }
    buffer += decoder.decode(read.value, { stream: true });
  }

  const [rawEvent] = buffer.split("\n\n");
  const lines = rawEvent.split("\n");
  const eventName = lines
    .find((line) => line.startsWith("event: "))
    ?.slice("event: ".length);
  const data = lines
    .filter((line) => line.startsWith("data: "))
    .map((line) => line.slice("data: ".length))
    .join("\n");

  return {
    event: eventName,
    data: JSON.parse(data),
  };
}
