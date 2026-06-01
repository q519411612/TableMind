import assert from "node:assert/strict";
import { test } from "node:test";
import {
  formatAttribution,
  loadCompendiumFixture,
  searchCompendium,
  validateCompendiumEntry,
  validateContentSource,
} from "../src/index.mjs";

test("fixture loader accepts only entries with allowed source metadata", async () => {
  const entries = await loadCompendiumFixture(
    "packages/shared-test-fixtures/compendium/srd-mini.json",
  );

  assert.equal(entries.length, 5);
  assert.ok(entries.every((entry) => entry.source.license));
  assert.ok(entries.every((entry) => entry.source.attribution));
  assert.ok(
    entries.every((entry) =>
      ["embedded_srd", "embedded_original"].includes(entry.source.contentClass),
    ),
  );
});

test("source validation rejects unknown public fixture sources", () => {
  assert.throws(
    () =>
      validateContentSource({
        id: "source_unknown",
        title: "Unknown",
        contentClass: "unknown",
        visibility: "public",
      }),
    /Unknown public content is not allowed/,
  );
});

test("entry validation rejects missing license and attribution metadata", () => {
  assert.throws(
    () =>
      validateCompendiumEntry({
        id: "rule_bad",
        type: "rule",
        name: "Bad Entry",
        normalizedName: "bad entry",
        source: {
          id: "srd_5_2_1",
          title: "D&D 5e SRD",
          contentClass: "embedded_srd",
          visibility: "public",
        },
        sectionPath: ["Rules"],
        rawText: "Missing metadata.",
        tags: ["rules"],
      }),
    /license/,
  );
});

test("keyword search ranks name, summary, raw text, and type filters", async () => {
  const entries = await loadCompendiumFixture(
    "packages/shared-test-fixtures/compendium/srd-mini.json",
  );
  const conditionResults = searchCompendium(entries, {
    query: "grappled",
    types: ["condition"],
    limit: 3,
  });
  const monsterResults = searchCompendium(entries, {
    query: "scavenger shortbow",
    types: ["monster"],
    limit: 2,
  });

  assert.equal(conditionResults[0].entry.id, "condition_grappled");
  assert.equal(conditionResults[0].matchReason, "name");
  assert.equal(monsterResults[0].entry.id, "monster_hill_scavenger");
  assert.ok(monsterResults[0].score > 0);
});

test("attribution contract is displayable for cited results", async () => {
  const entries = await loadCompendiumFixture(
    "packages/shared-test-fixtures/compendium/srd-mini.json",
  );
  const [result] = searchCompendium(entries, {
    query: "ability checks",
    types: ["rule"],
    limit: 1,
  });

  assert.equal(
    formatAttribution(result.entry),
    "D&D 5e SRD (CC-BY-4.0): System Reference Document 5.2.1",
  );
});
