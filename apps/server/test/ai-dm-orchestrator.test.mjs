import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createMockAiAdapter,
  runAiDmTurn,
  validateAiDmResponse,
} from "../src/ai-dm-orchestrator.mjs";
import { createSequenceRandomSource } from "../../../packages/rules-engine/src/index.mjs";

const context = {
  session: {
    characters: {
      char_ada: {
        id: "char_ada",
        level: 1,
        abilities: {
          strength: 10,
          dexterity: 12,
          constitution: 12,
          intelligence: 16,
          wisdom: 10,
          charisma: 8,
        },
        skillProficiencies: ["investigation"],
        savingThrowProficiencies: [],
      },
    },
  },
  currentScene: {
    id: "scene_lantern_tower",
    title: "Lantern Tower",
  },
  hiddenEntities: [],
  unrevealedClues: [],
  dmOnlySecrets: [],
};

test("validates structured AI DM output and rejects fabricated dice results", () => {
  assert.doesNotThrow(() =>
    validateAiDmResponse({
      publicMessage: "The tower creaks in the wind.",
      ruleRequests: [],
      confidence: "medium",
    }),
  );

  assert.throws(
    () =>
      validateAiDmResponse({
        publicMessage: "You rolled an 18.",
        diceResults: [{ total: 18 }],
      }),
    /dice/,
  );

  assert.throws(
    () => validateAiDmResponse({ publicMessage: 42 }),
    /publicMessage/,
  );

  assert.throws(
    () =>
      validateAiDmResponse({
        publicMessage: "The scavenger raises its rusted blade.",
        ruleRequests: [
          {
            type: "attack",
            attackerId: "combatant_monster_hill_scavenger_1",
            targetId: "combatant_char_ada",
            attackId: "attack_claw",
            reason: "Resolve the monster attack.",
          },
        ],
      }),
    /attack requests are not supported/,
  );
});

test("routes skill check requests through the rules engine", async () => {
  const adapter = createMockAiAdapter({
    publicMessage: "Inspect the soot around the lantern frame.",
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
  });

  const result = await runAiDmTurn({
    adapter,
    context,
    randomSource: createSequenceRandomSource([0.7]),
  });

  assert.equal(result.status, "broadcast_ready");
  assert.equal(result.ruleResults[0].type, "skill_check");
  assert.equal(result.ruleResults[0].characterId, "char_ada");
  assert.equal(result.ruleResults[0].requestType, "skill_check");
  assert.equal(result.ruleResults[0].skill, "investigation");
  assert.equal(result.ruleResults[0].ability, "intelligence");
  assert.equal(result.ruleResults[0].selectedD20, 15);
  assert.equal(result.ruleResults[0].dc, 15);
  assert.equal(result.ruleResults[0].total, 20);
  assert.equal(result.ruleResults[0].success, true);
});

test("unsafe public messages require Host review instead of broadcast", async () => {
  const adapter = createMockAiAdapter({
    publicMessage: "Mira broke the shrine seal while searching for her sibling.",
    confidence: "high",
  });

  const result = await runAiDmTurn({
    adapter,
    context: {
      ...context,
      dmOnlySecrets: [
        {
          id: "secret_broken_seal",
          title: "Broken Seal",
          text: "Mira broke the shrine seal while searching for her sibling.",
          visibility: "dm_only",
        },
      ],
    },
    randomSource: createSequenceRandomSource([]),
  });

  assert.equal(result.status, "host_review_required");
  assert.equal(result.reviewItem.type, "ai_output");
  assert.equal(result.reviewItem.riskLevel, "high");
  assert.equal(result.reviewItem.proposedPayload.publicMessage.includes("Mira"), true);
});
