import assert from "node:assert/strict";
import { test } from "node:test";
import { loadAdventureFixture } from "../../packages/adventure-loader/src/index.mjs";
import { createSequenceRandomSource } from "../../packages/rules-engine/src/index.mjs";
import { createRoomService } from "../../apps/server/src/room-service.mjs";
import {
  createMockAiAdapter,
  runAiDmTurn,
} from "../../apps/server/src/ai-dm-orchestrator.mjs";

const demoCharacter = {
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
  attacks: [],
  spells: [],
  inventory: [],
  conditions: [],
};

test("milestone 4 simulates mock AI rule routing and spoiler review", async () => {
  const adventure = await loadAdventureFixture(
    "packages/shared-test-fixtures/adventures/the-lantern-beneath-the-hill.md",
  );
  const service = createRoomService();
  const room = service.createRoom({
    hostDisplayName: "Host",
    rulesetId: adventure.rulesetId,
    adventureModuleId: adventure.id,
    startingSceneId: adventure.startingSceneId,
    now: "2026-06-02T06:00:00.000Z",
  });
  const player = service.joinRoom({
    roomId: room.roomId,
    displayName: "Ada",
    now: "2026-06-02T06:01:00.000Z",
  });
  service.createCharacterForPlayer({
    roomId: room.roomId,
    playerId: player.playerId,
    character: demoCharacter,
    now: "2026-06-02T06:01:30.000Z",
  });
  service.loadAdventureModule({
    roomId: room.roomId,
    hostPlayerId: room.hostPlayerId,
    adventure,
    now: "2026-06-02T06:01:45.000Z",
  });

  const safeTurn = await runAiDmTurn({
    adapter: createMockAiAdapter({
      publicMessage: "The soot around the lantern frame begs for a closer look.",
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
      unrevealedClues: [],
      dmOnlySecrets: adventure.truth,
    },
    randomSource: createSequenceRandomSource([0.6]),
  });

  const unsafeTurn = await runAiDmTurn({
    adapter: createMockAiAdapter({
      publicMessage: adventure.truth[0].text,
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
    randomSource: createSequenceRandomSource([]),
  });

  const queued = service.addHostReviewItem({
    roomId: room.roomId,
    type: unsafeTurn.reviewItem.type,
    proposedPayload: unsafeTurn.reviewItem.proposedPayload,
    reason: unsafeTurn.reviewItem.reason,
    riskLevel: unsafeTurn.reviewItem.riskLevel,
    now: "2026-06-02T06:02:00.000Z",
  });

  assert.equal(safeTurn.status, "broadcast_ready");
  assert.equal(safeTurn.ruleResults[0].type, "skill_check");
  assert.equal(safeTurn.ruleResults[0].success, true);
  assert.equal(unsafeTurn.status, "host_review_required");
  assert.equal(queued.status, "pending");
  assert.equal(
    service.getHostReviewQueue({
      roomId: room.roomId,
      viewerRole: "host",
    })[0].riskLevel,
    "high",
  );
  assert.throws(
    () =>
      service.getHostReviewQueue({
        roomId: room.roomId,
        viewerRole: "player",
      }),
    /forbidden/,
  );
});
