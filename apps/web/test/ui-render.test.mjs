import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  createHostCommandClient,
  createPlayerCommandClient,
  createTableMindApi,
} from "../src/api-client.mjs";
import { buildHostReviewUpdateFromForm } from "../src/host-review-form.mjs";
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

test("player renderer treats incomplete persisted identity as not joined", () => {
  const html = renderPlayerRoom({
    locale: "zh-CN",
    roomId: "",
    playerId: "player_0002",
    playerSessionToken: "tm_test_session_token_player",
    snapshot: undefined,
  });

  assert.ok(html.includes("data-action=\"join-room\""));
  assert.equal(html.includes("data-action=\"create-character\""), false);
});

test("player renderer requires a snapshot before showing player actions", () => {
  const html = renderPlayerRoom({
    locale: "zh-CN",
    roomId: "room_0001",
    playerId: "player_0002",
    playerSessionToken: "tm_test_session_token_player",
    snapshot: undefined,
  });

  assert.ok(html.includes("data-action=\"join-room\""));
  assert.equal(html.includes("data-action=\"create-character\""), false);
});

test("renderers can render fixed UI labels in English", () => {
  const playerHtml = renderPlayerRoom({
    roomId: "room_0001",
    playerId: "player_0002",
    snapshot: playerSnapshot(),
    adventureSnapshot: playerAdventureSnapshot(),
    recap: {
      markdown: "Repair the Lantern\nVillage gratitude",
    },
  });
  const hostHtml = renderHostRoom({
    room: {
      roomId: "room_0001",
      hostPlayerId: "player_0001",
      inviteLink: "http://localhost:3000/rooms/room_0001",
    },
    snapshot: hostSnapshot(),
    adventureSnapshot: hostAdventureSnapshot(),
    reviewQueue: [],
  });

  assert.ok(playerHtml.includes("Player Room"));
  assert.ok(playerHtml.includes("Current Scene"));
  assert.ok(playerHtml.includes("Public Feed"));
  assert.ok(playerHtml.includes("Dice Log"));
  assert.ok(playerHtml.includes("Recap"));
  assert.ok(hostHtml.includes("Host Console"));
  assert.ok(hostHtml.includes("Create Room"));
  assert.ok(hostHtml.includes("Review Queue"));
  assert.ok(hostHtml.includes("Run AI"));
});

test("player renderer can render fixed UI labels in Chinese", () => {
  const joinHtml = renderPlayerRoom({
    locale: "zh-CN",
    roomId: "room_0001",
    playerId: undefined,
    snapshot: undefined,
  });
  const html = renderPlayerRoom({
    locale: "zh-CN",
    roomId: "room_0001",
    playerId: "player_0002",
    snapshot: playerSnapshot(),
    adventureSnapshot: playerAdventureSnapshot(),
  });

  assert.ok(joinHtml.includes("玩家房间"));
  assert.ok(joinHtml.includes("加入房间"));
  assert.ok(html.includes("当前场景"));
  assert.ok(html.includes("公共动态"));
  assert.ok(html.includes("骰子记录"));
  assert.ok(html.includes("角色"));
  assert.ok(html.includes("刷新"));
  assert.equal(html.includes(secretText), false);
});

test("localized UI keeps authored gameplay text unchanged", () => {
  const html = renderPlayerRoom({
    locale: "zh-CN",
    roomId: "room_0001",
    playerId: "player_0002",
    snapshot: playerSnapshot(),
    adventureSnapshot: playerAdventureSnapshot(),
    recap: {
      markdown: "Repair the Lantern\nVillage gratitude",
    },
  });

  assert.ok(html.includes("当前场景"));
  assert.ok(html.includes("Lantern Tower"));
  assert.ok(html.includes("The lantern tower squats against the black sky."));
  assert.ok(html.includes("Ada Thorne"));
  assert.ok(html.includes("I inspect the lantern."));
  assert.ok(html.includes("Cold soot curls around the cracked lantern frame."));
  assert.ok(html.includes("Inspect the lantern soot."));
  assert.ok(html.includes("Repair the Lantern"));
  assert.ok(html.includes("Village gratitude"));
  assert.equal(html.includes(secretText), false);
});

test("Host renderer can render fixed UI labels in Chinese", () => {
  const html = renderHostRoom({
    locale: "zh-CN",
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
  });

  assert.ok(html.includes("主持控制台"));
  assert.ok(html.includes("创建房间"));
  assert.ok(html.includes("审核队列"));
  assert.ok(html.includes("运行 AI"));
  assert.ok(html.includes("揭示线索"));
  assert.ok(html.includes(secretText));
});

test("Host renderer hides completed review items from the pending queue", () => {
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
        reason: "AI proposed a reveal.",
        riskLevel: "none",
        status: "rejected",
        proposedPayload: {
          publicMessage: "The lantern trembles.",
        },
      },
    ],
  });

  assert.ok(html.includes("No pending review items."));
  assert.equal(html.includes("data-command=\"host.review.update\""), false);
  assert.equal(html.includes("AI proposed a reveal."), false);
});

test("Host renderer summarizes pending review payloads and exposes edit controls", () => {
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
        reason: "AI proposed a state patch.",
        riskLevel: "high",
        status: "pending",
        proposedPayload: {
          publicMessage: "The lantern trembles in the rain.",
          privateMessages: [
            {
              playerId: "player_0002",
              message: "Only Ada should see this.",
            },
          ],
          revealProposals: [
            {
              entityType: "clue",
              entityId: "clue_broken_lens",
              reason: "The player inspected the lens.",
            },
          ],
          statePatch: {
            op: "replace",
            path: "/phase",
            value: "ended",
          },
        },
      },
    ],
  });

  assert.ok(html.includes("Type"));
  assert.ok(html.includes("ai_output"));
  assert.ok(html.includes("Risk"));
  assert.ok(html.includes("high"));
  assert.ok(html.includes("Reason"));
  assert.ok(html.includes("AI proposed a state patch."));
  assert.ok(html.includes("Public Message"));
  assert.ok(html.includes("The lantern trembles in the rain."));
  assert.ok(html.includes("Reveal Proposal"));
  assert.ok(html.includes("clue: clue_broken_lens"));
  assert.ok(html.includes("State Patch"));
  assert.ok(html.includes("replace /phase"));
  assert.ok(html.includes("data-review-action=\"edit\""));
  assert.ok(html.includes("name=\"publicMessage\""));
  assert.ok(html.includes("name=\"proposedPayload\""));
  assert.ok(html.includes("Save Edit"));
  assert.equal(html.includes("<pre>"), false);
});

test("Host renderer shows clear AI pause and active states", () => {
  const pausedHtml = renderHostRoom({
    room: {
      roomId: "room_0001",
      hostPlayerId: "player_0001",
      inviteLink: "http://localhost:3000/rooms/room_0001",
    },
    snapshot: hostSnapshot(),
    adventureSnapshot: hostAdventureSnapshot(),
    reviewQueue: [],
  });
  const activeHtml = renderHostRoom({
    room: {
      roomId: "room_0001",
      hostPlayerId: "player_0001",
      inviteLink: "http://localhost:3000/rooms/room_0001",
    },
    snapshot: {
      ...hostSnapshot(),
      flags: {
        aiPaused: {
          visibility: "dm_only",
          value: false,
        },
      },
    },
    adventureSnapshot: hostAdventureSnapshot(),
    reviewQueue: [],
  });

  assert.ok(pausedHtml.includes("AI Status"));
  assert.ok(pausedHtml.includes("Paused for Host review"));
  assert.equal(pausedHtml.includes("Paused: true"), false);
  assert.ok(activeHtml.includes("AI Status"));
  assert.ok(activeHtml.includes("Active for AI turns"));
  assert.equal(activeHtml.includes("Paused: false"), false);
});

test("Host review edit form parser submits edited payload and rejects invalid JSON", () => {
  const formData = new FormData();
  formData.set("itemId", "review_0001");
  formData.set("action", "edit");
  formData.set("reason", "Host edited output.");
  formData.set("publicMessage", "Edited safe narration.");
  formData.set(
    "proposedPayload",
    JSON.stringify({
      publicMessage: "Draft narration.",
      statePatch: {
        op: "replace",
        path: "/phase",
        value: "ended",
      },
    }),
  );

  assert.deepEqual(buildHostReviewUpdateFromForm(formData), {
    itemId: "review_0001",
    action: "edit",
    reason: "Host edited output.",
    proposedPayload: {
      publicMessage: "Edited safe narration.",
      statePatch: {
        op: "replace",
        path: "/phase",
        value: "ended",
      },
    },
  });

  formData.set("proposedPayload", "{ invalid json");
  assert.throws(
    () => buildHostReviewUpdateFromForm(formData),
    /Invalid review payload JSON/,
  );
});

test("static web entries expose a language switcher hook", () => {
  const indexHtml = readFileSync(
    new URL("../public/index.html", import.meta.url),
    "utf8",
  );
  const playerHtml = readFileSync(
    new URL("../public/player.html", import.meta.url),
    "utf8",
  );
  const hostHtml = readFileSync(
    new URL("../public/host.html", import.meta.url),
    "utf8",
  );

  for (const html of [indexHtml, playerHtml, hostHtml]) {
    assert.ok(html.includes("data-language-switcher"));
  }
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

test("Host renderer surfaces invite copy, player readiness, and next setup hint", () => {
  const html = renderHostRoom({
    room: {
      roomId: "room_0001",
      hostPlayerId: "player_0001",
      inviteLink: "/player.html?roomId=room_0001",
    },
    snapshot: setupReadyHostSnapshot(),
    adventureSnapshot: hostAdventureSnapshot(),
    reviewQueue: [],
  });

  assert.ok(html.includes("data-action=\"copy-invite\""));
  assert.ok(html.includes("/player.html?roomId=room_0001"));
  assert.ok(html.includes("Players ready: 2/2"));
  assert.ok(html.includes("Ready"));
  assert.ok(html.includes("Ready to start the session."));
  assert.equal(html.includes("Needs character"), false);
});

test("Player renderer pre-fills invite room id and shows setup next steps", () => {
  const joinHtml = renderPlayerRoom({
    roomId: "room_0001",
  });
  const noCharacterHtml = renderPlayerRoom({
    roomId: "room_0001",
    playerId: "player_0002",
    playerSessionToken: "tm_test_session_token_player",
    snapshot: {
      ...playerSnapshot(),
      phase: "lobby",
      characters: {},
    },
  });
  const readyHtml = renderPlayerRoom({
    roomId: "room_0001",
    playerId: "player_0002",
    playerSessionToken: "tm_test_session_token_player",
    snapshot: {
      ...playerSnapshot(),
      phase: "lobby",
    },
  });
  const liveHtml = renderPlayerRoom({
    roomId: "room_0001",
    playerId: "player_0002",
    playerSessionToken: "tm_test_session_token_player",
    snapshot: {
      ...playerSnapshot(),
      phase: "playing",
    },
    adventureSnapshot: playerAdventureSnapshot(),
  });

  assert.ok(joinHtml.includes("name=\"roomId\" value=\"room_0001\""));
  assert.ok(joinHtml.includes("Join from the invite link to enter the room."));
  assert.ok(noCharacterHtml.includes("Create a demo-ready character."));
  assert.ok(readyHtml.includes("Waiting for the Host to start."));
  assert.ok(liveHtml.includes("Describe an action or wait for the AI prompt."));
  assert.equal(liveHtml.includes(secretText), false);
});

test("player renderer derives attack controls from projected combat state", () => {
  const html = renderPlayerRoom({
    roomId: "room_0001",
    playerId: "player_0002",
    playerSessionToken: "tm_test_session_token_player",
    snapshot: combatReadyPlayerSnapshot(),
  });

  assert.ok(html.includes("data-action=\"combat-attack\""));
  assert.ok(html.includes("name=\"attackerCombatantId\" value=\"combatant_char_ada\""));
  assert.ok(html.includes("name=\"attackId\" value=\"attack_longsword\""));
  assert.ok(html.includes("<select name=\"targetCombatantId\" required>"));
  assert.ok(html.includes("value=\"combatant_monster_hill_scavenger_1\""));
  assert.ok(html.includes("Hill Scavenger"));
  assert.equal(html.includes("<input name=\"targetCombatantId\""), false);
});

test("combat renderers show round, turn order, AC, status, and conditions", () => {
  const snapshot = combatReadyPlayerSnapshot();
  snapshot.combat.activeCombatantId = "combatant_monster_hill_scavenger_1";
  snapshot.combat.combatants[0].initiative = 12;
  snapshot.combat.combatants[0].armorClass = 16;
  snapshot.combat.combatants[0].conditions = [
    { conditionId: "condition_blessed", source: "Ada" },
  ];
  snapshot.combat.combatants[1].initiative = 7;
  snapshot.combat.combatants[1].armorClass = 13;
  snapshot.combat.combatants[1].conditions = [
    { conditionId: "condition_grappled", source: "Host" },
  ];

  const playerHtml = renderPlayerRoom({
    roomId: "room_0001",
    playerId: "player_0002",
    playerSessionToken: "tm_test_session_token_player",
    snapshot,
  });
  const hostHtml = renderHostRoom({
    room: {
      roomId: "room_0001",
      hostPlayerId: "player_0001",
      inviteLink: "http://localhost:3000/rooms/room_0001",
    },
    snapshot: {
      ...hostSnapshot(),
      combat: snapshot.combat,
    },
    adventureSnapshot: hostAdventureSnapshot(),
    reviewQueue: [],
  });

  for (const html of [playerHtml, hostHtml]) {
    assert.ok(html.includes("Round 2"));
    assert.ok(html.includes("Active: Hill Scavenger"));
    assert.ok(html.includes("Turn Order"));
    assert.ok(html.includes("Ada Thorne"));
    assert.ok(html.includes("Initiative 12"));
    assert.ok(html.includes("AC 16"));
    assert.ok(html.includes("condition_blessed"));
    assert.ok(html.includes("Hill Scavenger"));
    assert.ok(html.includes("Initiative 7"));
    assert.ok(html.includes("AC 13"));
    assert.ok(html.includes("active"));
    assert.ok(html.includes("condition_grappled"));
  }
});

test("player renderer shows attack and damage outcomes without Host-only combat events", () => {
  const snapshot = combatReadyPlayerSnapshot();
  snapshot.eventLog = [
    ...snapshot.eventLog,
    {
      type: "attack.resolved",
      attackerCombatantId: "combatant_char_ada",
      targetCombatantId: "combatant_monster_hill_scavenger_1",
      attackId: "attack_longsword",
      attackResult: {
        d20: {
          formula: "1d20",
          total: 14,
        },
        attackBonus: 5,
        total: 19,
        armorClass: 13,
        hit: true,
      },
    },
    {
      type: "damage.applied",
      targetCombatantId: "combatant_monster_hill_scavenger_1",
      damageResult: {
        roll: {
          formula: "1d8+3",
          total: 8,
        },
        amount: 8,
        damageType: "slashing",
        resultingHp: 0,
      },
    },
  ];
  snapshot.combat.combatants[1].hitPoints.current = 0;
  snapshot.combat.combatants[1].status = "defeated";

  const html = renderPlayerRoom({
    roomId: "room_0001",
    playerId: "player_0002",
    playerSessionToken: "tm_test_session_token_player",
    snapshot,
  });

  assert.ok(html.includes("Longsword Attack 19 vs AC 13: hit"));
  assert.ok(html.includes("Damage 8 slashing, HP 0"));
  assert.ok(html.includes("1d20+5"));
  assert.ok(html.includes("1d8+3"));
  assert.ok(html.includes("Longsword"));
  assert.ok(html.includes("defeated"));
  assert.equal(html.includes("state.patch"), false);
  assert.equal(html.includes(hostPauseReason), false);
  assert.equal(html.includes(secretText), false);
});

test("player renderer hides attack controls when it is not the player's turn", () => {
  const snapshot = combatReadyPlayerSnapshot();
  snapshot.combat.activeCombatantId = "combatant_monster_hill_scavenger_1";

  const html = renderPlayerRoom({
    roomId: "room_0001",
    playerId: "player_0002",
    playerSessionToken: "tm_test_session_token_player",
    snapshot,
  });

  assert.equal(html.includes("data-action=\"combat-attack\""), false);
  assert.ok(html.includes("No available attack this turn."));
});

test("Host renderer derives combat patch targets from projected combat state", () => {
  const html = renderHostRoom({
    room: {
      roomId: "room_0001",
      hostPlayerId: "player_0001",
      inviteLink: "http://localhost:3000/rooms/room_0001",
    },
    snapshot: {
      ...hostSnapshot(),
      combat: combatReadyPlayerSnapshot().combat,
    },
    adventureSnapshot: hostAdventureSnapshot(),
    reviewQueue: [],
  });

  assert.ok(html.includes("<select name=\"combatantId\" required>"));
  assert.ok(html.includes("value=\"combatant_monster_hill_scavenger_1\""));
  assert.ok(html.includes("Hill Scavenger"));
  assert.equal(html.includes("<input name=\"combatantId\""), false);
});

test("renderers show command errors without leaking undefined labels", () => {
  const playerHtml = renderPlayerRoom({
    roomId: "room_missing",
    errorMessage: "Room not found.",
  });
  const hostHtml = renderHostRoom({
    errorMessage: "Adventure is not loaded.",
  });

  assert.ok(playerHtml.includes("role=\"alert\""));
  assert.ok(playerHtml.includes("Room not found."));
  assert.ok(hostHtml.includes("role=\"alert\""));
  assert.ok(hostHtml.includes("Adventure is not loaded."));
  assert.equal(playerHtml.includes("undefined"), false);
  assert.equal(hostHtml.includes("undefined"), false);
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
    hostSessionToken: "tm_test_session_token_host",
    now: () => "2026-06-02T16:00:00.000Z",
  });
  const player = createPlayerCommandClient({
    api,
    roomId: "room_0001",
    playerId: "player_0002",
    playerSessionToken: "tm_test_session_token_player",
    now: () => "2026-06-02T16:00:00.000Z",
  });

  await host.loadAdventure({ id: "adventure_lantern_beneath_hill" });
  await host.startSession();
  await host.changeScene("scene_lantern_tower", "The party reaches the hill.");
  await host.revealClue("clue_broken_lens");
  await host.setAiPaused(true, "Host review.");
  await host.updateReview("review_0001", "edit", "Host edited output.", {
    publicMessage: "Edited safe narration.",
  });
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
  assert.ok(calls.at(-1).url.includes("sessionToken=tm_test_session_token_player"));
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
  const reviewCall = calls.find(
    (call) => call.body?.type === "host.review.update",
  );
  assert.deepEqual(reviewCall.body.payload, {
    itemId: "review_0001",
    action: "edit",
    reason: "Host edited output.",
    proposedPayload: {
      publicMessage: "Edited safe narration.",
    },
  });
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

function combatReadyPlayerSnapshot() {
  const snapshot = playerSnapshot();
  snapshot.combat = {
    round: 2,
    activeCombatantId: "combatant_char_ada",
    combatants: [
      {
        id: "combatant_char_ada",
        sourceId: "char_ada",
        playerId: "player_0002",
        kind: "character",
        displayName: "Ada Thorne",
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
        status: "active",
      },
      {
        id: "combatant_monster_hill_scavenger_1",
        sourceId: "monster_hill_scavenger",
        kind: "monster",
        displayName: "Hill Scavenger",
        hitPoints: {
          current: 7,
          max: 7,
        },
        attacks: [
          {
            id: "attack_claws",
            name: "Claws",
          },
        ],
        status: "active",
      },
    ],
  };
  return snapshot;
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

function setupReadyHostSnapshot() {
  const snapshot = hostSnapshot();
  snapshot.phase = "lobby";
  snapshot.players = {
    player_0001: {
      id: "player_0001",
      displayName: "Host",
      role: "host",
    },
    player_0002: {
      id: "player_0002",
      displayName: "Ada",
      role: "player",
      characterId: "char_ada",
    },
    player_0003: {
      id: "player_0003",
      displayName: "Bran",
      role: "player",
      characterId: "char_bran",
    },
  };
  snapshot.characters = {
    char_ada: {
      ...snapshot.characters.char_ada,
      id: "char_ada",
      playerId: "player_0002",
    },
    char_bran: {
      ...snapshot.characters.char_ada,
      id: "char_bran",
      playerId: "player_0003",
      name: "Bran Vale",
      className: "Rogue",
    },
  };
  return snapshot;
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
