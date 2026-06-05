import assert from "node:assert/strict";
import { test } from "node:test";
import { loadAdventureFixture } from "../../packages/adventure-loader/src/index.mjs";
import { loadCompendiumFixture } from "../../packages/compendium/src/index.mjs";
import { generateSessionRecap } from "../../packages/session-recap/src/index.mjs";
import {
  createHostCommandClient,
  createPlayerCommandClient,
  createTableMindApi,
} from "../../apps/web/src/api-client.mjs";
import { renderHostRoom } from "../../apps/web/src/render-host.mjs";
import { renderPlayerRoom } from "../../apps/web/src/render-player.mjs";
import { createMockAiAdapter } from "../../apps/server/src/ai-dm-orchestrator.mjs";
import { createHttpServer } from "../../apps/server/src/http-server.mjs";
import { createRoomActionDispatcher } from "../../apps/server/src/room-actions.mjs";
import { createRoomService } from "../../apps/server/src/room-service.mjs";

test("MVP-0.9 simulated UI playtest completes with player-safe rendering", async () => {
  const adventure = await loadAdventureFixture(
    "packages/shared-test-fixtures/adventures/the-lantern-beneath-the-hill.md",
  );
  const compendium = await loadCompendiumFixture(
    "packages/shared-test-fixtures/compendium/srd-mini.json",
  );
  const service = createRoomService({
    baseInviteUrl: "http://localhost:4173/rooms",
  });
  const app = createHttpServer({
    dispatcher: createRoomActionDispatcher({
      roomService: service,
      aiAdapter: createMockAiAdapter({
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
    }),
  });
  const { baseUrl } = await app.start();
  const api = createTableMindApi({ baseUrl });

  try {
    const created = await api.createRoom({
      hostDisplayName: "Host",
      rulesetId: adventure.rulesetId,
      adventureModuleId: adventure.id,
      startingSceneId: adventure.startingSceneId,
      now: "2026-06-02T18:00:00.000Z",
    });
    const roomId = created.data.roomId;
    const hostPlayerId = created.data.hostPlayerId;
    const host = createHostCommandClient({
      api,
      roomId,
      hostPlayerId,
      hostSessionToken: created.data.hostSessionToken,
      now: () => "2026-06-02T18:01:00.000Z",
    });
    const ada = await api.joinRoom(roomId, {
      displayName: "Ada",
      now: "2026-06-02T18:02:00.000Z",
    });
    const bran = await api.joinRoom(roomId, {
      displayName: "Bran",
      now: "2026-06-02T18:03:00.000Z",
    });
    const adaClient = createPlayerCommandClient({
      api,
      roomId,
      playerId: ada.data.playerId,
      playerSessionToken: ada.data.playerSessionToken,
      now: () => "2026-06-02T18:04:00.000Z",
    });
    const branClient = createPlayerCommandClient({
      api,
      roomId,
      playerId: bran.data.playerId,
      playerSessionToken: bran.data.playerSessionToken,
      now: () => "2026-06-02T18:04:30.000Z",
    });

    await adaClient.createCharacter(character({
      id: "char_ada",
      name: "Ada Thorne",
      className: "Fighter",
      maxHp: 12,
      armorClass: 16,
      abilities: {
        strength: 14,
        dexterity: 12,
        constitution: 14,
        intelligence: 16,
        wisdom: 11,
        charisma: 8,
      },
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
    }));
    await branClient.createCharacter(character({
      id: "char_bran",
      name: "Bran Vale",
      className: "Rogue",
      maxHp: 9,
      armorClass: 14,
      abilities: {
        strength: 10,
        dexterity: 16,
        constitution: 12,
        intelligence: 12,
        wisdom: 10,
        charisma: 12,
      },
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
    }));
    await host.loadAdventure(adventure);
    await host.startSession();
    await host.changeScene(
      "scene_lantern_tower",
      "The party reaches the lantern tower.",
    );
    await adaClient.sendMessage("I inspect the cracked lantern.");

    const aiTurn = await host.runAiTurn({ randomValues: [0.7] });
    await host.revealClue("clue_broken_lens");
    await host.startCombat({
      encounterId: "encounter_hill_scavengers",
      characterIds: ["char_ada", "char_bran"],
      compendiumEntries: compendium,
      randomValues: [0.9, 0.1, 0.2, 0.3],
    });
    await adaClient.attack({
      attackerCombatantId: "combatant_char_ada",
      targetCombatantId: "combatant_monster_hill_scavenger_1",
      attackId: "attack_longsword",
      randomValues: [0.7, 0.5],
    });
    await host.endCombat("The remaining scavenger flees into the rain.");
    await host.completeSession("Repair the Lantern", [
      "Village gratitude",
      "A safe hill road",
    ]);

    const playerSnapshot = await api.getSnapshot(roomId, {
      sessionToken: ada.data.playerSessionToken,
    });
    const hostSnapshot = await api.getSnapshot(roomId, {
      sessionToken: created.data.hostSessionToken,
    });
    const playerAdventure = await api.getAdventureSnapshot(roomId, {
      sessionToken: ada.data.playerSessionToken,
    });
    const hostAdventure = await api.getAdventureSnapshot(roomId, {
      sessionToken: created.data.hostSessionToken,
    });
    const events = service.getCommittedEvents(roomId);
    const playerRecap = generateSessionRecap({
      sessionState: hostSnapshot.snapshot,
      events,
      adventure,
      viewerRole: "player",
    });
    const hostRecap = generateSessionRecap({
      sessionState: hostSnapshot.snapshot,
      events,
      adventure,
      viewerRole: "host",
    });
    const playerHtml = renderPlayerRoom({
      roomId,
      playerId: ada.data.playerId,
      snapshot: playerSnapshot.snapshot,
      adventureSnapshot: playerAdventure.snapshot,
      recap: playerRecap,
    });
    const hostHtml = renderHostRoom({
      room: {
        roomId,
        hostPlayerId,
        inviteLink: created.data.inviteLink,
      },
      snapshot: hostSnapshot.snapshot,
      adventureSnapshot: hostAdventure.snapshot,
      reviewQueue: [],
      recap: hostRecap,
    });

    assert.equal(aiTurn.data.status, "broadcast_ready");
    assert.equal(playerSnapshot.snapshot.phase, "ended");
    assert.ok(playerHtml.includes("Lantern Tower"));
    assert.ok(playerHtml.includes("Cold soot curls around the cracked lantern frame."));
    assert.ok(playerHtml.includes("Inspect the lantern soot."));
    assert.ok(playerHtml.includes("Broken Lantern Lens"));
    assert.ok(playerHtml.includes("Repair the Lantern"));
    assert.equal(playerHtml.includes("broke the shrine seal"), false);
    assert.equal(playerHtml.includes("hatch below the tower"), false);
    assert.ok(hostHtml.includes("broke the shrine seal"));
    assert.ok(hostHtml.includes("hatch below the tower"));
    assert.ok(hostHtml.includes("Secret: Broken Seal"));
  } finally {
    await app.stop();
  }
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
    savingThrowProficiencies: input.savingThrowProficiencies ?? [],
    skillProficiencies: input.skillProficiencies,
    attacks: input.attacks,
    spells: [],
    inventory: [],
    conditions: [],
  };
}
