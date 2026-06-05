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

async function createCombatRoom() {
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
    now: "2026-06-02T07:02:00.000Z",
  });
  service.loadAdventureModule({
    roomId: room.roomId,
    hostPlayerId: room.hostPlayerId,
    adventure,
    now: "2026-06-02T07:03:00.000Z",
  });

  return { service, room, player, compendium };
}

test("Host starts combat from an encounter with deterministic initiative", async () => {
  const { service, room, compendium } = await createCombatRoom();

  const started = service.startCombatFromEncounter({
    roomId: room.roomId,
    hostPlayerId: room.hostPlayerId,
    encounterId: "encounter_hill_scavengers",
    characterIds: ["char_ada"],
    compendiumEntries: compendium,
    randomSource: createSequenceRandomSource([0.5, 0.1, 0.2]),
    now: "2026-06-02T07:04:00.000Z",
  });

  assert.equal(started.event.type, "combat.started");
  assert.equal(started.snapshot.phase, "combat");
  assert.equal(started.snapshot.combat.status, "active");
  assert.deepEqual(
    started.snapshot.combat.combatants.map((combatant) => [
      combatant.id,
      combatant.initiative,
    ]),
    [
      ["combatant_char_ada", 12],
      ["combatant_monster_hill_scavenger_2", 7],
      ["combatant_monster_hill_scavenger_1", 5],
    ],
  );
  assert.equal(started.snapshot.combat.activeCombatantId, "combatant_char_ada");
});

test("player attack resolves hit, damage, and defeated target through events", async () => {
  const { service, room, player, compendium } = await createCombatRoom();
  service.startCombatFromEncounter({
    roomId: room.roomId,
    hostPlayerId: room.hostPlayerId,
    encounterId: "encounter_hill_scavengers",
    characterIds: ["char_ada"],
    compendiumEntries: compendium,
    randomSource: createSequenceRandomSource([0.5, 0.1, 0.2]),
    now: "2026-06-02T07:04:00.000Z",
  });

  const result = service.resolveCombatAttack({
    roomId: room.roomId,
    actorPlayerId: player.playerId,
    attackerCombatantId: "combatant_char_ada",
    targetCombatantId: "combatant_monster_hill_scavenger_1",
    attackId: "attack_longsword",
    randomSource: createSequenceRandomSource([0.7, 0.5]),
    now: "2026-06-02T07:03:00.000Z",
  });

  const target = result.snapshot.combat.combatants.find(
    (combatant) => combatant.id === "combatant_monster_hill_scavenger_1",
  );

  assert.equal(result.attackEvent.type, "attack.resolved");
  assert.equal(result.damageEvent.type, "damage.applied");
  assert.equal(result.attackResult.hit, true);
  assert.equal(result.damageResult.amount, 8);
  assert.equal(target.hitPoints.current, 0);
  assert.equal(target.status, "defeated");
});

test("turns advance and combat can end through committed events", async () => {
  const { service, room, compendium } = await createCombatRoom();
  service.startCombatFromEncounter({
    roomId: room.roomId,
    hostPlayerId: room.hostPlayerId,
    encounterId: "encounter_hill_scavengers",
    characterIds: ["char_ada"],
    compendiumEntries: compendium,
    randomSource: createSequenceRandomSource([0.5, 0.1, 0.2]),
    now: "2026-06-02T07:02:00.000Z",
  });

  const advanced = service.advanceCombatTurn({
    roomId: room.roomId,
    hostPlayerId: room.hostPlayerId,
    now: "2026-06-02T07:04:00.000Z",
  });
  const ended = service.endCombat({
    roomId: room.roomId,
    hostPlayerId: room.hostPlayerId,
    reason: "The scavengers flee.",
    now: "2026-06-02T07:05:00.000Z",
  });

  assert.equal(advanced.event.type, "combat.turn_advanced");
  assert.equal(advanced.snapshot.combat.activeCombatantId, "combatant_monster_hill_scavenger_2");
  assert.equal(ended.event.type, "combat.ended");
  assert.equal(ended.snapshot.phase, "playing");
  assert.equal(ended.snapshot.combat, undefined);
});
