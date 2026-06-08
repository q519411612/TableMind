# Chinese Adventure Support Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Simplified Chinese authored adventure text for the built-in Lantern demo, then expose a reusable locale contract for future AdventureModule content.

**Architecture:** Keep one canonical AdventureModule graph with stable IDs, references, visibility, and rules data. Add explicit `locales` authored-text fields, project localized snapshots through server/room boundaries, and keep UI renderers as thin consumers of localized snapshots. Tests must prove `zh-CN` content appears only where visible and that player surfaces remain no-leak safe.

**Tech Stack:** Node 20+, ESM `.mjs`, built-in `node:test`, `node:assert/strict`, zero-dependency browser UI, existing room service and adventure-loader packages.

---

## File Structure

- Modify: `packages/adventure-loader/src/index.mjs`
  - Parse module/entity locale blocks from structured Markdown.
  - Validate locale payloads.
  - Export `localizeAdventureModule` and optional locale helpers.
  - Keep `projectAdventureForPlayers(adventure, options)` backward compatible.
- Modify: `packages/shared-test-fixtures/adventures/the-lantern-beneath-the-hill.md`
  - Add original Simplified Chinese authored text in explicit locale blocks.
  - Preserve all IDs, references, visibility, combatants, and metadata.
- Modify: `packages/adventure-loader/test/adventure-loader.test.mjs`
  - Cover parsing, fallback, validation, player projection, Host projection.
- Modify: `apps/server/src/room-service.mjs`
  - Accept optional `locale` in `getAdventureSnapshot`.
  - Localize Host/player adventure snapshots inside room boundaries.
- Modify: `apps/server/src/http-server.mjs`
  - Pass `?locale=` or `?lang=` from adventure snapshot requests to dispatcher.
- Modify: `apps/server/src/room-actions.mjs`
  - Include optional `locale` in `adventure.snapshot` and `ai.turn.run` command flow.
- Modify: `apps/server/src/ai-room-runner.mjs`
  - Build AI context from localized Host adventure snapshot when locale is supplied.
- Modify: `apps/server/test/adventure-runtime.test.mjs`
  - Cover localized Host/player room snapshots.
- Modify: `apps/server/test/http-server.test.mjs`
  - Cover localized HTTP adventure snapshot with player no-leak.
- Modify: `apps/server/test/ai-room-runner.test.mjs`
  - Cover localized AI context and hidden localized spoiler terms.
- Modify: `apps/web/src/api-client.mjs`
  - Add optional locale query parameter to `getAdventureSnapshot`.
- Modify: `apps/web/src/host-app.mjs`
  - Request localized adventure snapshots and pass locale through `ai.turn.run`.
- Modify: `apps/web/src/player-app.mjs`
  - Request localized adventure snapshots after join, refresh, stream updates, and language switch.
- Modify: `apps/web/test/ui-render.test.mjs`
  - Assert renderers display localized authored scene text from localized snapshots.
- Modify: `tests/acceptance/demo-browser-setup.acceptance.test.mjs`
  - Add Host plus player `zh-CN` snapshot assertions without DM-only leakage.
- Modify: `tests/acceptance/mvp-ui-playtest.acceptance.test.mjs`
  - Extend existing Chinese UI path to include localized authored adventure text.
- Modify: `packages/session-recap/src/index.mjs`
  - Use localized adventure data when provided; avoid translating canonical event IDs.
- Modify: `packages/session-recap/test/session-recap.test.mjs`
  - Cover localized visible clue names and Host-only localized hidden threads.
- Modify: `packages/spoiler-guard/src/index.mjs`
  - Ensure localized aliases/titles/text participate in deterministic matching.
- Modify: `packages/spoiler-guard/test/spoiler-guard.test.mjs`
  - Cover localized hidden secret and unrevealed clue leakage.
- Modify: `README.md`
  - Document English and Simplified Chinese fixed UI plus authored demo content.
- Modify: `docs/CURRENT_STATUS.md`
  - Record true current support and fallback behavior.
- Modify: `docs/codex/demo-goal-pack/DEMO_SCOPE_GAP_ANALYSIS.md`
  - Update demo scope evidence.

## Chunk 1: Adventure Locale Contract And Fixture

### Task 1: Add failing loader tests for localized Lantern content

**Files:**
- Modify: `packages/adventure-loader/test/adventure-loader.test.mjs`

- [ ] **Write the failing test**

Add assertions to the existing fixture test:

```js
assert.equal(adventure.locales["zh-CN"].title, "山丘下的灯火");
assert.ok(adventure.locales["zh-CN"].synopsis.includes("村庄灯火"));

const startingScene = adventure.scenes.find(
  (scene) => scene.id === "scene_village_square",
);
assert.equal(startingScene.locales["zh-CN"].title, "村庄广场");
assert.ok(startingScene.locales["zh-CN"].readAloud.text.includes("潮湿的绳索"));
assert.ok(startingScene.locales["zh-CN"].dmNotes.text.includes("艾瑞克镇长"));

const hiddenClue = adventure.clues.find(
  (clue) => clue.id === "clue_broken_lens",
);
assert.equal(hiddenClue.locales["zh-CN"].title, "破裂的灯镜");
assert.ok(hiddenClue.locales["zh-CN"].aliases.includes("塔下活板门"));
```

- [ ] **Run the test to verify it fails**

Run:

```bash
node scripts/run-tests.mjs packages/adventure-loader/test/adventure-loader.test.mjs
```

Expected: FAIL because `locales` is undefined.

### Task 2: Add localized authored text to the Lantern fixture

**Files:**
- Modify: `packages/shared-test-fixtures/adventures/the-lantern-beneath-the-hill.md`

- [ ] **Add module locale block**

Add after `## Synopsis`:

```md
## Locale: zh-CN
title: 山丘下的灯火

### Synopsis
村庄里守护旧山路的灯火在暴风雨前熄灭。队伍调查灯塔，发现被掩埋神龛的痕迹，并决定修复灯火、释放灯下的声音，或在夜幕降临前撤离。
```

- [ ] **Add entity locale blocks**

For each `## Scene`, `## NPC`, `## Clue`, `## Encounter`, and `## Ending`, add
`### Locale: zh-CN` with `title:` plus localized `####` subsections matching the
entity's authored fields. Preserve all canonical IDs and reference lists.

### Task 3: Parse locale blocks in the adventure loader

**Files:**
- Modify: `packages/adventure-loader/src/index.mjs`

- [ ] **Add locale constants and module locale parsing**

Add near the top:

```js
export const SUPPORTED_ADVENTURE_LOCALES = ["en", "zh-CN"];
const localizedLocaleValues = new Set(["zh-CN"]);
```

Add helpers:

```js
function parseModuleLocales(lines) {
  return Object.fromEntries(
    readAllTopLevelLocaleBlocks(lines).map((block) => {
      const parsed = parseLocaleBlock(block, 3);
      return [
        parsed.locale,
        {
          title: parsed.metadata.title,
          synopsis: readLeveledSubsection(parsed.body, "Synopsis", 3).trim(),
        },
      ];
    }),
  );
}
```

- [ ] **Add entity locale parsing**

Add helpers shaped like:

```js
function parseEntityLocales(content, fields) {
  return Object.fromEntries(
    readEntityLocaleBlocks(content).map((block) => {
      const parsed = parseLocaleBlock(block, 4);
      return [
        parsed.locale,
        buildLocalizedEntity(parsed, fields),
      ];
    }),
  );
}
```

Use it in `parseScenes`, `parseNpc`, `parseClue`, `parseEncounter`, and
`parseEnding`.

- [ ] **Run the loader test**

Run:

```bash
node scripts/run-tests.mjs packages/adventure-loader/test/adventure-loader.test.mjs
```

Expected: still FAIL until validation/localization support is complete, but
parser assertions should be closer.

### Task 4: Validate locale payloads and fallback behavior

**Files:**
- Modify: `packages/adventure-loader/src/index.mjs`
- Modify: `packages/adventure-loader/test/adventure-loader.test.mjs`

- [ ] **Write failing validation and fallback tests**

Add tests for:

```js
assert.throws(
  () => validateAdventureModule({
    ...structuredClone(adventure),
    locales: { pirate: { title: "Arrr" } },
  }),
  /unsupported locale/i,
);

const localized = localizeAdventureModule(adventure, "zh-CN");
assert.equal(localized.title, "山丘下的灯火");
assert.equal(localized.scenes[0].title, "村庄广场");
assert.equal(localized.rulesetId, adventure.rulesetId);
assert.equal(localized.scenes[0].id, adventure.scenes[0].id);

const fallback = localizeAdventureModule(
  {
    ...structuredClone(adventure),
    locales: { "zh-CN": { title: "山丘下的灯火" } },
  },
  "zh-CN",
);
assert.equal(fallback.synopsis, adventure.synopsis);
```

- [ ] **Implement validation**

Validate:

- locale keys are in `localizedLocaleValues`;
- localized values are strings when present;
- disallowed override keys such as `id`, `visibility`, `clueIds`,
  `encounterId`, `combatants`, `source`, and `rulesetId` produce errors.

- [ ] **Implement `localizeAdventureModule`**

Return a structured clone with localized strings overlaid. Do not mutate input.
Keep IDs, references, visibility, combatants, and source metadata unchanged.

- [ ] **Run targeted loader tests**

Run:

```bash
node scripts/run-tests.mjs packages/adventure-loader/test/adventure-loader.test.mjs
```

Expected: PASS.

- [ ] **Commit Chunk 1**

```bash
git add packages/adventure-loader/src/index.mjs \
  packages/adventure-loader/test/adventure-loader.test.mjs \
  packages/shared-test-fixtures/adventures/the-lantern-beneath-the-hill.md
git commit -m "feat: add localized adventure contract"
```

## Chunk 2: Room, HTTP, UI, And AI Context Locale Flow

### Task 5: Add failing room snapshot and HTTP tests

**Files:**
- Modify: `apps/server/test/adventure-runtime.test.mjs`
- Modify: `apps/server/test/http-server.test.mjs`

- [ ] **Write failing room service tests**

Add assertions:

```js
const hostZh = service.getAdventureSnapshot({
  roomId,
  viewerRole: "host",
  locale: "zh-CN",
});
assert.equal(hostZh.title, "山丘下的灯火");
assert.ok(hostZh.currentScene.dmNotes.text.includes("艾瑞克镇长"));

const playerZh = service.getAdventureSnapshot({
  roomId,
  viewerRole: "player",
  viewerPlayerId: adaPlayerId,
  locale: "zh-CN",
});
assert.equal(playerZh.currentScene.title, "村庄广场");
assert.equal(playerZh.currentScene.dmNotes, undefined);
assert.equal(JSON.stringify(playerZh).includes("破裂的灯镜"), false);
```

- [ ] **Write failing HTTP test**

Request:

```txt
/rooms/<roomId>/adventure-snapshot?sessionToken=<player>&lang=zh-CN
```

Assert localized public scene text appears and DM-only text does not.

- [ ] **Run server tests to verify failure**

Run:

```bash
node scripts/run-tests.mjs apps/server/test/adventure-runtime.test.mjs apps/server/test/http-server.test.mjs
```

Expected: FAIL because locale is not passed or applied.

### Task 6: Localize room adventure snapshots

**Files:**
- Modify: `apps/server/src/room-service.mjs`
- Modify: `apps/server/src/http-server.mjs`
- Modify: `apps/server/src/room-actions.mjs`

- [ ] **Pass locale through room command boundaries**

Add optional `locale` to:

- HTTP `adventure-snapshot` route from `lang` or `locale` query parameter;
- dispatcher command `adventure.snapshot`;
- room service `getAdventureSnapshot`.

- [ ] **Apply localization inside room service**

Use `localizeAdventureModule(room.adventure, input.locale)` before building Host
or player snapshot. The player snapshot must still construct only player-safe
fields.

- [ ] **Run server tests**

Run:

```bash
node scripts/run-tests.mjs apps/server/test/adventure-runtime.test.mjs apps/server/test/http-server.test.mjs
```

Expected: PASS.

### Task 7: Pass locale from browser UI and AI turn command

**Files:**
- Modify: `apps/web/src/api-client.mjs`
- Modify: `apps/web/src/host-app.mjs`
- Modify: `apps/web/src/player-app.mjs`
- Modify: `apps/server/src/room-actions.mjs`
- Modify: `apps/server/src/ai-room-runner.mjs`
- Modify: `apps/server/test/ai-room-runner.test.mjs`

- [ ] **Write failing AI context test**

Build context with:

```js
const context = buildAiContextForRoom({
  roomService,
  roomId,
  locale: "zh-CN",
});
assert.equal(context.currentScene.title, "灯塔");
assert.ok(context.currentScene.dmNotes.text.includes("活板门"));
```

- [ ] **Implement locale flow**

Add locale query support in `createTableMindApi().getAdventureSnapshot`.

Pass `appState.locale` from:

- `host-app.mjs` `syncAdventureSnapshot`;
- `host-app.mjs` `runAiTurn({ locale: appState.locale })`;
- `player-app.mjs` `syncAdventureSnapshot`;
- language switch click handlers, by re-syncing adventure snapshot after storing
  the language when room identity exists.

In `room-actions.mjs`, pass `payload.locale` to `runAiTurnForRoom`.

In `ai-room-runner.mjs`, pass `input.locale` to `roomService.getAdventureSnapshot`.

- [ ] **Run targeted tests**

Run:

```bash
node scripts/run-tests.mjs apps/server/test/ai-room-runner.test.mjs apps/web/test/browser-locale.test.mjs apps/web/test/ui-render.test.mjs
```

Expected: PASS after app/API tests are updated.

- [ ] **Commit Chunk 2**

```bash
git add apps/server/src/room-service.mjs apps/server/src/http-server.mjs \
  apps/server/src/room-actions.mjs apps/server/src/ai-room-runner.mjs \
  apps/server/test/adventure-runtime.test.mjs apps/server/test/http-server.test.mjs \
  apps/server/test/ai-room-runner.test.mjs apps/web/src/api-client.mjs \
  apps/web/src/host-app.mjs apps/web/src/player-app.mjs apps/web/test/ui-render.test.mjs
git commit -m "feat: localize adventure snapshots"
```

## Chunk 3: Recap, Spoiler Guard, And Acceptance Coverage

### Task 8: Add recap and spoiler guard tests

**Files:**
- Modify: `packages/session-recap/test/session-recap.test.mjs`
- Modify: `packages/spoiler-guard/test/spoiler-guard.test.mjs`

- [ ] **Write failing recap tests**

Use `localizeAdventureModule(adventure, "zh-CN")` before recap generation and
assert:

```js
assert.ok(playerRecap.discoveredClues.includes("破裂的灯镜"));
assert.equal(playerRecap.markdown.includes("破损封印"), false);
assert.ok(hostRecap.unresolvedThreads.some((item) => item.includes("破损封印")));
```

- [ ] **Write failing spoiler tests**

Assert public output mentioning localized unrevealed clue title or alias is
blocked:

```js
const result = checkSpoilerSafety({
  publicMessage: "你们看见塔下活板门。",
  unrevealedClues: [localizedHiddenClue],
  dmOnlySecrets: [localizedSecret],
  hiddenEntities: [],
  viewerRole: "player",
});
assert.equal(result.allowed, false);
```

### Task 9: Implement recap and spoiler support

**Files:**
- Modify: `packages/session-recap/src/index.mjs`
- Modify: `packages/spoiler-guard/src/index.mjs`

- [ ] **Recap implementation**

Prefer localized adventure data passed to `generateSessionRecap`. Do not
translate event IDs or deterministic rule text. Keep player event filtering
unchanged.

- [ ] **Spoiler implementation**

Ensure localized aliases/titles/text already present on localized adventure
entities are included in deterministic matching. If canonical entities still
carry `locales`, flatten the selected localized terms into the existing matching
input before checking.

- [ ] **Run package tests**

Run:

```bash
node scripts/run-tests.mjs packages/session-recap/test/session-recap.test.mjs packages/spoiler-guard/test/spoiler-guard.test.mjs
```

Expected: PASS.

### Task 10: Add browser-like Chinese authored content acceptance

**Files:**
- Modify: `tests/acceptance/demo-browser-setup.acceptance.test.mjs`
- Modify: `tests/acceptance/mvp-ui-playtest.acceptance.test.mjs`

- [ ] **Add acceptance assertions**

Assert:

- Host `zh-CN` snapshot includes localized current scene and localized DM notes.
- Player `zh-CN` snapshot includes localized public scene text.
- Player rendered HTML includes localized authored public text.
- Player rendered HTML excludes localized secret names, localized hidden clue
  text, `host.review`, and `state.patch`.

- [ ] **Run acceptance targets**

Run:

```bash
node scripts/run-tests.mjs tests/acceptance/demo-browser-setup.acceptance.test.mjs tests/acceptance/mvp-ui-playtest.acceptance.test.mjs
```

Expected: PASS.

- [ ] **Commit Chunk 3**

```bash
git add packages/session-recap/src/index.mjs packages/session-recap/test/session-recap.test.mjs \
  packages/spoiler-guard/src/index.mjs packages/spoiler-guard/test/spoiler-guard.test.mjs \
  tests/acceptance/demo-browser-setup.acceptance.test.mjs \
  tests/acceptance/mvp-ui-playtest.acceptance.test.mjs
git commit -m "feat: protect localized adventure text"
```

## Chunk 4: Documentation And Final Verification

### Task 11: Update status docs

**Files:**
- Modify: `README.md`
- Modify: `docs/CURRENT_STATUS.md`
- Modify: `docs/codex/demo-goal-pack/DEMO_SCOPE_GAP_ANALYSIS.md`

- [ ] **Update README**

State that the built-in Lantern demo includes English and Simplified Chinese
authored adventure text, with canonical fallback for missing localized fields.

- [ ] **Update CURRENT_STATUS**

Record true support:

- fixed UI labels are bilingual;
- Lantern authored adventure content has explicit `zh-CN` fields;
- missing localized authored fields preserve canonical text;
- production localization tooling remains deferred.

- [ ] **Update demo gap analysis**

Add evidence files and note that authored gameplay localization is now covered
for the built-in demo.

### Task 12: Run full verification and self-review

**Files:**
- Inspect all changed files.

- [ ] **Run npm commands and record environment behavior**

Run:

```bash
npm run check
npm test
npm run acceptance
npm run build
```

Expected in this shell: `npm` may be unavailable. If unavailable, record the
exact failure and use direct Node equivalents.

- [ ] **Run direct Node verification**

Run:

```bash
node scripts/check-js.mjs
node scripts/run-tests.mjs packages apps tests
node scripts/run-tests.mjs tests/acceptance
TABLEMIND_AI_PROVIDER_ENABLED=false node scripts/smoke-playtest-flow.mjs
```

Expected: all pass with provider disabled.

- [ ] **Self-review**

Run:

```bash
git diff --check
git diff --stat HEAD~3..HEAD
rg -n "dm_only|host.review|state.patch|破损封印|塔下活板门" apps packages tests docs
```

Inspect that localized hidden terms appear only in fixture, Host-safe tests,
spoiler tests, and Host-safe docs; player assertions must show absence where
needed.

- [ ] **Commit documentation**

```bash
git add README.md docs/CURRENT_STATUS.md docs/codex/demo-goal-pack/DEMO_SCOPE_GAP_ANALYSIS.md
git commit -m "docs: update chinese adventure status"
```

## Completion Report

Final report must include:

- implemented scope;
- phase commits;
- changed files;
- tests added or updated;
- commands run;
- acceptance criteria satisfied;
- self-review findings;
- deferred work;
- known risks;
- recommended next task.
