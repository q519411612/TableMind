import assert from "node:assert/strict";
import { test } from "node:test";
import { generateSessionRecap } from "../src/index.mjs";

const adventure = {
  title: "The Lantern Beneath the Hill",
  truth: [
    {
      id: "secret_broken_seal",
      title: "Broken Seal",
      text: "Mira broke the shrine seal while searching for her sibling.",
      visibility: "dm_only",
    },
  ],
  clues: [
    {
      id: "clue_broken_lens",
      title: "Broken Lantern Lens",
      text: "The lens was blackened from the inside.",
      visibility: "dm_only",
    },
    {
      id: "clue_miras_charm",
      title: "Mira's Dropped Charm",
      text: "A clay charm with Mira's initials.",
      visibility: "dm_only",
    },
  ],
};

const localizedAdventure = {
  title: "山丘下的灯火",
  truth: [
    {
      id: "secret_broken_seal",
      title: "破损封印",
      text: "米拉打破了神龛封印。",
      visibility: "dm_only",
    },
  ],
  clues: [
    {
      id: "clue_broken_lens",
      title: "破裂的灯镜",
      text: "灯镜从内部被熏黑。",
      visibility: "dm_only",
    },
    {
      id: "clue_miras_charm",
      title: "米拉遗落的护符",
      text: "一枚刻有米拉姓名首字母的陶土护符。",
      visibility: "dm_only",
    },
  ],
};

const sessionState = {
  phase: "ended",
  currentSceneId: "scene_buried_shrine",
  discoveredClueIds: ["clue_broken_lens"],
  characters: {
    char_ada: {
      id: "char_ada",
      name: "Ada Thorne",
      hitPoints: { current: 10, max: 12, temporary: 0 },
      conditions: [],
    },
  },
  flags: {
    ending: {
      visibility: "public",
      value: "Repair the Lantern",
    },
    rewards: {
      visibility: "public",
      value: ["Village gratitude", "A safe hill road"],
    },
    hiddenTruth: {
      visibility: "dm_only",
      value: "Mira broke the shrine seal while searching for her sibling.",
    },
  },
};

const events = [
  {
    id: "event_scene",
    type: "scene.changed",
    sceneId: "scene_lantern_tower",
    createdAt: "2026-06-02T09:00:00.000Z",
  },
  {
    id: "event_roll",
    type: "dice.rolled",
    createdAt: "2026-06-02T09:01:00.000Z",
    roll: { formula: "1d20", total: 17 },
    check: {
      characterId: "char_ada",
      requestType: "skill_check",
      skill: "investigation",
      ability: "intelligence",
      dc: 15,
      selectedD20: 17,
      total: 22,
      success: true,
      reason: "Inspect the lantern soot.",
    },
    reason: "Inspect the lantern soot.",
  },
  {
    id: "event_clue",
    type: "clue.revealed",
    createdAt: "2026-06-02T09:02:00.000Z",
    clueId: "clue_broken_lens",
  },
  {
    id: "event_combat",
    type: "combat.started",
    createdAt: "2026-06-02T09:03:00.000Z",
    encounterId: "encounter_hill_scavengers",
  },
  {
    id: "event_damage",
    type: "damage.applied",
    createdAt: "2026-06-02T09:04:00.000Z",
    targetCombatantId: "combatant_monster_hill_scavenger_1",
    damageResult: { amount: 8, resultingHp: 0 },
  },
  {
    id: "event_end",
    type: "combat.ended",
    createdAt: "2026-06-02T09:05:00.000Z",
    reason: "The remaining scavenger fled.",
  },
  {
    id: "event_secret_patch",
    type: "state.patch",
    createdAt: "2026-06-02T09:06:00.000Z",
    reason: "Mira broke the shrine seal while searching for her sibling.",
    patch: [{ op: "replace", path: "/flags/hiddenTruth", value: "secret" }],
    visibility: "dm_only",
  },
];

test("player recap includes public results and excludes DM-only truth", () => {
  const recap = generateSessionRecap({
    sessionState,
    events,
    adventure,
    viewerRole: "player",
  });

  assert.equal(recap.title, "The Lantern Beneath the Hill Recap");
  assert.equal(recap.audience, "player");
  assert.deepEqual(recap.discoveredClues, ["Broken Lantern Lens"]);
  assert.deepEqual(recap.rewards, ["Village gratitude", "A safe hill road"]);
  assert.equal(recap.unresolvedThreads, undefined);
  assert.equal(recap.markdown.includes("Mira broke the shrine seal"), false);
  assert.deepEqual(recap.keyRolls[0].check, {
    characterId: "char_ada",
    requestType: "skill_check",
    skill: "investigation",
    ability: "intelligence",
    dc: 15,
    selectedD20: 17,
    total: 22,
    success: true,
    reason: "Inspect the lantern soot.",
  });
  assert.ok(recap.markdown.includes("## Timeline"));
  assert.ok(
    recap.markdown.includes(
      "Inspect the lantern soot.: skill_check investigation DC 15, d20 17, total 22, success.",
    ),
  );
  assert.ok(recap.markdown.includes("The remaining scavenger fled."));
});

test("Host recap includes unresolved hidden threads and character status", () => {
  const recap = generateSessionRecap({
    sessionState,
    events,
    adventure,
    viewerRole: "host",
  });

  assert.equal(recap.audience, "host");
  assert.deepEqual(recap.unresolvedThreads, [
    "Secret: Broken Seal",
    "Unrevealed clue: Mira's Dropped Charm",
  ]);
  assert.deepEqual(recap.characterStates, ["Ada Thorne: 10/12 HP"]);
  assert.ok(recap.markdown.includes("Secret: Broken Seal"));
});

test("player recap excludes rejected review payloads but includes approved AI messages", () => {
  const recap = generateSessionRecap({
    sessionState,
    events: [
      ...events,
      {
        id: "event_review_created",
        type: "host.review.created",
        createdAt: "2026-06-02T09:07:00.000Z",
        reviewItem: {
          id: "review_0001",
          type: "ai_output",
          proposedPayload: {
            publicMessage: "Mira broke the shrine seal while searching for her sibling.",
          },
          reason: "Spoiler guard blocked output.",
          riskLevel: "high",
          status: "pending",
        },
      },
      {
        id: "event_review_updated",
        type: "host.review.updated",
        createdAt: "2026-06-02T09:08:00.000Z",
        itemId: "review_0001",
        action: "reject",
        reason: "Mira broke the shrine seal while searching for her sibling.",
      },
      {
        id: "event_ai_message",
        type: "ai.message",
        createdAt: "2026-06-02T09:09:00.000Z",
        message: "The lantern flickers back to life.",
        reviewItemId: "review_0002",
        reviewStatus: "approved",
        visibility: "public",
      },
    ],
    adventure,
    viewerRole: "player",
  });

  assert.equal(recap.markdown.includes("Mira broke the shrine seal"), false);
  assert.ok(recap.markdown.includes("The lantern flickers back to life."));
});

test("player recap can render Chinese labels without translating authored gameplay text", () => {
  const recap = generateSessionRecap({
    sessionState,
    events,
    adventure,
    viewerRole: "player",
    locale: "zh-CN",
  });

  assert.equal(recap.title, "The Lantern Beneath the Hill 战报");
  assert.equal(recap.audience, "player");
  assert.ok(recap.markdown.includes("受众：玩家"));
  assert.ok(recap.markdown.includes("## 摘要"));
  assert.ok(recap.markdown.includes("## 时间线"));
  assert.ok(recap.markdown.includes("## 关键骰子"));
  assert.ok(recap.markdown.includes("## 已发现线索"));
  assert.ok(recap.markdown.includes("## 战斗结果"));
  assert.ok(recap.markdown.includes("## 角色状态"));
  assert.ok(recap.markdown.includes("## 奖励"));
  assert.ok(
    recap.markdown.includes(
      "Inspect the lantern soot.: skill_check investigation DC 15，d20 17，总值 22，成功。",
    ),
  );
  assert.ok(recap.markdown.includes("Broken Lantern Lens"));
  assert.ok(recap.markdown.includes("Repair the Lantern"));
  assert.ok(recap.markdown.includes("Village gratitude"));
  assert.equal(recap.markdown.includes("## Summary"), false);
  assert.equal(recap.markdown.includes("Audience:"), false);
  assert.equal(recap.markdown.includes("Mira broke the shrine seal"), false);
});

test("Host recap can render Chinese Host-only labels while keeping secrets Host-only", () => {
  const recap = generateSessionRecap({
    sessionState,
    events,
    adventure,
    viewerRole: "host",
    locale: "zh-CN",
  });

  assert.deepEqual(recap.unresolvedThreads, [
    "秘密：Broken Seal",
    "未揭示线索：Mira's Dropped Charm",
  ]);
  assert.ok(recap.markdown.includes("## 主持备注"));
  assert.ok(recap.markdown.includes("秘密：Broken Seal"));
  assert.equal(recap.markdown.includes("Host Notes"), false);
});

test("recap uses explicit localized authored adventure text when provided", () => {
  const playerRecap = generateSessionRecap({
    sessionState,
    events,
    adventure: localizedAdventure,
    viewerRole: "player",
    locale: "zh-CN",
  });
  const hostRecap = generateSessionRecap({
    sessionState,
    events,
    adventure: localizedAdventure,
    viewerRole: "host",
    locale: "zh-CN",
  });

  assert.equal(playerRecap.title, "山丘下的灯火 战报");
  assert.deepEqual(playerRecap.discoveredClues, ["破裂的灯镜"]);
  assert.equal(playerRecap.markdown.includes("破损封印"), false);
  assert.deepEqual(hostRecap.unresolvedThreads, [
    "秘密：破损封印",
    "未揭示线索：米拉遗落的护符",
  ]);
  assert.ok(hostRecap.markdown.includes("秘密：破损封印"));
});

test("Host recap includes review audit history", () => {
  const recap = generateSessionRecap({
    sessionState,
    events: [
      {
        id: "event_review_created",
        type: "host.review.created",
        createdAt: "2026-06-02T09:07:00.000Z",
        reviewItem: {
          id: "review_0001",
          type: "ai_output",
          proposedPayload: { publicMessage: "Unsafe output." },
          reason: "Spoiler guard blocked output.",
          riskLevel: "high",
          status: "pending",
        },
      },
      {
        id: "event_review_updated",
        type: "host.review.updated",
        createdAt: "2026-06-02T09:08:00.000Z",
        itemId: "review_0001",
        action: "reject",
        reason: "Too early.",
      },
    ],
    adventure,
    viewerRole: "host",
  });

  assert.ok(recap.markdown.includes("Review created: Spoiler guard blocked output."));
  assert.ok(recap.markdown.includes("Review reject: Too early."));
});
