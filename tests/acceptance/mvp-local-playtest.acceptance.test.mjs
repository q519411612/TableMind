import assert from "node:assert/strict";
import { test } from "node:test";
import { loadAdventureFixture } from "../../packages/adventure-loader/src/index.mjs";
import { loadCompendiumFixture } from "../../packages/compendium/src/index.mjs";
import { createSequenceRandomSource } from "../../packages/rules-engine/src/index.mjs";
import { generateSessionRecap } from "../../packages/session-recap/src/index.mjs";
import { createRoomService } from "../../apps/server/src/room-service.mjs";
import {
  createMockAiAdapter,
  runAiDmTurn,
} from "../../apps/server/src/ai-dm-orchestrator.mjs";

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

test("MVP local playtest completes the demo one-shot with recap", async () => {
  const adventure = await loadAdventureFixture(
    "packages/shared-test-fixtures/adventures/the-lantern-beneath-the-hill.md",
  );
  const compendium = await loadCompendiumFixture(
    "packages/shared-test-fixtures/compendium/srd-mini.json",
  );
  const service = createRoomService({
    baseInviteUrl: "https://tablemind.local/r",
  });
  const room = service.createRoom({
    hostDisplayName: "Host",
    rulesetId: adventure.rulesetId,
    adventureModuleId: adventure.id,
    startingSceneId: adventure.startingSceneId,
    now: "2026-06-02T10:00:00.000Z",
  });
  const ada = service.joinRoom({
    roomId: room.roomId,
    displayName: "Ada",
    now: "2026-06-02T10:01:00.000Z",
  });
  const bran = service.joinRoom({
    roomId: room.roomId,
    displayName: "Bran",
    now: "2026-06-02T10:02:00.000Z",
  });
  service.createCharacterForPlayer({
    roomId: room.roomId,
    playerId: ada.playerId,
    now: "2026-06-02T10:02:10.000Z",
    character: character({
      id: "char_ada",
      name: "Ada Thorne",
      className: "Fighter",
      abilities: {
        strength: 14,
        dexterity: 12,
        constitution: 14,
        intelligence: 16,
        wisdom: 11,
        charisma: 8,
      },
      armorClass: 16,
      maxHp: 12,
      savingThrowProficiencies: ["strength", "constitution"],
      skillProficiencies: ["investigation"],
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
    now: "2026-06-02T10:02:20.000Z",
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
    now: "2026-06-02T10:02:30.000Z",
  });
  service.startSession({
    roomId: room.roomId,
    hostPlayerId: room.hostPlayerId,
    now: "2026-06-02T10:03:00.000Z",
  });
  service.changeScene({
    roomId: room.roomId,
    hostPlayerId: room.hostPlayerId,
    sceneId: "scene_lantern_tower",
    reason: "The party reaches the lantern tower.",
    now: "2026-06-02T10:04:00.000Z",
  });

  const aiTurn = await runAiDmTurn({
    adapter: createMockAiAdapter({
      publicMessage: "Cold soot curls around the cracked lantern frame.",
      ruleRequests: [
        {
          type: "skill_check",
          characterId: "char_ada",
          skill: "investigation",
          dc: 15,
          advantage: "normal",
          reason: "Inspect the lantern soot.",
        },
      ],
      confidence: "high",
    }),
    context: {
      session: service.getSnapshot({
        roomId: room.roomId,
        viewerRole: "host",
      }),
      currentScene: service.getAdventureSnapshot({
        roomId: room.roomId,
        viewerRole: "host",
      }).currentScene,
      hiddenEntities: [],
      unrevealedClues: service.getAdventureSnapshot({
        roomId: room.roomId,
        viewerRole: "host",
      }).currentScene.clues,
      dmOnlySecrets: adventure.truth,
    },
    randomSource: createSequenceRandomSource([0.7]),
  });
  service.commitDiceRoll({
    roomId: room.roomId,
    roll: aiTurn.ruleResults[0].d20,
    reason: aiTurn.ruleResults[0].reason,
    now: "2026-06-02T10:05:00.000Z",
  });
  service.revealClue({
    roomId: room.roomId,
    hostPlayerId: room.hostPlayerId,
    clueId: "clue_broken_lens",
    now: "2026-06-02T10:06:00.000Z",
  });
  service.startCombatFromEncounter({
    roomId: room.roomId,
    hostPlayerId: room.hostPlayerId,
    encounterId: "encounter_hill_scavengers",
    characterIds: ["char_ada", "char_bran"],
    compendiumEntries: compendium,
    randomSource: createSequenceRandomSource([0.5, 0.45, 0.1, 0.2]),
    now: "2026-06-02T10:07:00.000Z",
  });
  service.resolveCombatAttack({
    roomId: room.roomId,
    actorPlayerId: ada.playerId,
    attackerCombatantId: "combatant_char_ada",
    targetCombatantId: "combatant_monster_hill_scavenger_1",
    attackId: "attack_longsword",
    randomSource: createSequenceRandomSource([0.7, 0.5]),
    now: "2026-06-02T10:08:00.000Z",
  });
  service.setAiPaused({
    roomId: room.roomId,
    hostPlayerId: room.hostPlayerId,
    paused: true,
    reason: "Host reviews the closing narration.",
    now: "2026-06-02T10:09:00.000Z",
  });
  service.endCombat({
    roomId: room.roomId,
    hostPlayerId: room.hostPlayerId,
    reason: "The remaining scavenger flees into the rain.",
    now: "2026-06-02T10:10:00.000Z",
  });
  const completed = service.completeSession({
    roomId: room.roomId,
    hostPlayerId: room.hostPlayerId,
    ending: "Repair the Lantern",
    rewards: ["Village gratitude", "A safe hill road"],
    now: "2026-06-02T10:11:00.000Z",
  });

  const hostState = service.getSnapshot({
    roomId: room.roomId,
    viewerRole: "host",
  });
  const playerState = service.getSnapshot({
    roomId: room.roomId,
    viewerRole: "player",
    viewerPlayerId: ada.playerId,
  });
  const playerRecap = generateSessionRecap({
    sessionState: hostState,
    events: service.getCommittedEvents(room.roomId),
    adventure,
    viewerRole: "player",
  });
  const hostRecap = generateSessionRecap({
    sessionState: hostState,
    events: service.getCommittedEvents(room.roomId),
    adventure,
    viewerRole: "host",
  });

  assert.equal(completed.snapshot.phase, "ended");
  assert.equal(aiTurn.status, "broadcast_ready");
  assert.equal(aiTurn.ruleResults[0].success, true);
  assert.equal(playerState.flags.hiddenTruth, undefined);
  assert.equal(playerRecap.markdown.includes("Mira broke the shrine seal"), false);
  assert.ok(playerRecap.markdown.includes("Broken Lantern Lens"));
  assert.ok(playerRecap.markdown.includes("Inspect the lantern soot."));
  assert.ok(hostRecap.markdown.includes("Secret: Broken Seal"));
  assert.deepEqual(playerRecap.rewards, [
    "Village gratitude",
    "A safe hill road",
  ]);
  assert.deepEqual(
    Object.values(hostState.players).map((playerRecord) => playerRecord.characterId).filter(Boolean),
    ["char_ada", "char_bran"],
  );
});
