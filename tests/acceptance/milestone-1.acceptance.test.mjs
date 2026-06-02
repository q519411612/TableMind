import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { constants } from "node:fs";
import { test } from "node:test";
import {
  appendSessionEvent,
  createInitialSessionState,
  projectSessionState,
} from "../../packages/domain/src/index.mjs";
import { loadAdventureFixture } from "../../packages/adventure-loader/src/index.mjs";
import {
  loadCompendiumFixture,
  searchCompendium,
} from "../../packages/compendium/src/index.mjs";
import {
  createSequenceRandomSource,
  resolveSkillCheck,
} from "../../packages/rules-engine/src/index.mjs";

async function exists(path) {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

test("repository foundation exposes documented scripts and package boundaries", async () => {
  const packageJson = JSON.parse(await readFile("package.json", "utf8"));

  assert.equal(packageJson.type, "module");
  assert.equal(typeof packageJson.scripts.test, "string");
  assert.equal(typeof packageJson.scripts.acceptance, "string");
  assert.equal(typeof packageJson.scripts.lint, "string");
  assert.equal(typeof packageJson.scripts.typecheck, "string");
  assert.equal(typeof packageJson.scripts.build, "string");

  const requiredPaths = [
    "README.md",
    "scripts/check-js.mjs",
    "scripts/run-tests.mjs",
    "apps/web/README.md",
    "apps/server/README.md",
    "packages/domain/src/index.mjs",
    "packages/rules-engine/src/index.mjs",
    "packages/compendium/src/index.mjs",
    "packages/adventure-loader/src/index.mjs",
    "packages/shared-test-fixtures/adventures",
    "packages/shared-test-fixtures/compendium",
  ];

  const missing = [];
  for (const path of requiredPaths) {
    if (!(await exists(path))) {
      missing.push(path);
    }
  }

  assert.deepEqual(missing, []);
});

test("milestone 1 simulates demo loading, rule lookup, check resolution, and event replay", async () => {
  const adventure = await loadAdventureFixture(
    "packages/shared-test-fixtures/adventures/the-lantern-beneath-the-hill.md",
  );
  const compendium = await loadCompendiumFixture(
    "packages/shared-test-fixtures/compendium/srd-mini.json",
  );
  const [abilityCheckRule] = searchCompendium(compendium, {
    query: "ability checks",
    types: ["rule"],
    limit: 1,
  });

  const character = {
    id: "char_ada",
    level: 1,
    abilities: {
      strength: 10,
      dexterity: 14,
      constitution: 12,
      intelligence: 16,
      wisdom: 11,
      charisma: 8,
    },
    proficientSkills: ["investigation"],
    proficientSaves: [],
  };
  const check = resolveSkillCheck({
    character,
    skill: "investigation",
    dc: 15,
    advantage: "normal",
    reason: "Inspect the broken lantern lens.",
    randomSource: createSequenceRandomSource([0.6]),
  });

  let state = createInitialSessionState({
    id: "session_acceptance",
    roomId: "room_acceptance",
    rulesetId: adventure.rulesetId,
    adventureModuleId: adventure.id,
    currentSceneId: adventure.startingSceneId,
    now: "2026-06-02T00:00:00.000Z",
  });
  state.characters[character.id] = {
    ...character,
    visibility: "public",
  };
  state.flags.hiddenTruth = {
    visibility: "dm_only",
    value: adventure.truth[0].text,
  };

  state = appendSessionEvent(state, {
    id: "event_scene_lantern",
    sessionId: state.id,
    type: "scene.changed",
    actorRole: "host",
    createdAt: "2026-06-02T00:05:00.000Z",
    sceneId: "scene_lantern_tower",
    reason: "The party reaches the tower.",
  });
  state = appendSessionEvent(state, {
    id: "event_investigation_roll",
    sessionId: state.id,
    type: "dice.rolled",
    actorRole: "system",
    createdAt: "2026-06-02T00:06:00.000Z",
    roll: check.d20,
    reason: check.reason,
  });
  state = appendSessionEvent(state, {
    id: "event_broken_lens",
    sessionId: state.id,
    type: "clue.revealed",
    actorRole: "host",
    createdAt: "2026-06-02T00:07:00.000Z",
    clueId: "clue_broken_lens",
  });

  const playerView = projectSessionState({
    state,
    viewerRole: "player",
    viewerPlayerId: "player_ada",
  });

  assert.equal(adventure.title, "The Lantern Beneath the Hill");
  assert.equal(abilityCheckRule.entry.id, "rule_ability_checks");
  assert.equal(check.success, true);
  assert.equal(state.currentSceneId, "scene_lantern_tower");
  assert.deepEqual(state.discoveredClueIds, ["clue_broken_lens"]);
  assert.equal(state.diceLog[0].total, check.d20.total);
  assert.equal(playerView.flags.hiddenTruth, undefined);
});
