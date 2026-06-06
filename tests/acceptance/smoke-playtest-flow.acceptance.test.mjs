import assert from "node:assert/strict";
import { test } from "node:test";
import { runSmokePlaytestFlow } from "../../scripts/smoke-playtest-flow.mjs";

test("scripted HTTP playtest smoke repeats the QA flow with provider disabled", async () => {
  const result = await runSmokePlaytestFlow({
    logger: quietLogger(),
  });

  assert.equal(result.providerEnabled, false);
  assert.equal(result.phase, "ended");
  assert.equal(result.currentSceneId, "scene_lantern_tower");
  assert.deepEqual(result.playerDiscoveredClueIds, ["clue_broken_lens"]);
  assert.deepEqual(result.attackEventTypes, ["attack.resolved", "damage.applied"]);
  assert.equal(result.playerLeakChecks.playerSnapshot, false);
  assert.equal(result.playerLeakChecks.playerAdventureSnapshot, false);
  assert.equal(result.playerLeakChecks.playerRecap, false);
  assert.equal(result.hostTruthChecks.hostAdventureSnapshot, true);
  assert.equal(result.hostTruthChecks.hostRecap, true);
});

function quietLogger() {
  return {
    log() {},
    error() {},
  };
}
