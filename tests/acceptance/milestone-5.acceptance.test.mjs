import assert from "node:assert/strict";
import { test } from "node:test";
import { loadAdventureFixture } from "../../packages/adventure-loader/src/index.mjs";
import { loadCompendiumFixture } from "../../packages/compendium/src/index.mjs";
import { createSequenceRandomSource } from "../../packages/rules-engine/src/index.mjs";
import { createRoomService } from "../../apps/server/src/room-service.mjs";

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

test("milestone 5 simulates combat and Host override controls", async () => {
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
    now: "2026-06-02T08:00:00.000Z",
  });
  const player = service.joinRoom({
    roomId: room.roomId,
    displayName: "Ada",
    now: "2026-06-02T08:01:00.000Z",
  });
  service.createCharacterForPlayer({
    roomId: room.roomId,
    playerId: player.playerId,
    character,
    now: "2026-06-02T08:02:00.000Z",
  });
  service.loadAdventureModule({
    roomId: room.roomId,
    hostPlayerId: room.hostPlayerId,
    adventure,
    now: "2026-06-02T08:03:00.000Z",
  });

  const started = service.startCombatFromEncounter({
    roomId: room.roomId,
    hostPlayerId: room.hostPlayerId,
    encounterId: "encounter_hill_scavengers",
    characterIds: ["char_ada"],
    compendiumEntries: compendium,
    randomSource: createSequenceRandomSource([0.5, 0.1, 0.2]),
    now: "2026-06-02T08:04:00.000Z",
  });
  const attack = service.resolveCombatAttack({
    roomId: room.roomId,
    actorPlayerId: player.playerId,
    attackerCombatantId: "combatant_char_ada",
    targetCombatantId: "combatant_monster_hill_scavenger_1",
    attackId: "attack_longsword",
    randomSource: createSequenceRandomSource([0.7, 0.5]),
    now: "2026-06-02T08:05:00.000Z",
  });
  const patched = service.patchCombatantHitPoints({
    roomId: room.roomId,
    hostPlayerId: room.hostPlayerId,
    combatantId: "combatant_monster_hill_scavenger_2",
    currentHp: 2,
    reason: "Host adjusts the remaining scavenger HP.",
    now: "2026-06-02T08:06:00.000Z",
  });
  const conditioned = service.patchCombatantCondition({
    roomId: room.roomId,
    hostPlayerId: room.hostPlayerId,
    combatantId: "combatant_monster_hill_scavenger_2",
    condition: { conditionId: "condition_grappled", source: "Host" },
    action: "apply",
    reason: "Host applies grappled.",
    now: "2026-06-02T08:07:00.000Z",
  });
  const paused = service.setAiPaused({
    roomId: room.roomId,
    hostPlayerId: room.hostPlayerId,
    paused: true,
    reason: "Host pauses AI during combat correction.",
    now: "2026-06-02T08:08:00.000Z",
  });
  const ended = service.endCombat({
    roomId: room.roomId,
    hostPlayerId: room.hostPlayerId,
    reason: "The remaining scavenger flees.",
    now: "2026-06-02T08:09:00.000Z",
  });

  const conditionedTarget = conditioned.snapshot.combat.combatants.find(
    (combatant) => combatant.id === "combatant_monster_hill_scavenger_2",
  );

  assert.equal(started.snapshot.combat.activeCombatantId, "combatant_char_ada");
  assert.equal(attack.damageResult.amount, 8);
  assert.equal(
    attack.snapshot.combat.combatants.find(
      (combatant) => combatant.id === "combatant_monster_hill_scavenger_1",
    ).status,
    "defeated",
  );
  assert.equal(
    patched.snapshot.combat.combatants.find(
      (combatant) => combatant.id === "combatant_monster_hill_scavenger_2",
    ).hitPoints.current,
    2,
  );
  assert.deepEqual(conditionedTarget.conditions, [
    { conditionId: "condition_grappled", source: "Host" },
  ]);
  assert.equal(paused.snapshot.flags.aiPaused.value, true);
  assert.equal(ended.snapshot.phase, "playing");
  assert.equal(ended.snapshot.combat, undefined);
  assert.deepEqual(
    service.getCommittedEvents(room.roomId).map((event) => event.type),
    [
      "player.joined",
      "player.joined",
      "character.created",
      "adventure.loaded",
      "combat.started",
      "attack.resolved",
      "damage.applied",
      "state.patch",
      "state.patch",
      "state.patch",
      "combat.ended",
    ],
  );
});
