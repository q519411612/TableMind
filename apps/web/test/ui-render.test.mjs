import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createHostCommandClient,
  createPlayerCommandClient,
  createTableMindApi,
} from "../src/api-client.mjs";
import { renderHostRoom } from "../src/render-host.mjs";
import { renderPlayerRoom } from "../src/render-player.mjs";

const secretText = "Mira broke the shrine seal while searching for her sibling.";
const hostPauseReason = "Host reviews the closing narration.";

test("player renderer shows play panels without rendering Host-only input", () => {
  const joinHtml = renderPlayerRoom({
    roomId: "room_0001",
    playerId: undefined,
    snapshot: undefined,
  });
  const html = renderPlayerRoom({
    roomId: "room_0001",
    playerId: "player_0002",
    snapshot: playerSnapshot(),
    adventureSnapshot: playerAdventureSnapshot(),
    hostSnapshot: {
      flags: {
        hiddenTruth: {
          visibility: "dm_only",
          value: secretText,
        },
      },
    },
    recap: {
      markdown: "Repair the Lantern\nVillage gratitude",
    },
  });

  assert.ok(joinHtml.includes("data-action=\"join-room\""));
  assert.ok(html.includes("Lantern Tower"));
  assert.ok(html.includes("Cold soot curls around the cracked lantern frame."));
  assert.ok(html.includes("Ada Thorne"));
  assert.ok(html.includes("1d20+5"));
  assert.ok(html.includes("combatant_char_ada"));
  assert.ok(html.includes("Repair the Lantern"));
  assert.equal(html.includes(secretText), false);
  assert.equal(html.includes(hostPauseReason), false);
});

test("Host renderer includes DM-only scene, review, combat, and recap controls", () => {
  const html = renderHostRoom({
    room: {
      roomId: "room_0001",
      hostPlayerId: "player_0001",
      inviteLink: "http://localhost:3000/rooms/room_0001",
    },
    snapshot: hostSnapshot(),
    adventureSnapshot: hostAdventureSnapshot(),
    reviewQueue: [
      {
        id: "review_0001",
        type: "ai_output",
        reason: "AI confidence is low.",
        riskLevel: "medium",
        status: "pending",
        proposedPayload: {
          publicMessage: "The lantern flickers.",
        },
      },
    ],
    recap: {
      markdown: "Host recap\nSecret: Broken Seal",
    },
  });

  assert.ok(html.includes("data-action=\"create-room\""));
  assert.ok(html.includes("http://localhost:3000/rooms/room_0001"));
  assert.ok(html.includes("old shrine record"));
  assert.ok(html.includes(secretText));
  assert.ok(html.includes("data-command=\"clue.reveal\""));
  assert.ok(html.includes("data-command=\"scene.change\""));
  assert.ok(html.includes("data-command=\"host.review.update\""));
  assert.ok(html.includes("data-command=\"ai.turn.run\""));
  assert.ok(html.includes("data-command=\"combat.start\""));
  assert.ok(html.includes("data-command=\"combat.patch_hp\""));
  assert.ok(html.includes("name=\"combatantId\""));
  assert.ok(html.includes("name=\"currentHp\""));
  assert.ok(html.includes("data-command=\"combat.advance_turn\""));
  assert.ok(html.includes("name=\"condition\""));
  assert.ok(html.includes("<option value=\"apply\">Apply</option>"));
  assert.ok(html.includes("data-command=\"session.complete\""));
  assert.ok(html.includes("Secret: Broken Seal"));
});

test("UI command clients use the transport contract and keep player snapshots player-scoped", async () => {
  const calls = [];
  const api = createTableMindApi({
    baseUrl: "http://localhost:4173",
    fetchImpl: async (url, options = {}) => {
      calls.push({
        url,
        method: options.method ?? "GET",
        body: options.body ? JSON.parse(options.body) : undefined,
      });
      return jsonResponse({ ok: true, data: {}, snapshot: {} });
    },
  });
  const host = createHostCommandClient({
    api,
    roomId: "room_0001",
    hostPlayerId: "player_0001",
    hostSessionToken: "host_session_token",
    now: () => "2026-06-02T16:00:00.000Z",
  });
  const player = createPlayerCommandClient({
    api,
    roomId: "room_0001",
    playerId: "player_0002",
    playerSessionToken: "player_session_token",
    now: () => "2026-06-02T16:00:00.000Z",
  });

  await host.loadAdventure({ id: "adventure_lantern_beneath_hill" });
  await host.startSession();
  await host.changeScene("scene_lantern_tower", "The party reaches the hill.");
  await host.revealClue("clue_broken_lens");
  await host.setAiPaused(true, "Host review.");
  await host.updateReview("review_0001", "approve", "Safe.");
  await host.listReviewQueue();
  await host.runAiTurn({ randomValues: [0.7] });
  await host.startCombat({
    encounterId: "encounter_hill_scavengers",
    characterIds: ["char_ada"],
    compendiumEntries: [],
  });
  await host.patchHitPoints("combatant_monster_1", 0, "Host override.");
  await host.patchCondition(
    "combatant_monster_1",
    "condition_prone",
    "apply",
    "Knocked down.",
  );
  await host.advanceTurn();
  await host.endCombat("The scavenger flees.");
  await host.completeSession("Repair the Lantern", ["Village gratitude"]);
  await player.sendMessage("I inspect the lantern.");
  await player.createCharacter({ id: "char_ada" });
  await player.attack({
    attackerCombatantId: "combatant_char_ada",
    targetCombatantId: "combatant_monster_1",
    attackId: "attack_longsword",
  });
  await player.refreshSnapshot();

  assert.deepEqual(
    calls
      .filter((call) => call.url.endsWith("/actions"))
      .map((call) => call.body.type),
    [
      "adventure.load",
      "session.start",
      "scene.change",
      "clue.reveal",
      "ai.pause",
      "host.review.update",
      "host.review.list",
      "ai.turn.run",
      "combat.start",
      "combat.patch_hp",
      "combat.patch_condition",
      "combat.advance_turn",
      "combat.end",
      "session.complete",
      "message.send",
      "character.create",
      "combat.attack",
    ],
  );
  assert.ok(calls.at(-1).url.includes("sessionToken=player_session_token"));
  assert.equal(calls.some((call) => call.url.includes("viewerRole=host")), false);
  assert.equal(
    calls
      .filter((call) => call.url.endsWith("/actions"))
      .every((call) => typeof call.body.sessionToken === "string"),
    true,
  );
  const conditionCall = calls.find(
    (call) => call.body?.type === "combat.patch_condition",
  );
  assert.deepEqual(conditionCall.body.payload.condition, {
    conditionId: "condition_prone",
  });
  assert.equal(conditionCall.body.payload.action, "apply");
});

function jsonResponse(body) {
  return {
    async json() {
      return structuredClone(body);
    },
  };
}

function playerSnapshot() {
  return {
    roomId: "room_0001",
    currentSceneId: "scene_lantern_tower",
    phase: "combat",
    players: {
      player_0002: {
        id: "player_0002",
        displayName: "Ada",
        characterId: "char_ada",
      },
    },
    characters: {
      char_ada: {
        id: "char_ada",
        playerId: "player_0002",
        name: "Ada Thorne",
        className: "Fighter",
        level: 1,
        armorClass: 16,
        hitPoints: {
          current: 12,
          max: 12,
        },
        attacks: [
          {
            id: "attack_longsword",
            name: "Longsword",
          },
        ],
      },
    },
    eventLog: [
      {
        type: "player.message",
        actorId: "player_0002",
        message: "I inspect the lantern.",
      },
      {
        type: "ai.message",
        message: "Cold soot curls around the cracked lantern frame.",
        visibility: "public",
      },
      {
        type: "dice.rolled",
        roll: {
          formula: "1d20+5",
          total: 20,
        },
        reason: "Inspect the lantern soot.",
      },
    ],
    diceLog: [
      {
        formula: "1d20+5",
        total: 20,
        reason: "Inspect the lantern soot.",
      },
    ],
    combat: {
      activeCombatantId: "combatant_char_ada",
      combatants: [
        {
          id: "combatant_char_ada",
          displayName: "Ada Thorne",
          hitPoints: {
            current: 12,
            max: 12,
          },
          status: "active",
        },
      ],
    },
  };
}

function hostSnapshot() {
  return {
    ...playerSnapshot(),
    flags: {
      aiPaused: {
        visibility: "dm_only",
        value: true,
      },
    },
    eventLog: [
      ...playerSnapshot().eventLog,
      {
        type: "state.patch",
        reason: hostPauseReason,
      },
    ],
  };
}

function playerAdventureSnapshot() {
  return {
    currentScene: {
      id: "scene_lantern_tower",
      title: "Lantern Tower",
      readAloud: {
        text: "The lantern tower squats against the black sky.",
      },
      clues: [
        {
          id: "clue_broken_lens",
          title: "Broken Lantern Lens",
          text: "The cracked lens is blackened from the inside.",
        },
      ],
    },
  };
}

function hostAdventureSnapshot() {
  return {
    ...playerAdventureSnapshot(),
    currentScene: {
      ...playerAdventureSnapshot().currentScene,
      dmNotes: {
        text: "The hatch clue connects to the old shrine record.",
      },
    },
    truth: [
      {
        id: "secret_broken_seal",
        title: "Broken Seal",
        text: secretText,
      },
    ],
  };
}
