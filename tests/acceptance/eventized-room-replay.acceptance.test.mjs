import assert from "node:assert/strict";
import { test } from "node:test";
import { createRoomService } from "../../apps/server/src/room-service.mjs";
import { loadAdventureFixture } from "../../packages/adventure-loader/src/index.mjs";
import { loadCompendiumFixture } from "../../packages/compendium/src/index.mjs";
import {
  createInitialSessionState,
  replaySessionEvents,
} from "../../packages/domain/src/index.mjs";
import { createSequenceRandomSource } from "../../packages/rules-engine/src/index.mjs";

test("MVP-0.7A replay reconstructs lifecycle and gameplay-critical room state", async () => {
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
    adventureModuleId: "adventure_unloaded",
    startingSceneId: "scene_unloaded",
    now: "2026-06-02T11:00:00.000Z",
  });
  const ada = service.joinRoom({
    roomId: room.roomId,
    displayName: "Ada",
    now: "2026-06-02T11:01:00.000Z",
  });
  const bran = service.joinRoom({
    roomId: room.roomId,
    displayName: "Bran",
    now: "2026-06-02T11:02:00.000Z",
  });

  service.createCharacterForPlayer({
    roomId: room.roomId,
    playerId: ada.playerId,
    now: "2026-06-02T11:02:10.000Z",
    character: character({
      id: "char_ada",
      name: "Ada Thorne",
      className: "Fighter",
      abilities: {
        strength: 14,
        dexterity: 12,
        constitution: 14,
        intelligence: 10,
        wisdom: 11,
        charisma: 8,
      },
      armorClass: 16,
      maxHp: 12,
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
    }),
  });
  service.createCharacterForPlayer({
    roomId: room.roomId,
    playerId: bran.playerId,
    now: "2026-06-02T11:02:20.000Z",
    character: character({
      id: "char_bran",
      name: "Bran Vale",
      className: "Rogue",
      abilities: {
        strength: 10,
        dexterity: 16,
        constitution: 12,
        intelligence: 12,
        wisdom: 10,
        charisma: 12,
      },
      armorClass: 14,
      maxHp: 9,
      savingThrowProficiencies: ["dexterity"],
      skillProficiencies: ["stealth", "perception"],
      attacks: [
        {
          id: "attack_dagger",
          name: "Dagger",
          attackBonus: 5,
          damage: "1d4+3",
          damageType: "piercing",
        },
      ],
    }),
  });
  service.loadAdventureModule({
    roomId: room.roomId,
    hostPlayerId: room.hostPlayerId,
    adventure,
    now: "2026-06-02T11:02:30.000Z",
  });
  service.startSession({
    roomId: room.roomId,
    hostPlayerId: room.hostPlayerId,
    now: "2026-06-02T11:03:00.000Z",
  });
  service.changeScene({
    roomId: room.roomId,
    hostPlayerId: room.hostPlayerId,
    sceneId: "scene_lantern_tower",
    reason: "The party reaches the lantern tower.",
    now: "2026-06-02T11:04:00.000Z",
  });
  service.revealClue({
    roomId: room.roomId,
    hostPlayerId: room.hostPlayerId,
    clueId: "clue_broken_lens",
    now: "2026-06-02T11:05:00.000Z",
  });
  service.commitDiceRoll({
    roomId: room.roomId,
    roll: {
      formula: "1d20+3",
      terms: [{ count: 1, sides: 20, rolls: [16], modifier: 3 }],
      total: 19,
    },
    reason: "Inspect the lantern frame.",
    now: "2026-06-02T11:06:00.000Z",
  });
  service.startCombatFromEncounter({
    roomId: room.roomId,
    hostPlayerId: room.hostPlayerId,
    encounterId: "encounter_hill_scavengers",
    characterIds: ["char_ada", "char_bran"],
    compendiumEntries: compendium,
    randomSource: createSequenceRandomSource([0.9, 0.1, 0.2, 0.3]),
    now: "2026-06-02T11:07:00.000Z",
  });
  service.resolveCombatAttack({
    roomId: room.roomId,
    actorPlayerId: ada.playerId,
    attackerCombatantId: "combatant_char_ada",
    targetCombatantId: "combatant_monster_hill_scavenger_1",
    attackId: "attack_longsword",
    randomSource: createSequenceRandomSource([0.7, 0.5]),
    now: "2026-06-02T11:08:00.000Z",
  });

  const liveCombatState = criticalCombatFields(
    service.getSnapshot({ roomId: room.roomId, viewerRole: "host" }),
  );

  service.endCombat({
    roomId: room.roomId,
    hostPlayerId: room.hostPlayerId,
    reason: "The remaining scavenger flees into the rain.",
    now: "2026-06-02T11:09:00.000Z",
  });
  service.completeSession({
    roomId: room.roomId,
    hostPlayerId: room.hostPlayerId,
    ending: "Repair the Lantern",
    rewards: ["Village gratitude", "A safe hill road"],
    now: "2026-06-02T11:10:00.000Z",
  });

  const events = service.getCommittedEvents(room.roomId);
  const replayInitial = createInitialSessionState({
    id: room.snapshot.id,
    roomId: room.roomId,
    rulesetId: adventure.rulesetId,
    adventureModuleId: "adventure_unloaded",
    currentSceneId: "scene_unloaded",
    now: "2026-06-02T11:00:00.000Z",
  });
  const damageIndex = events.findIndex((event) => event.type === "damage.applied");
  const replayedCombatState = replaySessionEvents(
    events.slice(0, damageIndex + 1),
    replayInitial,
  );
  const replayedFinalState = replaySessionEvents(events, replayInitial);
  const liveFinalState = service.getSnapshot({
    roomId: room.roomId,
    viewerRole: "host",
  });

  assert.deepEqual(
    events.slice(0, 7).map((event) => event.type),
    [
      "player.joined",
      "player.joined",
      "player.joined",
      "character.created",
      "character.created",
      "adventure.loaded",
      "session.started",
    ],
  );
  assert.deepEqual(
    criticalCombatFields(replayedCombatState),
    liveCombatState,
  );
  assert.deepEqual(
    criticalFinalFields(replayedFinalState),
    criticalFinalFields(liveFinalState),
  );
});

function character(input) {
  return {
    id: input.id,
    name: input.name,
    className: input.className,
    level: 1,
    abilities: input.abilities,
    armorClass: input.armorClass,
    hitPoints: {
      current: input.maxHp,
      max: input.maxHp,
      temporary: 0,
    },
    speed: 30,
    savingThrowProficiencies: input.savingThrowProficiencies,
    skillProficiencies: input.skillProficiencies,
    attacks: input.attacks,
    spells: [],
    inventory: [],
    conditions: [],
  };
}

function criticalCombatFields(state) {
  return {
    phase: state.phase,
    combat: state.combat,
    lastAttackResult: state.lastAttackResult,
    lastDamageResult: state.lastDamageResult,
  };
}

function criticalFinalFields(state) {
  return {
    phase: state.phase,
    players: state.players,
    characters: state.characters,
    adventureModuleId: state.adventureModuleId,
    currentSceneId: state.currentSceneId,
    discoveredClueIds: state.discoveredClueIds,
    diceLog: state.diceLog,
    lastAttackResult: state.lastAttackResult,
    lastDamageResult: state.lastDamageResult,
    flags: state.flags,
  };
}
