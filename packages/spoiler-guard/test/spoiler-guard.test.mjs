import assert from "node:assert/strict";
import { test } from "node:test";
import { checkSpoilers } from "../src/index.mjs";

const hiddenEntities = [
  {
    id: "npc_mira",
    entityType: "npc",
    title: "Mira",
    aliases: ["seal breaker"],
    visibility: "dm_only",
  },
];
const unrevealedClues = [
  {
    id: "clue_broken_lens",
    title: "Broken Lantern Lens",
    text: "The cracked lens is blackened from the inside.",
    visibility: "dm_only",
  },
];
const dmOnlySecrets = [
  {
    id: "secret_broken_seal",
    title: "Broken Seal",
    text: "Mira broke the shrine seal while searching for her sibling.",
    visibility: "dm_only",
  },
];

test("allows safe player-facing output", () => {
  const result = checkSpoilers({
    publicMessage: "The lantern tower stands dark in the rain.",
    hiddenEntities,
    unrevealedClues,
    dmOnlySecrets,
    viewerRole: "player",
  });

  assert.equal(result.allowed, true);
  assert.equal(result.riskLevel, "none");
  assert.deepEqual(result.findings, []);
});

test("blocks DM-only secret phrase leakage", () => {
  const result = checkSpoilers({
    publicMessage: "Mira broke the shrine seal while searching for her sibling.",
    hiddenEntities,
    unrevealedClues,
    dmOnlySecrets,
    viewerRole: "player",
  });

  assert.equal(result.allowed, false);
  assert.equal(result.riskLevel, "high");
  assert.equal(result.findings[0].entityId, "secret_broken_seal");
});

test("detects hidden aliases and unrevealed clue titles", () => {
  const aliasResult = checkSpoilers({
    publicMessage: "The seal breaker is hiding in the village.",
    hiddenEntities,
    unrevealedClues,
    dmOnlySecrets,
    viewerRole: "player",
  });
  const clueResult = checkSpoilers({
    publicMessage: "You should look for the Broken Lantern Lens.",
    hiddenEntities,
    unrevealedClues,
    dmOnlySecrets,
    viewerRole: "player",
  });

  assert.equal(aliasResult.allowed, false);
  assert.equal(aliasResult.riskLevel, "high");
  assert.equal(aliasResult.findings[0].matchedText, "seal breaker");
  assert.equal(clueResult.allowed, false);
  assert.equal(clueResult.riskLevel, "medium");
  assert.equal(clueResult.findings[0].entityType, "clue");
});

test("detects CJK secret leakage after Unicode normalization", () => {
  const result = checkSpoilers({
    publicMessage: "村民低声说，米拉打破了神殿封印。",
    hiddenEntities: [],
    unrevealedClues: [],
    dmOnlySecrets: [
      {
        id: "secret_zh_broken_seal",
        title: "破损封印",
        text: "米拉打破了神殿封印",
        aliases: ["封印破坏者"],
        visibility: "dm_only",
      },
    ],
    viewerRole: "player",
  });

  assert.equal(result.allowed, false);
  assert.equal(result.riskLevel, "high");
  assert.equal(result.findings[0].entityId, "secret_zh_broken_seal");
});
