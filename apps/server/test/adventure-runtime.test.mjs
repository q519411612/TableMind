import assert from "node:assert/strict";
import { test } from "node:test";
import { loadAdventureFixture } from "../../../packages/adventure-loader/src/index.mjs";
import { createRoomService } from "../src/room-service.mjs";

async function createLoadedRoom() {
  const adventure = await loadAdventureFixture(
    "packages/shared-test-fixtures/adventures/the-lantern-beneath-the-hill.md",
  );
  const service = createRoomService();
  const room = service.createRoom({
    hostDisplayName: "Host",
    rulesetId: adventure.rulesetId,
    adventureModuleId: adventure.id,
    startingSceneId: adventure.startingSceneId,
    now: "2026-06-02T03:00:00.000Z",
  });
  const player = service.joinRoom({
    roomId: room.roomId,
    displayName: "Ada",
    now: "2026-06-02T03:01:00.000Z",
  });

  return { adventure, service, room, player };
}

test("host loads a demo adventure and sees current scene with DM-only context", async () => {
  const { adventure, service, room } = await createLoadedRoom();

  const loaded = service.loadAdventureModule({
    roomId: room.roomId,
    hostPlayerId: room.hostPlayerId,
    adventure,
    now: "2026-06-02T03:02:00.000Z",
  });
  const hostView = service.getAdventureSnapshot({
    roomId: room.roomId,
    viewerRole: "host",
  });

  assert.equal(loaded.adventureId, "adventure_lantern_beneath_hill");
  assert.equal(hostView.currentScene.id, "scene_village_square");
  assert.ok(hostView.currentScene.dmNotes.text.includes("old shrine record"));
  assert.ok(hostView.truth[0].text.includes("broke the shrine seal"));
  assert.equal(hostView.currentScene.clues[0].visibility, "dm_only");
});

test("player adventure snapshot hides truth, DM notes, and unrevealed clues", async () => {
  const { adventure, service, room, player } = await createLoadedRoom();
  service.loadAdventureModule({
    roomId: room.roomId,
    hostPlayerId: room.hostPlayerId,
    adventure,
    now: "2026-06-02T03:02:00.000Z",
  });

  const playerView = service.getAdventureSnapshot({
    roomId: room.roomId,
    viewerRole: "player",
    viewerPlayerId: player.playerId,
  });

  assert.equal(playerView.truth, undefined);
  assert.equal(playerView.currentScene.dmNotes, undefined);
  assert.equal(playerView.currentScene.clueIds, undefined);
  assert.equal(playerView.currentScene.npcIds, undefined);
  assert.equal(playerView.currentScene.encounterId, undefined);
  assert.deepEqual(playerView.currentScene.clues, []);
  assert.ok(playerView.currentScene.readAloud.text.includes("The village square"));
  assert.equal(JSON.stringify(playerView).includes("clue_old_record"), false);
  assert.equal(JSON.stringify(playerView).includes("npc_mayor_elric"), false);
  assert.equal(JSON.stringify(playerView).includes("encounter_hill_scavengers"), false);
});

test("revealed clues become visible to player projections through committed events", async () => {
  const { adventure, service, room, player } = await createLoadedRoom();
  service.loadAdventureModule({
    roomId: room.roomId,
    hostPlayerId: room.hostPlayerId,
    adventure,
    now: "2026-06-02T03:02:00.000Z",
  });

  const reveal = service.revealClue({
    roomId: room.roomId,
    hostPlayerId: room.hostPlayerId,
    clueId: "clue_old_record",
    now: "2026-06-02T03:03:00.000Z",
  });
  const playerView = service.getAdventureSnapshot({
    roomId: room.roomId,
    viewerRole: "player",
    viewerPlayerId: player.playerId,
  });

  assert.equal(reveal.event.type, "clue.revealed");
  assert.equal(reveal.event.sequence, 4);
  assert.deepEqual(
    playerView.currentScene.clues.map((clue) => [
      clue.publicHandle,
      clue.title,
      clue.id,
    ]),
    [["clue_1", "Old Record", undefined]],
  );
  assert.equal(JSON.stringify(playerView).includes("clue_old_record"), false);
});
