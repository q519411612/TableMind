import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

test("MVP-1.0 final playtest evidence documents required checklist and report fields", async () => {
  const checklist = await readFile(
    "docs/playtests/MVP_1_0_PLAYTEST_CHECKLIST.md",
    "utf8",
  );
  const reportTemplate = await readFile(
    "docs/playtests/MVP_1_0_PLAYTEST_REPORT_TEMPLATE.md",
    "utf8",
  );
  const readme = await readFile("docs/playtests/README.md", "utf8");
  const completedReport = await readFile(
    "docs/playtests/MVP_1_0_PLAYTEST_REPORT_SIMULATED.md",
    "utf8",
  );

  const checklistText = checklist.toLowerCase();
  const reportTemplateText = reportTemplate.toLowerCase();
  const readmeText = readme.toLowerCase();

  for (const required of [
    "participants",
    "adventure",
    "ai provider",
    "spoiler",
    "host interventions",
    "rules",
    "combat",
    "recap",
  ]) {
    assert.ok(checklistText.includes(required), required);
    assert.ok(reportTemplateText.includes(required), required);
  }

  for (const required of [
    "pass/fail decision",
    "blockers",
    "mvp-1.0 is not complete",
    "no live provider calls",
  ]) {
    assert.ok(readmeText.includes(required), required);
  }

  const completedReportText = completedReport.toLowerCase();
  for (const required of [
    "pass/fail decision: pass",
    "participants",
    "the lantern beneath the hill",
    "ai provider enabled: false",
    "spoiler incidents: none",
    "host interventions",
    "rules checks resolved",
    "combat encounter",
    "player recap generated: yes",
    "host recap generated: yes",
  ]) {
    assert.ok(completedReportText.includes(required), required);
  }
});
