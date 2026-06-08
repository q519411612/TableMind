import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createHostCommandClient,
  createPlayerCommandClient,
  createTableMindApi,
} from "../../apps/web/src/api-client.mjs";
import { renderHostRoom } from "../../apps/web/src/render-host.mjs";
import { renderPlayerRoom } from "../../apps/web/src/render-player.mjs";
import { createPlaytestServer } from "../../apps/server/src/playtest-server.mjs";

const forbiddenPlayerText = [
  "broke the shrine seal",
  "hatch below the tower",
  "Secret: Broken Seal",
  "破损封印",
  "塔下活板门",
  "艾瑞克镇长希望",
  "state.patch",
  "host.review",
];

test("P1 browser setup flow starts the demo with Host and two player-safe views", async () => {
  const app = await createPlaytestServer({
    env: {
      TABLEMIND_AI_PROVIDER_ENABLED: "false",
      TABLEMIND_PLAYTEST_PORT: "0",
    },
    logger: silentLogger(),
  });
  const launch = await app.start({ port: 0 });
  const api = createTableMindApi({ baseUrl: launch.apiBaseUrl });

  try {
    const created = await api.createRoom({
      hostDisplayName: "Host",
      rulesetId: "5e-srd-5.2.1",
      adventureModuleId: "adventure_lantern_beneath_hill",
      startingSceneId: "scene_village_square",
      now: "2026-06-08T12:00:00.000Z",
    });
    const roomId = created.data.roomId;
    const inviteUrl = new URL(created.data.inviteLink, launch.baseUrl);

    assert.equal(inviteUrl.pathname, "/player.html");
    assert.equal(inviteUrl.searchParams.get("roomId"), roomId);
    assert.ok(
      renderPlayerRoom({ roomId }).includes(`name="roomId" value="${roomId}"`),
    );

    const host = createHostCommandClient({
      api,
      roomId,
      hostPlayerId: created.data.hostPlayerId,
      hostSessionToken: created.data.hostSessionToken,
      now: () => "2026-06-08T12:01:00.000Z",
    });
    const ada = await api.joinRoom(roomId, {
      displayName: "Ada",
      now: "2026-06-08T12:02:00.000Z",
    });
    const bran = await api.joinRoom(roomId, {
      displayName: "Bran",
      now: "2026-06-08T12:03:00.000Z",
    });
    const adaClient = createPlayerCommandClient({
      api,
      roomId,
      playerId: ada.data.playerId,
      playerSessionToken: ada.data.playerSessionToken,
      now: () => "2026-06-08T12:04:00.000Z",
    });
    const branClient = createPlayerCommandClient({
      api,
      roomId,
      playerId: bran.data.playerId,
      playerSessionToken: bran.data.playerSessionToken,
      now: () => "2026-06-08T12:05:00.000Z",
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
        intelligence: 12,
        wisdom: 11,
        charisma: 8,
      },
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

    const config = await getJson(`${launch.baseUrl}/playtest/config.json`);
    const adventure = await getJson(
      `${config.fixtures.adventureUrl}?roomId=${roomId}&sessionToken=${encodeURIComponent(
        created.data.hostSessionToken,
      )}`,
    );
    await host.loadAdventure(adventure);
    await host.startSession();

    const hostSnapshot = await api.getSnapshot(roomId, {
      sessionToken: created.data.hostSessionToken,
    });
    const hostAdventure = await api.getAdventureSnapshot(roomId, {
      sessionToken: created.data.hostSessionToken,
    });
    const adaSnapshot = await api.getSnapshot(roomId, {
      sessionToken: ada.data.playerSessionToken,
    });
    const adaAdventure = await api.getAdventureSnapshot(roomId, {
      sessionToken: ada.data.playerSessionToken,
    });
    const zhHostAdventure = await api.getAdventureSnapshot(roomId, {
      sessionToken: created.data.hostSessionToken,
      locale: "zh-CN",
    });
    const zhAdaAdventure = await api.getAdventureSnapshot(roomId, {
      sessionToken: ada.data.playerSessionToken,
      locale: "zh-CN",
    });
    const hostHtml = renderHostRoom({
      room: {
        roomId,
        hostPlayerId: created.data.hostPlayerId,
        inviteLink: created.data.inviteLink,
      },
      snapshot: hostSnapshot.snapshot,
      adventureSnapshot: hostAdventure.snapshot,
      reviewQueue: [],
    });
    const playerHtml = renderPlayerRoom({
      roomId,
      playerId: ada.data.playerId,
      playerSessionToken: ada.data.playerSessionToken,
      snapshot: adaSnapshot.snapshot,
      adventureSnapshot: adaAdventure.snapshot,
    });
    const zhHostHtml = renderHostRoom({
      locale: "zh-CN",
      room: {
        roomId,
        hostPlayerId: created.data.hostPlayerId,
        inviteLink: created.data.inviteLink,
      },
      snapshot: hostSnapshot.snapshot,
      adventureSnapshot: zhHostAdventure.snapshot,
      reviewQueue: [],
    });
    const zhPlayerHtml = renderPlayerRoom({
      locale: "zh-CN",
      roomId,
      playerId: ada.data.playerId,
      playerSessionToken: ada.data.playerSessionToken,
      snapshot: adaSnapshot.snapshot,
      adventureSnapshot: zhAdaAdventure.snapshot,
    });

    assert.equal(hostSnapshot.snapshot.phase, "playing");
    assert.equal(adaSnapshot.snapshot.phase, "playing");
    assert.ok(hostHtml.includes("Players ready: 2/2"));
    assert.ok(hostHtml.includes("Session is live. Run AI for the opening prompt."));
    assert.ok(hostHtml.includes("data-action=\"copy-invite\""));
    assert.ok(playerHtml.includes("Ada Thorne"));
    assert.ok(playerHtml.includes("Current Scene"));
    assert.ok(playerHtml.includes("Describe an action or wait for the AI prompt."));
    assert.ok(zhHostHtml.includes("村庄广场"));
    assert.ok(zhHostHtml.includes("艾瑞克镇长希望"));
    assert.ok(zhPlayerHtml.includes("村庄广场"));
    assert.ok(zhPlayerHtml.includes("潮湿的绳索"));
    assertNoForbiddenPlayerText(playerHtml);
    assertNoForbiddenPlayerText(zhPlayerHtml);
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
    skillProficiencies: input.skillProficiencies ?? [],
    attacks: input.attacks,
    spells: [],
    inventory: [],
    conditions: [],
  };
}

async function getJson(url) {
  const response = await fetch(url);
  assert.equal(response.ok, true);
  return await response.json();
}

function assertNoForbiddenPlayerText(html) {
  for (const forbidden of forbiddenPlayerText) {
    assert.equal(html.includes(forbidden), false, forbidden);
  }
}

function silentLogger() {
  return {
    log() {},
  };
}
