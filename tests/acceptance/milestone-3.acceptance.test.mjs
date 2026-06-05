import assert from "node:assert/strict";
import { test } from "node:test";
import { loadAdventureFixture } from "../../packages/adventure-loader/src/index.mjs";
import { createRoomService } from "../../apps/server/src/room-service.mjs";

test("milestone 3 simulates role-aware adventure execution", async () => {
  const adventure = await loadAdventureFixture(
    "packages/shared-test-fixtures/adventures/the-lantern-beneath-the-hill.md",
  );
  const service = createRoomService();
  const room = service.createRoom({
    hostDisplayName: "Host",
    rulesetId: adventure.rulesetId,
    adventureModuleId: adventure.id,
    startingSceneId: adventure.startingSceneId,
    now: "2026-06-02T04:00:00.000Z",
  });
  const player = service.joinRoom({
    roomId: room.roomId,
    displayName: "Ada",
    now: "2026-06-02T04:01:00.000Z",
  });

  service.loadAdventureModule({
    roomId: room.roomId,
    hostPlayerId: room.hostPlayerId,
    adventure,
    now: "2026-06-02T04:02:00.000Z",
  });
  const sceneChange = service.changeScene({
    roomId: room.roomId,
    hostPlayerId: room.hostPlayerId,
    sceneId: "scene_lantern_tower",
    now: "2026-06-02T04:03:00.000Z",
    reason: "The party reaches the lantern tower.",
  });
  service.revealClue({
    roomId: room.roomId,
    hostPlayerId: room.hostPlayerId,
    clueId: "clue_broken_lens",
    now: "2026-06-02T04:04:00.000Z",
  });

  const hostView = service.getAdventureSnapshot({
    roomId: room.roomId,
    viewerRole: "host",
  });
  const playerView = service.getAdventureSnapshot({
    roomId: room.roomId,
    viewerRole: "player",
    viewerPlayerId: player.playerId,
  });

  assert.equal(sceneChange.event.type, "scene.changed");
  assert.equal(sceneChange.event.sequence, 4);
  assert.equal(hostView.currentScene.id, "scene_lantern_tower");
  assert.ok(hostView.currentScene.dmNotes.text.includes("hatch below the tower"));
  assert.ok(hostView.currentScene.encounter.dmNotes.includes("flee"));
  assert.equal(playerView.truth, undefined);
  assert.equal(playerView.currentScene.dmNotes, undefined);
  assert.equal(playerView.currentScene.encounter.dmNotes, undefined);
  assert.deepEqual(
    playerView.currentScene.clues.map((clue) => [clue.id, clue.visibility]),
    [["clue_broken_lens", "revealed"]],
  );
  assert.deepEqual(
    service.getCommittedEvents(room.roomId).map((event) => [
      event.sequence,
      event.type,
    ]),
    [
      [1, "player.joined"],
      [2, "player.joined"],
      [3, "adventure.loaded"],
      [4, "scene.changed"],
      [5, "clue.revealed"],
    ],
  );
});
