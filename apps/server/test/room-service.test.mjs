import assert from "node:assert/strict";
import { test } from "node:test";
import { createRoomService } from "../src/room-service.mjs";

const baseRoomInput = {
  hostDisplayName: "Host",
  rulesetId: "5e-srd-5.2.1",
  adventureModuleId: "adventure_lantern_beneath_hill",
  startingSceneId: "scene_village_square",
  now: "2026-06-02T01:00:00.000Z",
};

const characterInput = {
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

test("host creates a room and receives a host snapshot and invite link", () => {
  const service = createRoomService({ baseInviteUrl: "https://tablemind.local/r" });
  const room = service.createRoom(baseRoomInput);

  assert.match(room.roomId, /^room_/);
  assert.equal(room.inviteLink, `https://tablemind.local/r/${room.roomId}`);
  assert.equal(room.hostPlayerId, "player_0001");
  assert.equal(room.snapshot.phase, "lobby");
  assert.equal(room.snapshot.players.player_0001.role, "host");
});

test("players join, leave, and reconnect with authoritative presence", () => {
  const service = createRoomService();
  const room = service.createRoom(baseRoomInput);
  const joined = service.joinRoom({
    roomId: room.roomId,
    displayName: "Ada",
    now: "2026-06-02T01:01:00.000Z",
  });

  assert.equal(joined.playerId, "player_0002");
  assert.equal(joined.snapshot.players.player_0002.displayName, "Ada");
  assert.deepEqual(
    service.getPresence(room.roomId).map((entry) => [entry.playerId, entry.connected]),
    [
      ["player_0001", true],
      ["player_0002", true],
    ],
  );

  service.leaveRoom({
    roomId: room.roomId,
    playerId: joined.playerId,
    now: "2026-06-02T01:02:00.000Z",
  });
  assert.equal(service.getPresence(room.roomId)[1].connected, false);

  const reconnected = service.reconnect({
    roomId: room.roomId,
    playerId: joined.playerId,
    now: "2026-06-02T01:03:00.000Z",
  });
  assert.equal(reconnected.snapshot.players.player_0002.displayName, "Ada");
  assert.equal(service.getPresence(room.roomId)[1].connected, true);
});

test("host starts the session through a committed state patch event", () => {
  const service = createRoomService();
  const room = service.createRoom(baseRoomInput);
  const started = service.startSession({
    roomId: room.roomId,
    hostPlayerId: room.hostPlayerId,
    now: "2026-06-02T01:05:00.000Z",
  });

  assert.equal(started.snapshot.phase, "playing");
  assert.equal(started.event.type, "state.patch");
  assert.equal(started.event.patch[0].path, "/phase");
  assert.equal(started.event.sequence, 1);
});

test("public messages are persisted before broadcast and ordered by server sequence", () => {
  const service = createRoomService();
  const room = service.createRoom(baseRoomInput);
  const player = service.joinRoom({
    roomId: room.roomId,
    displayName: "Ada",
    now: "2026-06-02T01:01:00.000Z",
  });

  const first = service.sendPublicMessage({
    roomId: room.roomId,
    playerId: player.playerId,
    text: "I inspect the lantern.",
    now: "2026-06-02T01:06:00.000Z",
  });
  const second = service.sendPublicMessage({
    roomId: room.roomId,
    playerId: player.playerId,
    text: "I check the cracked lens.",
    now: "2026-06-02T01:07:00.000Z",
  });

  assert.equal(first.event.type, "player.message");
  assert.equal(first.event.sequence, 1);
  assert.equal(second.event.sequence, 2);
  assert.deepEqual(
    service.getCommittedEvents(room.roomId).map((event) => event.message),
    ["I inspect the lantern.", "I check the cracked lens."],
  );
});

test("role-aware snapshots hide DM-only state from players", () => {
  const service = createRoomService();
  const room = service.createRoom(baseRoomInput);
  const joined = service.joinRoom({
    roomId: room.roomId,
    displayName: "Ada",
    now: "2026-06-02T01:01:00.000Z",
  });
  service.setRoomFlag({
    roomId: room.roomId,
    key: "hiddenTruth",
    value: {
      visibility: "dm_only",
      value: "Mira broke the seal.",
    },
  });

  const playerSnapshot = service.getSnapshot({
    roomId: room.roomId,
    viewerRole: "player",
    viewerPlayerId: joined.playerId,
  });
  const hostSnapshot = service.getSnapshot({
    roomId: room.roomId,
    viewerRole: "host",
  });

  assert.equal(playerSnapshot.flags.hiddenTruth, undefined);
  assert.equal(hostSnapshot.flags.hiddenTruth.value, "Mira broke the seal.");
});

test("room service creates and attaches a validated character to a player", () => {
  const service = createRoomService();
  const room = service.createRoom(baseRoomInput);
  const joined = service.joinRoom({
    roomId: room.roomId,
    displayName: "Ada",
    now: "2026-06-02T01:01:00.000Z",
  });

  const result = service.createCharacterForPlayer({
    roomId: room.roomId,
    playerId: joined.playerId,
    character: characterInput,
  });

  assert.equal(result.character.playerId, joined.playerId);
  assert.equal(result.snapshot.players[joined.playerId].characterId, "char_ada");
  assert.equal(result.snapshot.characters.char_ada.proficiencyBonus, 2);
});
