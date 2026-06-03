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
import { createRoomService } from "../src/room-service.mjs";

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
      apiKey: "secret_provider_key",
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
  assert.equal(JSON.stringify(context).includes("secret_provider_key"), false);
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
  assert.equal(playerSnapshot.diceLog.at(-1).reason, "Inspect the lantern soot.");
  assert.ok(
    playerSnapshot.eventLog.some(
      (event) =>
        event.type === "ai.message" &&
        event.message === "Cold soot curls around the cracked lantern frame.",
    ),
  );
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
    const { service, room } = await createLoadedAiRoom();

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

async function createLoadedAiRoom() {
  const adventure = await loadAdventureFixture(
    "packages/shared-test-fixtures/adventures/the-lantern-beneath-the-hill.md",
  );
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
