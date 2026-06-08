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
    aliases: ["hatch"],
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

test("detects unrevealed clue aliases and exact clue text", () => {
  const aliasResult = checkSpoilers({
    publicMessage: "Mira points toward the hatch below the tower.",
    hiddenEntities: [],
    unrevealedClues,
    dmOnlySecrets: [],
    viewerRole: "player",
  });
  const textResult = checkSpoilers({
    publicMessage: "The cracked lens is blackened from the inside.",
    hiddenEntities: [],
    unrevealedClues,
    dmOnlySecrets: [],
    viewerRole: "player",
  });

  assert.equal(aliasResult.allowed, false);
  assert.equal(aliasResult.riskLevel, "medium");
  assert.equal(aliasResult.findings[0].matchedText, "hatch");
  assert.equal(textResult.allowed, false);
  assert.equal(textResult.riskLevel, "medium");
  assert.equal(textResult.findings[0].matchedText, "The cracked lens is blackened from the inside.");
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

test("detects localized unrevealed clue aliases and exact clue text", () => {
  const aliasResult = checkSpoilers({
    publicMessage: "你们看见塔下活板门。",
    hiddenEntities: [],
    unrevealedClues: [
      {
        id: "clue_broken_lens",
        title: "破裂的灯镜",
        text: "破裂灯镜的内侧被熏黑，煤灰纹路蜷向一扇隐藏的活板门。",
        aliases: ["塔下活板门"],
        visibility: "dm_only",
      },
    ],
    dmOnlySecrets: [],
    viewerRole: "player",
  });
  const textResult = checkSpoilers({
    publicMessage: "破裂灯镜的内侧被熏黑，煤灰纹路蜷向一扇隐藏的活板门。",
    hiddenEntities: [],
    unrevealedClues: [
      {
        id: "clue_broken_lens",
        title: "破裂的灯镜",
        text: "破裂灯镜的内侧被熏黑，煤灰纹路蜷向一扇隐藏的活板门。",
        aliases: ["塔下活板门"],
        visibility: "dm_only",
      },
    ],
    dmOnlySecrets: [],
    viewerRole: "player",
  });

  assert.equal(aliasResult.allowed, false);
  assert.equal(aliasResult.riskLevel, "medium");
  assert.equal(aliasResult.findings[0].matchedText, "塔下活板门");
  assert.equal(textResult.allowed, false);
  assert.equal(textResult.riskLevel, "medium");
  assert.equal(textResult.findings[0].matchedText, "破裂灯镜的内侧被熏黑，煤灰纹路蜷向一扇隐藏的活板门。");
});
