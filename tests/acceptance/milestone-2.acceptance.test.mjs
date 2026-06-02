import assert from "node:assert/strict";
import { test } from "node:test";
import { loadAdventureFixture } from "../../packages/adventure-loader/src/index.mjs";
import { createRoomService } from "../../apps/server/src/room-service.mjs";

const demoCharacter = {
  id: "char_ada",
  name: "Ada Thorne",
  className: "Fighter",
  level: 1,
  abilities: {
    strength: 14,
    dexterity: 12,
    constitution: 14,
    intelligence: 10,
    wisdom: 11,
    charisma: 8,
  },
  armorClass: 16,
  hitPoints: {
    current: 12,
    max: 12,
    temporary: 0,
  },
  speed: 30,
  savingThrowProficiencies: ["strength", "constitution"],
  skillProficiencies: ["athletics", "perception"],
  attacks: [
    {
      id: "attack_longsword",
      name: "Longsword",
      attackBonus: 5,
      damage: "1d8+3",
      damageType: "slashing",
    },
  ],
  spells: [],
  inventory: [],
  conditions: [],
};

test("milestone 2 simulates a local room gameplay skeleton", async () => {
  const adventure = await loadAdventureFixture(
    "packages/shared-test-fixtures/adventures/the-lantern-beneath-the-hill.md",
  );
  const service = createRoomService({
    baseInviteUrl: "https://tablemind.local/r",
  });

  const room = service.createRoom({
    hostDisplayName: "Host",
    rulesetId: adventure.rulesetId,
    adventureModuleId: adventure.id,
    startingSceneId: adventure.startingSceneId,
    now: "2026-06-02T02:00:00.000Z",
  });
  const ada = service.joinRoom({
    roomId: room.roomId,
    displayName: "Ada",
    now: "2026-06-02T02:01:00.000Z",
  });
  const bran = service.joinRoom({
    roomId: room.roomId,
    displayName: "Bran",
    now: "2026-06-02T02:02:00.000Z",
  });

  service.createCharacterForPlayer({
    roomId: room.roomId,
    playerId: ada.playerId,
    character: demoCharacter,
  });
  service.setRoomFlag({
    roomId: room.roomId,
    key: "hiddenTruth",
    value: {
      visibility: "dm_only",
      value: adventure.truth[0].text,
    },
  });

  const started = service.startSession({
    roomId: room.roomId,
    hostPlayerId: room.hostPlayerId,
    now: "2026-06-02T02:03:00.000Z",
  });
  const message = service.sendPublicMessage({
    roomId: room.roomId,
    playerId: ada.playerId,
    text: "I inspect the dark lantern.",
    now: "2026-06-02T02:04:00.000Z",
  });

  const adaSnapshot = service.getSnapshot({
    roomId: room.roomId,
    viewerRole: "player",
    viewerPlayerId: ada.playerId,
  });
  const hostSnapshot = service.getSnapshot({
    roomId: room.roomId,
    viewerRole: "host",
  });

  assert.equal(room.inviteLink, `https://tablemind.local/r/${room.roomId}`);
  assert.equal(started.snapshot.phase, "playing");
  assert.equal(adaSnapshot.players[ada.playerId].characterId, "char_ada");
  assert.equal(adaSnapshot.flags.hiddenTruth, undefined);
  assert.ok(hostSnapshot.flags.hiddenTruth.value.includes("broke the shrine seal"));
  assert.deepEqual(
    service.getPresence(room.roomId).map((entry) => [
      entry.playerId,
      entry.displayName,
      entry.connected,
    ]),
    [
      [room.hostPlayerId, "Host", true],
      [ada.playerId, "Ada", true],
      [bran.playerId, "Bran", true],
    ],
  );
  assert.deepEqual(
    service.getCommittedEvents(room.roomId).map((event) => [
      event.sequence,
      event.type,
    ]),
    [
      [1, "state.patch"],
      [2, "player.message"],
    ],
  );
  assert.deepEqual(
    message.broadcasts.map((broadcast) => [broadcast.playerId, broadcast.event.type]),
    [
      [room.hostPlayerId, "player.message"],
      [ada.playerId, "player.message"],
      [bran.playerId, "player.message"],
    ],
  );
});
