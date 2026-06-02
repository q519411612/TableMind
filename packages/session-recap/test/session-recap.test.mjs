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
  assert.ok(recap.markdown.includes("## Timeline"));
  assert.ok(recap.markdown.includes("Inspect the lantern soot."));
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
