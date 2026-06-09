import assert from "node:assert/strict";
import { test } from "node:test";
import { loadAdventureFixture } from "../../../packages/adventure-loader/src/index.mjs";
import { createSequenceRandomSource } from "../../../packages/rules-engine/src/index.mjs";
import {
  buildAiContextForRoom,
  loadAiProviderConfig,
  runAiTurnForRoom,
} from "../src/ai-room-runner.mjs";
import { createMockAiAdapter } from "../src/ai-dm-orchestrator.mjs";
import { createProviderAiAdapter } from "../src/provider-ai-adapter.mjs";
import { createRoomActionDispatcher } from "../src/room-actions.mjs";
import { createRoomService } from "../src/room-service.mjs";

const testProviderApiKey = "<TEST_PROVIDER_API_KEY_DO_NOT_USE>";

test("AI context is room-aware and excludes provider secrets", async () => {
  const { service, room } = await createLoadedAiRoom();
  service.sendPublicMessage({
    roomId: room.roomId,
    playerId: "player_0002",
    text: "I inspect the soot.",
    now: "2026-06-02T19:10:00.000Z",
  });

  const context = buildAiContextForRoom({
    roomService: service,
    roomId: room.roomId,
    providerConfig: {
      enabled: true,
      apiKey: testProviderApiKey,
    },
  });

  assert.equal(context.session.roomId, room.roomId);
  assert.equal(context.currentScene.id, "scene_lantern_tower");
  assert.ok(context.currentScene.dmNotes.text.includes("hatch below the tower"));
  assert.ok(context.dmOnlySecrets[0].text.includes("broke the shrine seal"));
  assert.ok(
    context.unrevealedClues.some((clue) => clue.id === "clue_broken_lens"),
  );
  assert.ok(context.recentPublicEvents.some((event) => event.message === "I inspect the soot."));
  assert.equal(JSON.stringify(context).includes(testProviderApiKey), false);
});

test("AI context can use localized authored adventure text", async () => {
  const { service, room } = await createLoadedAiRoom();

  const context = buildAiContextForRoom({
    roomService: service,
    roomId: room.roomId,
    locale: "zh-CN",
  });

  assert.equal(context.currentScene.title, "灯塔");
  assert.ok(context.currentScene.dmNotes.text.includes("活板门"));
  assert.ok(
    context.unrevealedClues.some((clue) => clue.title === "破裂的灯镜"),
  );
  assert.ok(context.dmOnlySecrets[0].text.includes("神龛封印"));
});

test("AI context bounds large public history and keeps newest public events", async () => {
  const { service, room } = await createLoadedAiRoom();
  for (let index = 0; index < 60; index += 1) {
    service.sendPublicMessage({
      roomId: room.roomId,
      playerId: "player_0002",
      text: `Older public note ${index} ${"x".repeat(600)}`,
      now: publicHistoryTime(index),
    });
  }
  service.sendPublicMessage({
    roomId: room.roomId,
    playerId: "player_0002",
    text: "Newest relevant public note.",
    now: "2026-06-02T20:20:00.000Z",
  });

  const context = buildAiContextForRoom({
    roomService: service,
    roomId: room.roomId,
    maxContextBytes: 8000,
  });
  const serialized = JSON.stringify(context);

  assert.ok(serialized.length <= context.contextBudget.maxBytes);
  assert.equal(context.contextBudget.truncatedRecentPublicEvents, true);
  assert.ok(context.contextBudget.omittedRecentPublicEventCount > 0);
  assert.ok(
    context.recentPublicEvents.some(
      (event) => event.message === "Newest relevant public note.",
    ),
  );
  assert.equal(
    context.recentPublicEvents.some((event) =>
      event.message?.startsWith("Older public note 0"),
    ),
    false,
  );
  assert.ok(context.dmOnlySecrets[0].text.includes("broke the shrine seal"));
  assert.ok(
    context.unrevealedClues.some((clue) => clue.id === "clue_broken_lens"),
  );
});

test("safe AI narration commits dice and public AI message through room events", async () => {
  const { service, room, player } = await createLoadedAiRoom();

  const result = await runAiTurnForRoom({
    roomService: service,
    roomId: room.roomId,
    hostPlayerId: room.hostPlayerId,
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
    randomSource: createSequenceRandomSource([0.7]),
    now: "2026-06-02T19:11:00.000Z",
  });

  const events = service.getCommittedEvents(room.roomId).slice(-2);
  const playerSnapshot = service.getSnapshot({
    roomId: room.roomId,
    viewerRole: "player",
    viewerPlayerId: player.playerId,
  });

  assert.equal(result.status, "broadcast_ready");
  assert.deepEqual(events.map((event) => event.type), ["dice.rolled", "ai.message"]);
  assert.equal(result.ruleResults[0].total, 20);
  assert.deepEqual(events[0].check, {
    characterId: "char_ada",
    requestType: "skill_check",
    skill: "investigation",
    ability: "intelligence",
    dc: 15,
    selectedD20: 15,
    total: 20,
    success: true,
    reason: "Inspect the lantern soot.",
  });
  assert.equal(playerSnapshot.diceLog.at(-1).reason, "Inspect the lantern soot.");
  assert.deepEqual(playerSnapshot.diceLog.at(-1).check, events[0].check);
  assert.ok(
    playerSnapshot.eventLog.some(
      (event) =>
        event.type === "ai.message" &&
        event.message === "Cold soot curls around the cracked lantern frame.",
    ),
  );
});

test("provider bridge safe structured response auto-commits through room runner", async () => {
  const { service, room, player } = await createLoadedAiRoom();
  const calls = [];

  const result = await runAiTurnForRoom({
    roomService: service,
    roomId: room.roomId,
    hostPlayerId: room.hostPlayerId,
    providerConfig: { enabled: true },
    adapter: createProviderAiAdapter({
      enabled: true,
      endpoint: "https://provider.invalid/v1/respond",
      apiKey: testProviderApiKey,
      model: "structured-dm",
      fetchImpl: async (url, init) => {
        calls.push({ url, init });
        return {
          ok: true,
          async json() {
            return {
              publicMessage: "Cold soot curls around the cracked lantern frame.",
              ruleRequests: [],
              confidence: "high",
            };
          },
        };
      },
    }),
    randomSource: createSequenceRandomSource([]),
    now: "2026-06-02T19:11:30.000Z",
  });

  const playerSnapshot = service.getSnapshot({
    roomId: room.roomId,
    viewerRole: "player",
    viewerPlayerId: player.playerId,
  });

  assert.equal(result.status, "broadcast_ready");
  assert.equal(result.events.at(-1).type, "ai.message");
  assert.equal(result.events.at(-1).message, "Cold soot curls around the cracked lantern frame.");
  assert.equal(JSON.stringify(playerSnapshot).includes(testProviderApiKey), false);
  assert.equal(JSON.parse(calls[0].init.body).model, "structured-dm");
  assert.equal(JSON.stringify(JSON.parse(calls[0].init.body)).includes(testProviderApiKey), false);
});

test("provider bridge reveal proposal creates Host review without broadcast", async () => {
  const { service, room } = await createLoadedAiRoom();

  const result = await runAiTurnForRoom({
    roomService: service,
    roomId: room.roomId,
    hostPlayerId: room.hostPlayerId,
    providerConfig: { enabled: true },
    adapter: createProviderAiAdapter({
      enabled: true,
      endpoint: "https://provider.invalid/v1/respond",
      apiKey: testProviderApiKey,
      model: "structured-dm",
      fetchImpl: async () => ({
        ok: true,
        async json() {
          return {
            publicMessage: "The lantern trembles in the rain.",
            revealProposals: [
              {
                entityType: "clue",
                entityId: "clue_broken_lens",
                reason: "The player inspected the lens.",
              },
            ],
            confidence: "high",
          };
        },
      }),
    }),
    randomSource: createSequenceRandomSource([]),
    now: "2026-06-02T19:11:40.000Z",
  });

  const events = service.getCommittedEvents(room.roomId);

  assert.equal(result.status, "host_review_required");
  assert.equal(result.reviewItem.status, "pending");
  assert.equal(events.at(-1).type, "host.review.created");
  assert.equal(events.some((event) => event.type === "ai.message"), false);
  assert.deepEqual(result.broadcasts, []);
});

test("provider bridge timeout maps to controlled runner error", async () => {
  const { service, room } = await createLoadedAiRoom();

  const result = await runAiTurnForRoom({
    roomService: service,
    roomId: room.roomId,
    hostPlayerId: room.hostPlayerId,
    providerConfig: { enabled: true },
    adapter: createProviderAiAdapter({
      enabled: true,
      endpoint: "https://provider.invalid/v1/respond",
      apiKey: testProviderApiKey,
      model: "structured-dm",
      timeoutMs: 1,
      fetchImpl: async (_url, init) =>
        new Promise((_resolve, reject) => {
          init.signal.addEventListener("abort", () => {
            const error = new Error(`timeout with ${testProviderApiKey}`);
            error.name = "AbortError";
            reject(error);
          });
        }),
    }),
    randomSource: createSequenceRandomSource([]),
    now: "2026-06-02T19:11:50.000Z",
  });

  assert.equal(result.status, "rejected");
  assert.equal(result.error.code, "provider_timeout");
  assert.equal(result.error.message.includes(testProviderApiKey), false);
  assert.deepEqual(result.events, []);
  assert.deepEqual(result.broadcasts, []);
});

test("provider bridge request failure maps to controlled runner error", async () => {
  const { service, room } = await createLoadedAiRoom();

  const result = await runAiTurnForRoom({
    roomService: service,
    roomId: room.roomId,
    hostPlayerId: room.hostPlayerId,
    providerConfig: { enabled: true },
    adapter: createProviderAiAdapter({
      enabled: true,
      endpoint: "https://provider.invalid/v1/respond",
      apiKey: testProviderApiKey,
      model: "structured-dm",
      fetchImpl: async () => {
        throw new Error(`request failed with ${testProviderApiKey}`);
      },
    }),
    randomSource: createSequenceRandomSource([]),
    now: "2026-06-02T19:11:55.000Z",
  });

  assert.equal(result.status, "rejected");
  assert.equal(result.error.code, "provider_request_failed");
  assert.equal(result.error.message.includes(testProviderApiKey), false);
  assert.deepEqual(result.events, []);
  assert.deepEqual(result.broadcasts, []);
});

test("provider bridge invalid payload maps to controlled runner error", async () => {
  const { service, room } = await createLoadedAiRoom();

  const result = await runAiTurnForRoom({
    roomService: service,
    roomId: room.roomId,
    hostPlayerId: room.hostPlayerId,
    providerConfig: { enabled: true },
    adapter: createProviderAiAdapter({
      enabled: true,
      endpoint: "https://provider.invalid/v1/respond",
      apiKey: testProviderApiKey,
      model: "structured-dm",
      fetchImpl: async () => ({
        ok: true,
        async json() {
          return {
            confidence: "high",
          };
        },
      }),
    }),
    randomSource: createSequenceRandomSource([]),
    now: "2026-06-02T19:11:58.000Z",
  });

  assert.equal(result.status, "rejected");
  assert.equal(result.error.code, "invalid_provider_payload");
  assert.equal(result.error.message.includes(testProviderApiKey), false);
  assert.deepEqual(result.events, []);
  assert.deepEqual(result.broadcasts, []);
});

test("AI output requiring supervision creates Host review without public broadcast", async () => {
  const cases = [
    {
      name: "exact secret",
      response: {
        publicMessage:
          "id: secret_broken_seal\nMira, a frightened apprentice, broke the shrine seal while searching for her missing sibling. The spirit beneath the hill is not evil, but it is using the dead lantern to draw help.",
        confidence: "high",
      },
    },
    {
      name: "hidden clue title",
      response: {
        publicMessage: "You should reveal the Broken Lantern Lens.",
        confidence: "high",
      },
    },
    {
      name: "hidden clue alias",
      response: {
        publicMessage: "Mira points toward the hatch below the tower.",
        confidence: "high",
      },
    },
    {
      name: "hidden entity alias",
      mutateAdventure(adventure) {
        adventure.encounters.find(
          (encounter) => encounter.id === "encounter_hill_scavengers",
        ).aliases = ["stone-hushed raiders"];
      },
      response: {
        publicMessage: "The stone-hushed raiders wait behind the fallen rocks.",
        confidence: "high",
      },
    },
    {
      name: "low confidence",
      response: {
        publicMessage: "The lantern trembles in the rain.",
        confidence: "low",
      },
    },
    {
      name: "reveal proposal",
      response: {
        publicMessage: "The lantern trembles in the rain.",
        revealProposals: [
          {
            entityType: "clue",
            entityId: "clue_broken_lens",
            reason: "The player inspected the lens.",
          },
        ],
        confidence: "high",
      },
    },
    {
      name: "state patch",
      response: {
        publicMessage: "The lantern trembles in the rain.",
        statePatch: {
          op: "replace",
          path: "/phase",
          value: "ended",
        },
        confidence: "high",
      },
    },
  ];

  for (const testCase of cases) {
    const { service, room, adventure } = await createLoadedAiRoom({
      mutateAdventure: testCase.mutateAdventure,
    });

    const result = await runAiTurnForRoom({
      roomService: service,
      roomId: room.roomId,
      hostPlayerId: room.hostPlayerId,
      adapter: createMockAiAdapter(testCase.response),
      randomSource: createSequenceRandomSource([]),
      now: "2026-06-02T19:12:00.000Z",
    });
    const events = service.getCommittedEvents(room.roomId);

    assert.equal(result.status, "host_review_required", testCase.name);
    assert.equal(result.reviewItem.status, "pending", testCase.name);
    assert.equal(events.at(-1).type, "host.review.created", testCase.name);
    assert.equal(
      events.some((event) => event.type === "ai.message"),
      false,
      testCase.name,
    );
    assert.deepEqual(result.broadcasts, [], testCase.name);
  }
});

test("invalid or unsupported AI output is rejected without state mutation", async () => {
  const cases = [
    {
      name: "fabricated dice",
      response: {
        publicMessage: "You rolled an 18.",
        diceResults: [{ total: 18 }],
      },
    },
    {
      name: "unsupported attack",
      response: {
        publicMessage: "The scavenger attacks.",
        ruleRequests: [
          {
            type: "attack",
            attackerId: "combatant_monster_hill_scavenger_1",
            targetId: "combatant_char_ada",
            attackId: "attack_claw",
            reason: "Resolve the attack.",
          },
        ],
      },
    },
  ];

  for (const testCase of cases) {
    const { service, room } = await createLoadedAiRoom();
    const before = service.getCommittedEvents(room.roomId).length;

    const result = await runAiTurnForRoom({
      roomService: service,
      roomId: room.roomId,
      hostPlayerId: room.hostPlayerId,
      adapter: createMockAiAdapter(testCase.response),
      randomSource: createSequenceRandomSource([]),
      now: "2026-06-02T19:13:00.000Z",
    });

    assert.equal(result.status, "rejected", testCase.name);
    assert.equal(service.getCommittedEvents(room.roomId).length, before, testCase.name);
  }
});

test("provider config is disabled by default and runner refuses provider calls", async () => {
  const { service, room } = await createLoadedAiRoom();
  const config = loadAiProviderConfig({});

  const result = await runAiTurnForRoom({
    roomService: service,
    roomId: room.roomId,
    hostPlayerId: room.hostPlayerId,
    providerConfig: config,
    adapter: {
      async generateStructuredResponse() {
        throw new Error("provider should not run");
      },
    },
    now: "2026-06-02T19:14:00.000Z",
  });

  assert.deepEqual(config, { enabled: false });
  assert.equal(result.status, "provider_disabled");
  assert.equal(result.error.code, "provider_disabled");
});

test("paused AI state blocks adapter execution without committing events", async () => {
  const { service, room } = await createLoadedAiRoom();
  let adapterCalls = 0;
  service.setAiPaused({
    roomId: room.roomId,
    hostPlayerId: room.hostPlayerId,
    paused: true,
    reason: "Host pauses AI during review.",
    now: "2026-06-02T19:14:30.000Z",
  });
  const before = service.getCommittedEvents(room.roomId).length;

  const result = await runAiTurnForRoom({
    roomService: service,
    roomId: room.roomId,
    hostPlayerId: room.hostPlayerId,
    adapter: {
      async generateStructuredResponse() {
        adapterCalls += 1;
        return {
          publicMessage: "This should not be generated while paused.",
          confidence: "high",
        };
      },
    },
    now: "2026-06-02T19:14:45.000Z",
  });

  assert.equal(result.status, "ai_paused");
  assert.equal(adapterCalls, 0);
  assert.equal(service.getCommittedEvents(room.roomId).length, before);
  assert.deepEqual(result.events, []);
  assert.deepEqual(result.broadcasts, []);
});

test("provider config applies default timeout when enabled", () => {
  const config = loadAiProviderConfig({
    TABLEMIND_AI_PROVIDER_ENABLED: "true",
    TABLEMIND_AI_PROVIDER_ENDPOINT: "https://provider.invalid/v1/respond",
    TABLEMIND_AI_PROVIDER_API_KEY: testProviderApiKey,
    TABLEMIND_AI_PROVIDER_MODEL: "structured-dm",
  });

  assert.deepEqual(config, {
    enabled: true,
    endpoint: "https://provider.invalid/v1/respond",
    apiKey: testProviderApiKey,
    model: "structured-dm",
    timeoutMs: 30000,
  });
});

test("review-required AI output does not consume deterministic RNG or expose rule result previews", async () => {
  const { service, room } = await createLoadedAiRoom();

  const result = await runAiTurnForRoom({
    roomService: service,
    roomId: room.roomId,
    hostPlayerId: room.hostPlayerId,
    adapter: createMockAiAdapter({
      publicMessage: "The lantern trembles in the rain.",
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
      confidence: "low",
    }),
    randomSource: createSequenceRandomSource([]),
    now: "2026-06-02T19:15:00.000Z",
  });

  assert.equal(result.status, "host_review_required");
  assert.deepEqual(result.ruleResults, []);
  assert.equal(
    service.getCommittedEvents(room.roomId).some((event) => event.type === "dice.rolled"),
    false,
  );
});

test("ai.turn.run dispatcher command covers safe, review, spoiler, and provider-disabled outcomes", async () => {
  const safeRoom = await createLoadedAiRoom();
  const safeDispatcher = createRoomActionDispatcher({
    roomService: safeRoom.service,
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
  });
  const safe = await safeDispatcher.dispatchRoomCommand({
    type: "ai.turn.run",
    roomId: safeRoom.room.roomId,
    actorPlayerId: safeRoom.room.hostPlayerId,
    payload: {
      randomValues: [0.7],
    },
    now: "2026-06-02T19:16:00.000Z",
  });

  const lowRoom = await createLoadedAiRoom();
  const lowDispatcher = createRoomActionDispatcher({
    roomService: lowRoom.service,
    aiAdapter: createMockAiAdapter({
      publicMessage: "The lantern trembles in the rain.",
      confidence: "low",
    }),
  });
  const low = await lowDispatcher.dispatchRoomCommand({
    type: "ai.turn.run",
    roomId: lowRoom.room.roomId,
    actorPlayerId: lowRoom.room.hostPlayerId,
    payload: {},
    now: "2026-06-02T19:17:00.000Z",
  });

  const spoilerRoom = await createLoadedAiRoom();
  const spoilerDispatcher = createRoomActionDispatcher({
    roomService: spoilerRoom.service,
    aiAdapter: createMockAiAdapter({
      publicMessage:
        "id: secret_broken_seal\nMira, a frightened apprentice, broke the shrine seal while searching for her missing sibling. The spirit beneath the hill is not evil, but it is using the dead lantern to draw help.",
      confidence: "high",
    }),
  });
  const spoiler = await spoilerDispatcher.dispatchRoomCommand({
    type: "ai.turn.run",
    roomId: spoilerRoom.room.roomId,
    actorPlayerId: spoilerRoom.room.hostPlayerId,
    payload: {},
    now: "2026-06-02T19:18:00.000Z",
  });

  const disabledRoom = await createLoadedAiRoom();
  const disabledDispatcher = createRoomActionDispatcher({
    roomService: disabledRoom.service,
    providerConfig: { enabled: false },
    aiAdapter: {
      async generateStructuredResponse() {
        throw new Error("provider should not run");
      },
    },
  });
  const disabled = await disabledDispatcher.dispatchRoomCommand({
    type: "ai.turn.run",
    roomId: disabledRoom.room.roomId,
    actorPlayerId: disabledRoom.room.hostPlayerId,
    payload: {},
    now: "2026-06-02T19:19:00.000Z",
  });

  assert.equal(safe.ok, true);
  assert.equal(safe.data.status, "broadcast_ready");
  assert.deepEqual(safe.events.map((event) => event.type), [
    "dice.rolled",
    "ai.message",
  ]);
  assert.deepEqual(safe.events[0].check, {
    characterId: "char_ada",
    requestType: "skill_check",
    skill: "investigation",
    ability: "intelligence",
    dc: 15,
    selectedD20: 15,
    total: 20,
    success: true,
    reason: "Inspect the lantern soot.",
  });
  assert.equal(low.ok, true);
  assert.equal(low.data.status, "host_review_required");
  assert.equal(low.events[0].type, "host.review.created");
  assert.equal(spoiler.ok, true);
  assert.equal(spoiler.data.status, "host_review_required");
  assert.equal(spoiler.events[0].type, "host.review.created");
  assert.equal(disabled.ok, true);
  assert.equal(disabled.data.status, "provider_disabled");
});

async function createLoadedAiRoom(options = {}) {
  const adventure = await loadAdventureFixture(
    "packages/shared-test-fixtures/adventures/the-lantern-beneath-the-hill.md",
  );
  options.mutateAdventure?.(adventure);
  const service = createRoomService();
  const room = service.createRoom({
    hostDisplayName: "Host",
    rulesetId: adventure.rulesetId,
    adventureModuleId: adventure.id,
    startingSceneId: adventure.startingSceneId,
    now: "2026-06-02T19:00:00.000Z",
  });
  const player = service.joinRoom({
    roomId: room.roomId,
    displayName: "Ada",
    now: "2026-06-02T19:01:00.000Z",
  });
  service.createCharacterForPlayer({
    roomId: room.roomId,
    playerId: player.playerId,
    now: "2026-06-02T19:02:00.000Z",
    character: character(),
  });
  service.loadAdventureModule({
    roomId: room.roomId,
    hostPlayerId: room.hostPlayerId,
    adventure,
    now: "2026-06-02T19:03:00.000Z",
  });
  service.startSession({
    roomId: room.roomId,
    hostPlayerId: room.hostPlayerId,
    now: "2026-06-02T19:04:00.000Z",
  });
  service.changeScene({
    roomId: room.roomId,
    hostPlayerId: room.hostPlayerId,
    sceneId: "scene_lantern_tower",
    reason: "The party reaches the lantern tower.",
    now: "2026-06-02T19:05:00.000Z",
  });

  return { adventure, service, room, player };
}

function character() {
  return {
    id: "char_ada",
    name: "Ada Thorne",
    className: "Fighter",
    level: 1,
    abilities: {
      strength: 14,
      dexterity: 12,
      constitution: 14,
      intelligence: 16,
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
    spells: [],
    inventory: [],
    conditions: [],
  };
}

function publicHistoryTime(index) {
  return new Date(Date.UTC(2026, 5, 2, 19, 10 + index)).toISOString();
}
