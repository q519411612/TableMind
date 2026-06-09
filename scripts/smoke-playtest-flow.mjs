#!/usr/bin/env node
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import { generateSessionRecap } from "../packages/session-recap/src/index.mjs";
import { createPlaytestServer } from "../apps/server/src/playtest-server.mjs";

const fixedTimes = [
  "2026-06-06T10:00:00.000Z",
  "2026-06-06T10:01:00.000Z",
  "2026-06-06T10:02:00.000Z",
  "2026-06-06T10:03:00.000Z",
  "2026-06-06T10:04:00.000Z",
  "2026-06-06T10:05:00.000Z",
  "2026-06-06T10:06:00.000Z",
  "2026-06-06T10:07:00.000Z",
  "2026-06-06T10:08:00.000Z",
  "2026-06-06T10:09:00.000Z",
  "2026-06-06T10:10:00.000Z",
  "2026-06-06T10:11:00.000Z",
  "2026-06-06T10:12:00.000Z",
  "2026-06-06T10:13:00.000Z",
  "2026-06-06T10:14:00.000Z",
];

const playerForbiddenNeedles = [
  "broke the shrine seal",
  "secret_broken_seal",
  "Secret: Broken Seal",
  "hatch below the tower",
  "clue_symbol_under_hatch",
];

export async function runSmokePlaytestFlow(options = {}) {
  const logger = options.logger ?? console;
  const env = providerDisabledEnv(options.env ?? process.env);
  const app = await createPlaytestServer({
    env,
    logger,
  });
  const launch = await app.start({ port: 0 });
  const nextTime = fixedClock();

  try {
    assert.equal(app.providerPreflight.enabled, false);

    const created = expectOk(
      await postJson(`${launch.baseUrl}/rooms`, {
        hostDisplayName: "Host",
        rulesetId: "5e-srd-5.2.1",
        adventureModuleId: "adventure_lantern_beneath_hill",
        startingSceneId: "scene_village_square",
        now: nextTime(),
      }),
      "create room",
    );
    const roomId = created.body.data.roomId;
    const hostSessionToken = created.body.data.hostSessionToken;

    const ada = expectOk(
      await postJson(`${launch.baseUrl}/rooms/${roomId}/join`, {
        displayName: "Ada",
        now: nextTime(),
      }),
      "join Ada",
    );
    const bran = expectOk(
      await postJson(`${launch.baseUrl}/rooms/${roomId}/join`, {
        displayName: "Bran",
        now: nextTime(),
      }),
      "join Bran",
    );

    expectOk(
      await postJson(`${launch.baseUrl}/rooms/${roomId}/actions`, {
        type: "character.create",
        sessionToken: ada.body.data.playerSessionToken,
        payload: {
          character: character({
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
        },
        now: nextTime(),
      }),
      "create Ada character",
    );
    expectOk(
      await postJson(`${launch.baseUrl}/rooms/${roomId}/actions`, {
        type: "character.create",
        sessionToken: bran.body.data.playerSessionToken,
        payload: {
          character: character({
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
        },
        now: nextTime(),
      }),
      "create Bran character",
    );

    expectStatus(
      await getJson(`${launch.baseUrl}/playtest/fixtures/demo-adventure.json`),
      403,
      "ungated adventure fixture",
    );
    expectStatus(
      await getJson(
        `${launch.baseUrl}/playtest/fixtures/demo-adventure.json?roomId=${roomId}&sessionToken=${encodeURIComponent(ada.body.data.playerSessionToken)}`,
      ),
      403,
      "player adventure fixture",
    );
    const adventure = expectStatus(
      await getJson(
        `${launch.baseUrl}/playtest/fixtures/demo-adventure.json?roomId=${roomId}&sessionToken=${encodeURIComponent(hostSessionToken)}`,
      ),
      200,
      "host adventure fixture",
    ).body;
    const compendium = expectStatus(
      await getJson(`${launch.baseUrl}/playtest/fixtures/srd-compendium.json`),
      200,
      "compendium fixture",
    ).body;

    expectOk(
      await postJson(`${launch.baseUrl}/rooms/${roomId}/actions`, {
        type: "adventure.load",
        sessionToken: hostSessionToken,
        payload: { adventure },
        now: nextTime(),
      }),
      "load adventure",
    );
    expectOk(
      await postJson(`${launch.baseUrl}/rooms/${roomId}/actions`, {
        type: "session.start",
        sessionToken: hostSessionToken,
        payload: {},
        now: nextTime(),
      }),
      "start session",
    );
    expectOk(
      await postJson(`${launch.baseUrl}/rooms/${roomId}/actions`, {
        type: "message.send",
        sessionToken: ada.body.data.playerSessionToken,
        payload: {
          text: "I inspect the cracked lantern.",
        },
        now: nextTime(),
      }),
      "player message",
    );
    const aiTurn = expectOk(
      await postJson(`${launch.baseUrl}/rooms/${roomId}/actions`, {
        type: "ai.turn.run",
        sessionToken: hostSessionToken,
        payload: {
          randomValues: [0.7],
        },
        now: nextTime(),
      }),
      "run AI turn",
    );
    expectOk(
      await postJson(`${launch.baseUrl}/rooms/${roomId}/actions`, {
        type: "scene.change",
        sessionToken: hostSessionToken,
        payload: {
          sceneId: "scene_lantern_tower",
          reason: "The party reaches the lantern tower.",
        },
        now: nextTime(),
      }),
      "change scene",
    );
    expectOk(
      await postJson(`${launch.baseUrl}/rooms/${roomId}/actions`, {
        type: "clue.reveal",
        sessionToken: hostSessionToken,
        payload: {
          clueId: "clue_broken_lens",
        },
        now: nextTime(),
      }),
      "reveal clue",
    );
    expectOk(
      await postJson(`${launch.baseUrl}/rooms/${roomId}/actions`, {
        type: "combat.start",
        sessionToken: hostSessionToken,
        payload: {
          encounterId: "encounter_hill_scavengers",
          characterIds: ["char_ada", "char_bran"],
          compendiumEntries: compendium.entries,
          randomValues: [0.9, 0.1, 0.2, 0.3],
        },
        now: nextTime(),
      }),
      "start combat",
    );
    const attack = expectOk(
      await postJson(`${launch.baseUrl}/rooms/${roomId}/actions`, {
        type: "combat.attack",
        sessionToken: ada.body.data.playerSessionToken,
        payload: {
          attackerCombatantId: "combatant_char_ada",
          targetCombatantId: "combatant_monster_hill_scavenger_1",
          attackId: "attack_longsword",
          randomValues: [0.7, 0.5],
        },
        now: nextTime(),
      }),
      "resolve attack",
    );
    expectOk(
      await postJson(`${launch.baseUrl}/rooms/${roomId}/actions`, {
        type: "combat.end",
        sessionToken: hostSessionToken,
        payload: {
          reason: "The remaining scavenger flees into the rain.",
        },
        now: nextTime(),
      }),
      "end combat",
    );
    expectOk(
      await postJson(`${launch.baseUrl}/rooms/${roomId}/actions`, {
        type: "session.complete",
        sessionToken: hostSessionToken,
        payload: {
          ending: "Repair the Lantern",
          rewards: ["Village gratitude", "A safe hill road"],
        },
        now: nextTime(),
      }),
      "complete session",
    );

    const playerSnapshot = expectOk(
      await getJson(
        `${launch.baseUrl}/rooms/${roomId}/snapshot?sessionToken=${encodeURIComponent(ada.body.data.playerSessionToken)}`,
      ),
      "player snapshot",
    ).body.snapshot;
    const hostSnapshot = expectOk(
      await getJson(
        `${launch.baseUrl}/rooms/${roomId}/snapshot?sessionToken=${encodeURIComponent(hostSessionToken)}`,
      ),
      "host snapshot",
    ).body.snapshot;
    const playerAdventureSnapshot = expectOk(
      await getJson(
        `${launch.baseUrl}/rooms/${roomId}/adventure-snapshot?sessionToken=${encodeURIComponent(ada.body.data.playerSessionToken)}`,
      ),
      "player adventure snapshot",
    ).body.snapshot;
    const hostAdventureSnapshot = expectOk(
      await getJson(
        `${launch.baseUrl}/rooms/${roomId}/adventure-snapshot?sessionToken=${encodeURIComponent(hostSessionToken)}`,
      ),
      "host adventure snapshot",
    ).body.snapshot;

    const playerRecap = generateSessionRecap({
      sessionState: hostSnapshot,
      events: hostSnapshot.eventLog,
      adventure,
      viewerRole: "player",
    });
    const hostRecap = generateSessionRecap({
      sessionState: hostSnapshot,
      events: hostSnapshot.eventLog,
      adventure,
      viewerRole: "host",
    });

    const playerLeakChecks = {
      playerSnapshot: hasForbiddenNeedle(playerSnapshot, playerForbiddenNeedles),
      playerAdventureSnapshot: hasForbiddenNeedle(
        playerAdventureSnapshot,
        playerForbiddenNeedles,
      ),
      playerRecap: hasForbiddenNeedle(playerRecap, playerForbiddenNeedles),
    };
    const hostTruthChecks = {
      hostAdventureSnapshot: JSON.stringify(hostAdventureSnapshot).includes(
        "broke the shrine seal",
      ),
      hostRecap: hostRecap.markdown.includes("Secret: Broken Seal"),
    };
    const aiTurnEventTypes = aiTurn.body.events.map((event) => event.type);
    const attackEventTypes = attack.body.events.map((event) => event.type);

    assert.equal(playerSnapshot.phase, "ended");
    assert.equal(playerSnapshot.currentSceneId, "scene_lantern_tower");
    assert.deepEqual(playerSnapshot.discoveredClueIds, ["clue_broken_lens"]);
    assert.deepEqual(aiTurnEventTypes, ["dice.rolled", "ai.message"]);
    assert.deepEqual(attackEventTypes, ["attack.resolved", "damage.applied"]);
    assertNoPlayerLeaks(playerLeakChecks);
    assert.equal(hostTruthChecks.hostAdventureSnapshot, true);
    assert.equal(hostTruthChecks.hostRecap, true);

    return {
      providerEnabled: app.providerPreflight.enabled,
      roomId,
      phase: playerSnapshot.phase,
      currentSceneId: playerSnapshot.currentSceneId,
      playerDiscoveredClueIds: playerSnapshot.discoveredClueIds,
      aiTurnEventTypes,
      attackEventTypes,
      playerLeakChecks,
      hostTruthChecks,
    };
  } finally {
    await app.stop();
  }
}

function providerDisabledEnv(input) {
  const env = { ...input };
  delete env.TABLEMIND_AI_PROVIDER_ENDPOINT;
  delete env.TABLEMIND_AI_PROVIDER_API_KEY;
  delete env.TABLEMIND_AI_PROVIDER_MODEL;
  delete env.TABLEMIND_AI_PROVIDER_TIMEOUT_MS;
  env.TABLEMIND_AI_PROVIDER_ENABLED = "false";
  env.TABLEMIND_PLAYTEST_PORT = "0";
  return env;
}

function fixedClock() {
  let index = 0;
  return () => {
    const value = fixedTimes[index];
    index += 1;
    if (!value) {
      throw new Error("smoke flow needs another fixed timestamp");
    }
    return value;
  };
}

async function getJson(url) {
  return await requestJson(url);
}

async function postJson(url, body) {
  return await requestJson(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    throw new Error(`Expected JSON response from ${url}, got: ${text}`);
  }

  return {
    status: response.status,
    body,
    text,
  };
}

function expectOk(result, label) {
  expectStatus(result, 200, label);
  assert.equal(result.body.ok, true, `${label} returned non-ok body: ${result.text}`);
  return result;
}

function expectStatus(result, expectedStatus, label) {
  assert.equal(
    result.status,
    expectedStatus,
    `${label} expected HTTP ${expectedStatus}, got ${result.status}: ${result.text}`,
  );
  return result;
}

function hasForbiddenNeedle(value, needles) {
  const text = JSON.stringify(value);
  return needles.some((needle) => text.includes(needle));
}

function assertNoPlayerLeaks(checks) {
  for (const [label, leaked] of Object.entries(checks)) {
    assert.equal(leaked, false, `${label} leaked player-forbidden content`);
  }
}

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

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const result = await runSmokePlaytestFlow();
    console.log(
      `Smoke playtest flow passed: room=${result.roomId} phase=${result.phase} scene=${result.currentSceneId}`,
    );
  } catch (error) {
    console.error(`Smoke playtest flow failed: ${error.message}`);
    process.exitCode = 1;
  }
}
