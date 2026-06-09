import assert from "node:assert/strict";
import { test } from "node:test";
import { loadAdventureFixture } from "../../../packages/adventure-loader/src/index.mjs";
import { generateSessionRecap } from "../../../packages/session-recap/src/index.mjs";
import { createMockAiAdapter } from "../src/ai-dm-orchestrator.mjs";
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
      sessionToken: joined.data.playerSessionToken,
      payload: { text: "I inspect the lantern." },
      now: "2026-06-02T14:02:00.000Z",
    });
    await postJson(`${baseUrl}/rooms/${created.data.roomId}/actions`, {
      type: "ai.pause",
      sessionToken: created.data.hostSessionToken,
      payload: {
        paused: true,
        reason: "Host-only pause reason.",
      },
      now: "2026-06-02T14:03:00.000Z",
    });

    const hostSnapshot = await getJson(
      `${baseUrl}/rooms/${created.data.roomId}/snapshot?sessionToken=${encodeURIComponent(created.data.hostSessionToken)}`,
    );
    const playerSnapshotResponse = await fetch(
      `${baseUrl}/rooms/${created.data.roomId}/snapshot?sessionToken=${encodeURIComponent(joined.data.playerSessionToken)}`,
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

test("HTTP player adventure snapshot excludes unrevealed Host-only adventure truth", async () => {
  const service = createRoomService();
  const app = createHttpServer({
    dispatcher: createRoomActionDispatcher({
      roomService: service,
    }),
  });
  const adventure = await loadAdventureFixture(
    "packages/shared-test-fixtures/adventures/the-lantern-beneath-the-hill.md",
  );
  const { baseUrl } = await app.start();
  try {
    const created = await postJson(`${baseUrl}/rooms`, roomInput);
    const joined = await postJson(`${baseUrl}/rooms/${created.data.roomId}/join`, {
      displayName: "Ada",
      now: "2026-06-02T14:01:00.000Z",
    });
    await postJson(`${baseUrl}/rooms/${created.data.roomId}/actions`, {
      type: "adventure.load",
      sessionToken: created.data.hostSessionToken,
      payload: { adventure },
      now: "2026-06-02T14:02:00.000Z",
    });
    await postJson(`${baseUrl}/rooms/${created.data.roomId}/actions`, {
      type: "scene.change",
      sessionToken: created.data.hostSessionToken,
      payload: {
        sceneId: "scene_lantern_tower",
        reason: "Move to the tower for leak regression.",
      },
      now: "2026-06-02T14:03:00.000Z",
    });

    const playerResponse = await fetch(
      `${baseUrl}/rooms/${created.data.roomId}/adventure-snapshot?sessionToken=${encodeURIComponent(joined.data.playerSessionToken)}`,
    );
    const playerText = await playerResponse.text();
    const playerBody = JSON.parse(playerText);
    const hostBody = await getJson(
      `${baseUrl}/rooms/${created.data.roomId}/adventure-snapshot?sessionToken=${encodeURIComponent(created.data.hostSessionToken)}`,
    );

    assert.equal(playerResponse.status, 200);
    assert.equal(playerBody.snapshot.currentScene.id, "scene_lantern_tower");
    assert.equal(playerText.includes("broke the shrine seal"), false);
    assert.equal(playerText.includes("clue_broken_lens"), false);
    assert.equal(playerText.includes("clue_symbol_under_hatch"), false);
    assert.equal(playerText.includes("encounter_hill_scavengers"), false);
    assert.equal(playerText.includes("monster_hill_scavenger"), false);
    assert.equal(playerText.includes("npc_mira"), false);
    assert.equal(playerText.includes("combatants"), false);
    assert.equal(hostBody.snapshot.truth[0].text.includes("broke the shrine seal"), true);
    assert.equal(hostBody.snapshot.currentScene.encounter.id, "encounter_hill_scavengers");
    assert.equal(hostBody.snapshot.currentScene.encounter.combatants[0].compendiumEntryId, "monster_hill_scavenger");
  } finally {
    await app.stop();
  }
});

test("HTTP adventure snapshot localizes authored text without leaking player-hidden content", async () => {
  const service = createRoomService();
  const app = createHttpServer({
    dispatcher: createRoomActionDispatcher({
      roomService: service,
    }),
  });
  const adventure = await loadAdventureFixture(
    "packages/shared-test-fixtures/adventures/the-lantern-beneath-the-hill.md",
  );
  const { baseUrl } = await app.start();
  try {
    const created = await postJson(`${baseUrl}/rooms`, roomInput);
    const joined = await postJson(`${baseUrl}/rooms/${created.data.roomId}/join`, {
      displayName: "Ada",
      now: "2026-06-02T14:01:00.000Z",
    });
    await postJson(`${baseUrl}/rooms/${created.data.roomId}/actions`, {
      type: "adventure.load",
      sessionToken: created.data.hostSessionToken,
      payload: { adventure },
      now: "2026-06-02T14:02:00.000Z",
    });

    const playerResponse = await fetch(
      `${baseUrl}/rooms/${created.data.roomId}/adventure-snapshot?lang=zh-CN&sessionToken=${encodeURIComponent(joined.data.playerSessionToken)}`,
    );
    const playerText = await playerResponse.text();
    const playerBody = JSON.parse(playerText);
    const hostBody = await getJson(
      `${baseUrl}/rooms/${created.data.roomId}/adventure-snapshot?lang=zh-CN&sessionToken=${encodeURIComponent(created.data.hostSessionToken)}`,
    );

    assert.equal(playerResponse.status, 200);
    assert.equal(playerBody.snapshot.title, "山丘下的灯火");
    assert.equal(playerBody.snapshot.currentScene.title, "村庄广场");
    assert.ok(playerBody.snapshot.currentScene.readAloud.text.includes("潮湿的绳索"));
    assert.equal(playerText.includes("艾瑞克镇长希望"), false);
    assert.equal(playerText.includes("破损封印"), false);
    assert.equal(playerText.includes("clue_old_record"), false);
    assert.equal(hostBody.snapshot.currentScene.dmNotes.text.includes("艾瑞克镇长"), true);
    assert.equal(hostBody.snapshot.truth[0].title, "破损封印");
  } finally {
    await app.stop();
  }
});

test("HTTP snapshot derives viewer identity from session tokens and rejects Host impersonation", async () => {
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
    await postJson(`${baseUrl}/rooms/${created.data.roomId}/actions`, {
      type: "ai.pause",
      sessionToken: created.data.hostSessionToken,
      payload: {
        paused: true,
        reason: "Host-only pause reason.",
      },
      now: "2026-06-02T14:02:00.000Z",
    });

    const forgedHost = await fetch(
      `${baseUrl}/rooms/${created.data.roomId}/snapshot?viewerRole=host&viewerPlayerId=${joined.data.playerId}&sessionToken=${encodeURIComponent(joined.data.playerSessionToken)}`,
    );
    const noCredentialHost = await fetch(
      `${baseUrl}/rooms/${created.data.roomId}/snapshot?viewerRole=host`,
    );
    const playerSnapshot = await getJson(
      `${baseUrl}/rooms/${created.data.roomId}/snapshot?viewerPlayerId=${created.data.hostPlayerId}&sessionToken=${encodeURIComponent(joined.data.playerSessionToken)}`,
    );

    assert.equal(forgedHost.status, 403);
    assert.equal(noCredentialHost.status, 403);
    assert.equal(playerSnapshot.status, 403);
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
    const created = await postJson(`${baseUrl}/rooms`, roomInput);
    const response = await fetch(`${baseUrl}/rooms/${created.data.roomId}/actions`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        type: "dragon.arrive",
        sessionToken: created.data.hostSessionToken,
      }),
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

test("AI private messages stay out of player SSE transport and public recap", async () => {
  const service = createRoomService();
  const adventure = await loadAdventureFixture(
    "packages/shared-test-fixtures/adventures/the-lantern-beneath-the-hill.md",
  );
  const privatePayload = "PRIVATE THREAD: Mira broke the shrine seal.";
  const app = createHttpServer({
    dispatcher: createRoomActionDispatcher({
      roomService: service,
      aiAdapter: createMockAiAdapter({
        publicMessage: "Cold soot curls around the cracked lantern frame.",
        privateMessages: [
          {
            playerId: "player_0002",
            message: privatePayload,
          },
        ],
        confidence: "high",
      }),
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
      type: "adventure.load",
      sessionToken: created.data.hostSessionToken,
      payload: { adventure },
      now: "2026-06-02T14:02:00.000Z",
    });

    const streamResponse = await fetch(
      `${baseUrl}/rooms/${created.data.roomId}/events?sessionToken=${encodeURIComponent(joined.data.playerSessionToken)}`,
      { signal: streamAbort.signal },
    );
    const reader = streamResponse.body.getReader();
    await readSseEvent(reader);

    const aiResult = await postJson(`${baseUrl}/rooms/${created.data.roomId}/actions`, {
      type: "ai.turn.run",
      sessionToken: created.data.hostSessionToken,
      payload: {},
      now: "2026-06-02T14:03:00.000Z",
    });
    const broadcastEvent = await readSseEvent(reader);
    const events = service.getCommittedEvents(created.data.roomId);
    const hostState = service.getSnapshot({
      roomId: created.data.roomId,
      viewerRole: "host",
    });
    const playerRecap = generateSessionRecap({
      sessionState: hostState,
      events,
      adventure,
      viewerRole: "player",
    });

    assert.equal(aiResult.ok, true);
    assert.equal(aiResult.data.status, "broadcast_ready");
    assert.equal(JSON.stringify(broadcastEvent.data).includes(privatePayload), false);
    assert.equal(playerRecap.markdown.includes(privatePayload), false);
    assert.ok(playerRecap.markdown.includes("Cold soot curls around the cracked lantern frame."));

    await reader.cancel();
  } finally {
    streamAbort.abort();
    await app.stop();
  }
});

test("HTTP recap endpoint returns role-projected recaps", async () => {
  const service = createRoomService();
  const adventure = await loadAdventureFixture(
    "packages/shared-test-fixtures/adventures/the-lantern-beneath-the-hill.md",
  );
  const app = createHttpServer({
    dispatcher: createRoomActionDispatcher({
      roomService: service,
    }),
  });
  const { baseUrl } = await app.start();
  try {
    const created = await postJson(`${baseUrl}/rooms`, roomInput);
    const joined = await postJson(`${baseUrl}/rooms/${created.data.roomId}/join`, {
      displayName: "Ada",
      now: "2026-06-02T14:01:00.000Z",
    });
    await postJson(`${baseUrl}/rooms/${created.data.roomId}/actions`, {
      type: "adventure.load",
      sessionToken: created.data.hostSessionToken,
      payload: { adventure },
      now: "2026-06-02T14:02:00.000Z",
    });
    await postJson(`${baseUrl}/rooms/${created.data.roomId}/actions`, {
      type: "session.complete",
      sessionToken: created.data.hostSessionToken,
      payload: {
        ending: "Repair the Lantern",
        rewards: ["Village gratitude"],
      },
      now: "2026-06-02T14:03:00.000Z",
    });

    const playerRecapResponse = await fetch(
      `${baseUrl}/rooms/${created.data.roomId}/recap?locale=zh-CN&sessionToken=${encodeURIComponent(joined.data.playerSessionToken)}`,
    );
    const hostRecapResponse = await fetch(
      `${baseUrl}/rooms/${created.data.roomId}/recap?locale=zh-CN&sessionToken=${encodeURIComponent(created.data.hostSessionToken)}`,
    );
    const forgedHostRecapResponse = await fetch(
      `${baseUrl}/rooms/${created.data.roomId}/recap?viewerRole=host&sessionToken=${encodeURIComponent(joined.data.playerSessionToken)}`,
    );
    const playerText = await playerRecapResponse.text();
    const hostText = await hostRecapResponse.text();
    const playerRecap = JSON.parse(playerText);
    const hostRecap = JSON.parse(hostText);

    assert.equal(playerRecapResponse.status, 200);
    assert.equal(hostRecapResponse.status, 200);
    assert.equal(forgedHostRecapResponse.status, 403);
    assert.equal(playerRecap.data.recap.audience, "player");
    assert.equal(playerRecap.data.recap.locale, "zh-CN");
    assert.ok(playerRecap.data.recap.markdown.includes("受众：玩家"));
    assert.equal(playerText.includes("broke the shrine seal"), false);
    assert.equal(playerText.includes("Secret: Broken Seal"), false);
    assert.equal(playerText.includes("state.patch"), false);
    assert.equal(playerText.includes("host.review"), false);
    assert.equal(hostRecap.data.recap.audience, "host");
    assert.ok(hostRecap.data.recap.markdown.includes("秘密：破损封印"));
  } finally {
    await app.stop();
  }
});

test("HTTP adapter returns typed client errors for invalid JSON, oversized bodies, and unsupported media types", async () => {
  const app = createHttpServer({
    dispatcher: createRoomActionDispatcher({
      roomService: createRoomService(),
    }),
  });
  const { baseUrl } = await app.start();
  try {
    const invalidJson = await fetch(`${baseUrl}/rooms`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: '{"hostDisplayName"',
    });
    const invalidJsonBody = await invalidJson.json();

    const oversized = await fetch(`${baseUrl}/rooms`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ payload: "x".repeat(1_000_001) }),
    });
    const oversizedBody = await oversized.json();

    const unsupported = await fetch(`${baseUrl}/rooms`, {
      method: "POST",
      headers: { "content-type": "text/plain" },
      body: JSON.stringify(roomInput),
    });
    const unsupportedBody = await unsupported.json();

    assert.equal(invalidJson.status, 400);
    assert.equal(invalidJsonBody.error.code, "bad_request");
    assert.equal(invalidJsonBody.error.message, "Invalid JSON body");
    assert.equal(oversized.status, 413);
    assert.equal(oversizedBody.error.code, "payload_too_large");
    assert.equal(unsupported.status, 415);
    assert.equal(unsupportedBody.error.code, "unsupported_media_type");
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
      sessionToken: created.data.hostSessionToken,
      payload: {
        paused: true,
        reason: "Host-only pause reason.",
      },
      now: "2026-06-02T14:02:00.000Z",
    });

    const streamResponse = await fetch(
      `${baseUrl}/rooms/${created.data.roomId}/events?sessionToken=${encodeURIComponent(joined.data.playerSessionToken)}`,
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
      sessionToken: joined.data.playerSessionToken,
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
      sessionToken: joined.data.playerSessionToken,
      now: "2026-06-02T14:04:00.000Z",
    });
    const snapshotAfterReconnect = await getJson(
      `${baseUrl}/rooms/${created.data.roomId}/snapshot?sessionToken=${encodeURIComponent(joined.data.playerSessionToken)}`,
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

test("SSE rejects Host subscriptions without Host session credentials", async () => {
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

    const noCredential = await fetch(
      `${baseUrl}/rooms/${created.data.roomId}/events?viewerRole=host`,
    );
    const forgedByPlayer = await fetch(
      `${baseUrl}/rooms/${created.data.roomId}/events?viewerRole=host&sessionToken=${encodeURIComponent(joined.data.playerSessionToken)}`,
    );

    assert.equal(noCredential.status, 403);
    assert.equal(forgedByPlayer.status, 403);
    assert.deepEqual(await noCredential.json(), {
      ok: false,
      commandType: "room.snapshot",
      error: {
        code: "forbidden",
        message: "forbidden",
      },
    });
  } finally {
    await app.stop();
  }
});

test("SSE publishes state-changing commands as role-specific snapshots without overwriting Host projection", async () => {
  const app = createHttpServer({
    dispatcher: createRoomActionDispatcher({
      roomService: createRoomService(),
    }),
  });
  const { baseUrl } = await app.start();
  const hostAbort = new AbortController();
  const playerAbort = new AbortController();
  try {
    const created = await postJson(`${baseUrl}/rooms`, roomInput);
    const joined = await postJson(`${baseUrl}/rooms/${created.data.roomId}/join`, {
      displayName: "Ada",
      now: "2026-06-02T14:01:00.000Z",
    });

    const hostStream = await fetch(
      `${baseUrl}/rooms/${created.data.roomId}/events?sessionToken=${encodeURIComponent(created.data.hostSessionToken)}`,
      { signal: hostAbort.signal },
    );
    const playerStream = await fetch(
      `${baseUrl}/rooms/${created.data.roomId}/events?sessionToken=${encodeURIComponent(joined.data.playerSessionToken)}`,
      { signal: playerAbort.signal },
    );
    const hostReader = hostStream.body.getReader();
    const playerReader = playerStream.body.getReader();
    await readSseEvent(hostReader);
    await readSseEvent(playerReader);

    await postJson(`${baseUrl}/rooms/${created.data.roomId}/actions`, {
      type: "ai.pause",
      sessionToken: created.data.hostSessionToken,
      payload: {
        paused: true,
        reason: "Host-only pause reason.",
      },
      now: "2026-06-02T14:02:00.000Z",
    });

    const hostBroadcast = await readSseEvent(hostReader);
    const playerBroadcast = await readSseEvent(playerReader);

    assert.equal(hostBroadcast.event, "room.broadcast");
    assert.equal(hostBroadcast.data.broadcast.event.type, "state.patch");
    assert.equal(hostBroadcast.data.broadcast.snapshot.flags.aiPaused.value, true);
    assert.equal(playerBroadcast.event, "room.broadcast");
    assert.equal(playerBroadcast.data.broadcast.event, undefined);
    assert.equal(playerBroadcast.data.broadcast.snapshot.flags.aiPaused, undefined);
    assert.equal(JSON.stringify(playerBroadcast).includes("state.patch"), false);
    assert.equal(JSON.stringify(playerBroadcast).includes("Host-only pause reason."), false);

    await hostReader.cancel();
    await playerReader.cancel();
  } finally {
    hostAbort.abort();
    playerAbort.abort();
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
