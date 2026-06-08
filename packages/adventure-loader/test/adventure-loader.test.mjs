import assert from "node:assert/strict";
import { test } from "node:test";
import {
  loadAdventureFixture,
  localizeAdventureModule,
  parseAdventureMarkdown,
  projectAdventureForPlayers,
  validateAdventureModule,
} from "../src/index.mjs";

const fixturePath =
  "packages/shared-test-fixtures/adventures/the-lantern-beneath-the-hill.md";

test("loads the original demo adventure with required metadata", async () => {
  const adventure = await loadAdventureFixture(fixturePath);

  assert.equal(adventure.id, "adventure_lantern_beneath_hill");
  assert.equal(adventure.title, "The Lantern Beneath the Hill");
  assert.equal(adventure.locales["zh-CN"].title, "山丘下的灯火");
  assert.ok(adventure.locales["zh-CN"].synopsis.includes("村庄灯火"));
  assert.equal(adventure.rulesetId, "5e-srd-5.2.1");
  assert.equal(adventure.recommendedLevel, "1");
  assert.equal(adventure.playerCount, "2-4");
  assert.equal(adventure.estimatedTime, "60-90 minutes");
  assert.equal(adventure.status, "draft");
  assert.equal(adventure.source.contentClass, "embedded_original");
  assert.equal(adventure.source.license, "Original TableMind fixture content");
});

test("parses public scenes, DM-only truth, clues, NPCs, encounter, and endings", async () => {
  const adventure = await loadAdventureFixture(fixturePath);

  assert.equal(adventure.scenes.length, 5);
  assert.equal(adventure.npcs.length, 4);
  assert.equal(adventure.clues.length, 7);
  assert.equal(adventure.encounters.length, 1);
  assert.equal(adventure.endings.length, 4);

  const startingScene = adventure.scenes.find(
    (scene) => scene.id === adventure.startingSceneId,
  );
  const hiddenTruth = adventure.truth.find(
    (secret) => secret.id === "secret_broken_seal",
  );
  const hiddenClue = adventure.clues.find(
    (clue) => clue.id === "clue_miras_charm",
  );
  const brokenLens = adventure.clues.find(
    (clue) => clue.id === "clue_broken_lens",
  );
  const encounter = adventure.encounters[0];

  assert.equal(startingScene.readAloud.visibility, "public");
  assert.equal(startingScene.dmNotes.visibility, "dm_only");
  assert.equal(startingScene.locales["zh-CN"].title, "村庄广场");
  assert.ok(
    startingScene.locales["zh-CN"].readAloud.text.includes("潮湿的绳索"),
  );
  assert.ok(startingScene.locales["zh-CN"].dmNotes.text.includes("艾瑞克镇长"));
  assert.equal(hiddenTruth.visibility, "dm_only");
  assert.equal(hiddenClue.visibility, "dm_only");
  assert.deepEqual(brokenLens.aliases, [
    "hatch",
    "hidden hatch",
    "tower hatch",
    "hatch below the tower",
  ]);
  assert.equal(brokenLens.locales["zh-CN"].title, "破裂的灯镜");
  assert.ok(brokenLens.locales["zh-CN"].aliases.includes("塔下活板门"));
  assert.equal(encounter.combatants[0].compendiumEntryId, "monster_hill_scavenger");
  assert.equal(encounter.combatants[0].count, 2);
});

test("player projection removes hidden truth and DM-only notes", async () => {
  const adventure = await loadAdventureFixture(fixturePath);
  const playerView = projectAdventureForPlayers(adventure);
  const serialized = JSON.stringify(playerView);

  assert.equal(playerView.truth, undefined);
  assert.equal(playerView.scenes[0].dmNotes, undefined);
  assert.equal(playerView.clues.some((clue) => clue.id === "clue_miras_charm"), false);
  assert.ok(playerView.scenes[0].readAloud.text.includes("The village square"));
  assert.equal(
    JSON.stringify(playerView).includes("apprentice broke the seal"),
    false,
  );
  assert.equal(serialized.includes("clue_miras_charm"), false);
  assert.equal(serialized.includes("npc_mira"), false);
  assert.equal(serialized.includes("encounter_hill_scavengers"), false);
  assert.equal(serialized.includes("monster_hill_scavenger"), false);
  assert.equal(serialized.includes("Mira's Dropped Charm"), false);
});

test("localizes authored adventure text without changing canonical identifiers", async () => {
  const adventure = await loadAdventureFixture(fixturePath);
  const localized = localizeAdventureModule(adventure, "zh-CN");

  assert.equal(localized.title, "山丘下的灯火");
  assert.equal(localized.synopsis.includes("村庄灯火"), true);
  assert.equal(localized.rulesetId, adventure.rulesetId);
  assert.equal(localized.scenes[0].id, adventure.scenes[0].id);
  assert.equal(localized.scenes[0].title, "村庄广场");
  assert.equal(localized.scenes[0].readAloud.visibility, "public");
  assert.ok(localized.scenes[0].readAloud.text.includes("潮湿的绳索"));
  assert.equal(localized.clues.find((clue) => clue.id === "clue_broken_lens").title, "破裂的灯镜");
  assert.equal(adventure.title, "The Lantern Beneath the Hill");
  assert.equal(adventure.scenes[0].title, "Village Square");
});

test("localization preserves canonical text when a localized field is missing", async () => {
  const adventure = await loadAdventureFixture(fixturePath);
  const partial = structuredClone(adventure);
  partial.locales = {
    "zh-CN": {
      title: "山丘下的灯火",
    },
  };
  delete partial.scenes[0].locales;

  const localized = localizeAdventureModule(partial, "zh-CN");

  assert.equal(localized.title, "山丘下的灯火");
  assert.equal(localized.synopsis, adventure.synopsis);
  assert.equal(localized.scenes[0].title, adventure.scenes[0].title);
});

test("player projection can localize visible authored text without leaking hidden content", async () => {
  const adventure = await loadAdventureFixture(fixturePath);
  const playerView = projectAdventureForPlayers(adventure, { locale: "zh-CN" });
  const serialized = JSON.stringify(playerView);

  assert.equal(playerView.title, "山丘下的灯火");
  assert.equal(playerView.scenes[0].title, "村庄广场");
  assert.ok(playerView.scenes[0].readAloud.text.includes("潮湿的绳索"));
  assert.equal(serialized.includes("艾瑞克镇长希望"), false);
  assert.equal(serialized.includes("破损封印"), false);
  assert.equal(serialized.includes("破裂的灯镜"), false);
  assert.equal(serialized.includes("clue_broken_lens"), false);
});

test("validation reports missing required fields", () => {
  assert.throws(
    () =>
      validateAdventureModule({
        id: "adventure_bad",
        title: "Bad Adventure",
        rulesetId: "5e-srd-5.2.1",
      }),
    /startingSceneId/,
  );
});

test("validation rejects unsupported locale IDs and localized structural overrides", async () => {
  const adventure = await loadAdventureFixture(fixturePath);

  assert.throws(
    () =>
      validateAdventureModule({
        ...structuredClone(adventure),
        locales: {
          pirate: {
            title: "Arrr",
          },
        },
      }),
    /unsupported locale/,
  );
  assert.throws(
    () =>
      validateAdventureModule({
        ...structuredClone(adventure),
        scenes: [
          {
            ...structuredClone(adventure.scenes[0]),
            locales: {
              "zh-CN": {
                id: "scene_bad",
              },
            },
          },
        ],
      }),
    /localized scene.id/,
  );
});

test("validation rejects broken scene references and incomplete source or ending fields", async () => {
  const adventure = await loadAdventureFixture(fixturePath);

  assert.throws(
    () =>
      validateAdventureModule({
        ...structuredClone(adventure),
        scenes: [
          {
            ...structuredClone(adventure.scenes[0]),
            clueIds: ["clue_missing"],
          },
        ],
      }),
    /scene clue not found: clue_missing/,
  );
  assert.throws(
    () =>
      validateAdventureModule({
        ...structuredClone(adventure),
        source: {
          id: "bad_source",
          title: "Bad Source",
          contentClass: "embedded_original",
        },
      }),
    /source.license/,
  );
  assert.throws(
    () =>
      validateAdventureModule({
        ...structuredClone(adventure),
        endings: [
          {
            id: "ending_bad",
            title: "Bad Ending",
          },
        ],
      }),
    /ending.publicText/,
  );
});

test("validation rejects encounter combatants without compendium references", async () => {
  const adventure = await loadAdventureFixture(fixturePath);

  assert.throws(
    () =>
      validateAdventureModule({
        ...structuredClone(adventure),
        encounters: [
          {
            ...structuredClone(adventure.encounters[0]),
            combatants: [{ count: 1 }],
          },
        ],
      }),
    /encounter combatant compendiumEntryId/,
  );
});

test("parser returns draft module with validation warnings preserved", () => {
  const result = parseAdventureMarkdown(`# Adventure: Tiny

## Metadata
id: adventure_tiny
rulesetId: 5e-srd-5.2.1
recommendedLevel: 1
playerCount: 2-4
estimatedTime: 60 minutes
startingSceneId: scene_start

## Synopsis
Tiny synopsis.

## Scene: Start
id: scene_start
### Read Aloud
You are here.
`);

  assert.equal(result.errors.length, 0);
  assert.ok(result.warnings.some((warning) => warning.code === "MISSING_ENDINGS"));
  assert.equal(result.module.status, "draft");
});
