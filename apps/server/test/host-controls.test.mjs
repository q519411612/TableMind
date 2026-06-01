import assert from "node:assert/strict";
import { test } from "node:test";
import { loadAdventureFixture } from "../../../packages/adventure-loader/src/index.mjs";
import { loadCompendiumFixture } from "../../../packages/compendium/src/index.mjs";
import { createSequenceRandomSource } from "../../../packages/rules-engine/src/index.mjs";
import { createRoomService } from "../src/room-service.mjs";

const character = {
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
  skillProficiencies: ["athletics"],
  attacks: [],
  spells: [],
  inventory: [],
  conditions: [],
};

async function createStartedCombat() {
  const adventure = await loadAdventureFixture(
    "packages/shared-test-fixtures/adventures/the-lantern-beneath-the-hill.md",
  );
  const compendium = await loadCompendiumFixture(
    "packages/shared-test-fixtures/compendium/srd-mini.json",
  );
  const service = createRoomService();
  const room = service.createRoom({
    hostDisplayName: "Host",
    rulesetId: adventure.rulesetId,
    adventureModuleId: adventure.id,
    startingSceneId: adventure.startingSceneId,
    now: "2026-06-02T07:00:00.000Z",
  });
  const player = service.joinRoom({
    roomId: room.roomId,
    displayName: "Ada",
    now: "2026-06-02T07:01:00.000Z",
  });
  service.createCharacterForPlayer({
    roomId: room.roomId,
    playerId: player.playerId,
    character,
  });
  service.loadAdventureModule({
    roomId: room.roomId,
    hostPlayerId: room.hostPlayerId,
    adventure,
  });
  service.startCombatFromEncounter({
    roomId: room.roomId,
    hostPlayerId: room.hostPlayerId,
    encounterId: "encounter_hill_scavengers",
    characterIds: ["char_ada"],
    compendiumEntries: compendium,
    randomSource: createSequenceRandomSource([0.5, 0.1, 0.2]),
    now: "2026-06-02T07:02:00.000Z",
  });

  return { service, room, player };
}

test("Host can patch combatant HP and conditions through auditable events", async () => {
  const { service, room } = await createStartedCombat();

  const hpPatch = service.patchCombatantHitPoints({
    roomId: room.roomId,
    hostPlayerId: room.hostPlayerId,
    combatantId: "combatant_monster_hill_scavenger_1",
    currentHp: 3,
    reason: "Host correction.",
    now: "2026-06-02T07:06:00.000Z",
  });
  const conditionPatch = service.patchCombatantCondition({
    roomId: room.roomId,
    hostPlayerId: room.hostPlayerId,
    combatantId: "combatant_monster_hill_scavenger_1",
    condition: { conditionId: "condition_grappled", source: "Host" },
    action: "apply",
    reason: "Host applies grappled.",
    now: "2026-06-02T07:07:00.000Z",
  });

  const combatant = conditionPatch.snapshot.combat.combatants.find(
    (candidate) => candidate.id === "combatant_monster_hill_scavenger_1",
  );

  assert.equal(hpPatch.event.type, "state.patch");
  assert.equal(conditionPatch.event.type, "state.patch");
  assert.equal(combatant.hitPoints.current, 3);
  assert.deepEqual(combatant.conditions, [
    { conditionId: "condition_grappled", source: "Host" },
  ]);
});

test("Host can pause and resume AI while players cannot use Host controls", async () => {
  const { service, room, player } = await createStartedCombat();

  const paused = service.setAiPaused({
    roomId: room.roomId,
    hostPlayerId: room.hostPlayerId,
    paused: true,
    reason: "Review combat narration.",
    now: "2026-06-02T07:08:00.000Z",
  });
  const resumed = service.setAiPaused({
    roomId: room.roomId,
    hostPlayerId: room.hostPlayerId,
    paused: false,
    reason: "Resume AI narration.",
    now: "2026-06-02T07:09:00.000Z",
  });

  assert.equal(paused.snapshot.flags.aiPaused.value, true);
  assert.equal(resumed.snapshot.flags.aiPaused.value, false);
  assert.throws(
    () =>
      service.patchCombatantHitPoints({
        roomId: room.roomId,
        hostPlayerId: player.playerId,
        combatantId: "combatant_monster_hill_scavenger_1",
        currentHp: 1,
        reason: "Player tries to patch.",
        now: "2026-06-02T07:10:00.000Z",
      }),
    /forbidden/,
  );
});
