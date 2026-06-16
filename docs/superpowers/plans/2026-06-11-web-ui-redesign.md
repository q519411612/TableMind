# Web UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the existing zero-dependency Web UI into a flow-oriented local demo workspace for Host and player views while preserving role-aware data boundaries.

**Architecture:** Keep the current static HTML, CSS, and browser ES module app. Add small first-party render helpers for shared shell, flow state, layout, and UI summaries, then migrate Host and player screens one workflow slice at a time. Tests should focus on visible copy, stable `data-*` hooks, role-safe rendered content, and no-leak guarantees rather than brittle visual class assertions.

**Tech Stack:** Node 20+, ESM `.mjs`, built-in `node:test`, `node:assert/strict`, static HTML/CSS, existing TableMind HTTP/SSE API clients, existing Host/player render modules.

---

## Source Documents

- `docs/superpowers/specs/2026-06-11-web-ui-redesign-design.md`
- `README.md`
- `docs/PRD.md`
- `docs/CURRENT_STATUS.md`
- `docs/DEVELOPMENT.md`
- `specs/000-constitution.md`
- `specs/000-prd-analysis.md`
- `specs/017-mvp-09-playtest-ui/design.md`
- `specs/GOAL_ACCEPTANCE_GATES.md`

## File Structure

- Modify: `apps/web/public/index.html`
  - Turn the current entry page into the local demo launchpad.
  - Preserve `data-language-switcher`, `data-i18n`, and locale-aware links.
- Modify: `apps/web/public/styles.css`
  - Add layout primitives for launchpad, Host workspace, player room, progress rail, monitor rail, split panes, status badges, and responsive behavior.
  - Keep existing classes working while new render helpers migrate page by page.
- Modify: `apps/web/src/index-app.mjs`
  - Preserve current language switching.
  - Add local demo status and remembered-session rendering only if it can be derived from public config or localStorage.
- Modify: `apps/web/src/i18n.mjs`
  - Add fixed labels for launchpad, workspace headings, progress states, connection status, role labels, action hints, review urgency, combat turn hints, and recap sections.
  - Keep `SUPPORTED_LOCALES` parity tests green for `en` and `zh-CN`.
- Create: `apps/web/src/render-shell.mjs`
  - Own shared shell helpers: topbar, status strip, phase badge, next-step notice wrapper, progress rail, monitor rail, and layout wrappers.
  - Must not own transport, game rules, event reduction, or role projection.
- Create: `apps/web/src/render-flow-state.mjs`
  - Derive UI-only phase summaries from already-projected snapshots.
  - Return labels and state flags for UI display without mutating state.
- Modify: `apps/web/src/render-utils.mjs`
  - Keep existing HTML escaping, feed, dice, combat, empty, error, notice, and markdown helpers.
  - Add only generic helpers that are role-neutral and do not require Host-only payloads.
- Modify: `apps/web/src/render-host.mjs`
  - Migrate Host view to flow workspace layout.
  - Keep Host-only scene truth, DM notes, review payloads, and override controls inside Host render path.
- Modify: `apps/web/src/render-player.mjs`
  - Migrate player view to join/create, exploration, combat, and recap room states.
  - Use only player snapshot, player adventure snapshot, player command responses, and player recap.
- Modify: `apps/web/src/host-app.mjs`
  - Keep command behavior stable.
  - Add UI state only for display status if needed.
  - Preserve existing Host command dispatch and review commit behavior.
- Modify: `apps/web/src/player-app.mjs`
  - Keep command behavior stable.
  - Preserve join, character creation, message, attack, refresh, stream, locale, and recap behavior.
- Modify: `apps/web/test/ui-render.test.mjs`
  - Add render coverage for launchpad hooks, Host setup/play/review/combat/recap states, player join/create/exploration/combat/recap states, bilingual labels, and no-leak boundaries.
- Modify: `tests/acceptance/mvp-ui-playtest.acceptance.test.mjs`
  - Extend acceptance assertions to cover the new stable `data-*` UI hooks and role-specific workflow states.
- Modify when needed: `tests/acceptance/demo-browser-setup.acceptance.test.mjs`
  - Keep browser entry and language behavior aligned with launchpad changes.
- Modify if needed: `apps/web/README.md`
  - Document the redesigned local demo entry and Host/player UI responsibilities.

## Boundaries

- Do not add a frontend framework.
- Do not add production dependencies.
- Do not move game rules, event reduction, visibility filtering, spoiler checks, AI orchestration, or Host authority into UI code.
- Do not introduce full VTT map, token movement, fog of war, dynamic lighting, 3D scenes, production auth, durable persistence, marketplace, provider configuration UI, or full character builder.
- Do not render Host snapshot data from player views.
- Do not expose DM-only content, rejected AI output, private review payloads, raw state patches, provider credentials, authorization headers, or session tokens in player-facing UI.

## Chunk 1: Shared Shell And Launchpad

### Task 1: Add failing render tests for shared launchpad and shell expectations

**Files:**
- Modify: `apps/web/test/ui-render.test.mjs`
- Read: `apps/web/public/index.html`
- Read: `apps/web/src/index-app.mjs`
- Read: `apps/web/src/i18n.mjs`

- [ ] Add tests that assert the static index entry exposes a launchpad structure with Host and Player actions, a language switcher hook, and locale-aware links.
- [ ] Add tests that assert new fixed label keys exist in both `en` and `zh-CN`.
- [ ] Add tests that assert shell-oriented render output includes stable hooks for viewer role, current phase, notices, and refresh or connection state.
- [ ] Run: `node scripts/run-tests.mjs apps/web/test/ui-render.test.mjs`
- [ ] Expected: FAIL because shell helpers and new labels do not exist yet.

### Task 2: Add shared shell and flow state helpers

**Files:**
- Create: `apps/web/src/render-shell.mjs`
- Create: `apps/web/src/render-flow-state.mjs`
- Modify: `apps/web/src/render-utils.mjs` only if a role-neutral helper is needed.

- [ ] Implement shared shell render helpers for topbar, status strip, phase badge, progress rail, monitor rail, and layout wrappers.
- [ ] Implement UI-only flow state derivation from already-projected snapshots.
- [ ] Ensure helpers only accept already-projected data and do not fetch, mutate, or infer hidden truth.
- [ ] Keep comments minimal and in Chinese only when needed to explain non-obvious UI-state derivation.
- [ ] Run: `node scripts/run-tests.mjs apps/web/test/ui-render.test.mjs`
- [ ] Expected: still FAIL until index and renderers consume the helpers.

### Task 3: Redesign the local demo launchpad

**Files:**
- Modify: `apps/web/public/index.html`
- Modify: `apps/web/src/index-app.mjs`
- Modify: `apps/web/src/i18n.mjs`
- Modify: `apps/web/public/styles.css`

- [ ] Update index markup into a local demo launchpad with Host entry, Player entry, language switcher, and demo status area.
- [ ] Preserve `data-language-switcher`, `data-i18n`, and `data-locale-link`.
- [ ] Add labels for launchpad headings, Host action, Player action, room link hint, local demo status, and recent-session text.
- [ ] Add launchpad CSS using existing visual language and 6-8px card radius.
- [ ] Run: `node scripts/run-tests.mjs apps/web/test/ui-render.test.mjs apps/web/test/browser-locale.test.mjs`
- [ ] Expected: PASS for launchpad and locale behavior.

### Task 4: Commit shared shell and launchpad slice

**Files:**
- Stage only files touched in Chunk 1.

- [ ] Run: `node scripts/check-js.mjs`
- [ ] Run: `node scripts/run-tests.mjs apps/web/test/ui-render.test.mjs apps/web/test/browser-locale.test.mjs`
- [ ] Inspect: `git diff --cached --check`
- [ ] Commit with a concise message that does not mention AI tool names and does not use forbidden progress terms.

## Chunk 2: Host Setup And Play Workspace

### Task 5: Add failing tests for Host setup and play workspace layout

**Files:**
- Modify: `apps/web/test/ui-render.test.mjs`
- Read: `apps/web/src/render-host.mjs`
- Read: `apps/web/src/render-shell.mjs`

- [ ] Add tests for no-room Host setup state.
- [ ] Add tests for room-created state with invite link, player readiness, adventure load, and start session actions.
- [ ] Add tests for playing state with public scene, Host-only DM notes, truth area, clue controls, AI controls, and monitor rail.
- [ ] Assert Host output includes stable hooks for progress rail, current workspace, monitor rail, and Host-only blocks.
- [ ] Assert Host output still includes known Host-only fixture secret while player render tests continue to exclude it.
- [ ] Run: `node scripts/run-tests.mjs apps/web/test/ui-render.test.mjs`
- [ ] Expected: FAIL because Host renderer still uses the old flat panel layout.

### Task 6: Migrate Host room setup into the workspace layout

**Files:**
- Modify: `apps/web/src/render-host.mjs`
- Modify: `apps/web/src/render-shell.mjs`
- Modify: `apps/web/src/render-flow-state.mjs`
- Modify: `apps/web/src/i18n.mjs`
- Modify: `apps/web/public/styles.css`

- [ ] Replace the flat Host setup composition with shell, progress rail, setup workspace, and monitor rail sections.
- [ ] Keep existing form actions and command `data-*` attributes stable for create room, copy invite, refresh, adventure load, and session start.
- [ ] Render player readiness with display names and character names before raw IDs.
- [ ] Keep Host session token out of all rendered HTML.
- [ ] Run: `node scripts/run-tests.mjs apps/web/test/ui-render.test.mjs`
- [ ] Expected: Host setup tests PASS or reveal missing labels.

### Task 7: Migrate Host play workspace

**Files:**
- Modify: `apps/web/src/render-host.mjs`
- Modify: `apps/web/src/render-shell.mjs`
- Modify: `apps/web/src/render-flow-state.mjs`
- Modify: `apps/web/src/i18n.mjs`
- Modify: `apps/web/public/styles.css`

- [ ] Move current scene, public read-aloud text, DM notes, truth summaries, reveal controls, scene change, run AI, and pause/resume controls into the current workspace.
- [ ] Keep audit feed, dice log, player list, and AI status in monitor or secondary areas without hiding important actions.
- [ ] Add labels for Host-only notes, truth, current task, room readiness, and AI state.
- [ ] Preserve all existing Host command dispatch attributes consumed by `host-app.mjs`.
- [ ] Run: `node scripts/run-tests.mjs apps/web/test/ui-render.test.mjs`
- [ ] Expected: PASS for Host setup/play render states.

### Task 8: Commit Host setup/play slice

**Files:**
- Stage only files touched in Chunk 2.

- [ ] Run: `node scripts/check-js.mjs`
- [ ] Run: `node scripts/run-tests.mjs apps/web/test/ui-render.test.mjs`
- [ ] Inspect: `git diff --cached --check`
- [ ] Commit with a concise message that avoids forbidden progress terms and AI tool names.

## Chunk 3: Player Join/Create And Exploration Room

### Task 9: Add failing tests for player join/create and exploration layout

**Files:**
- Modify: `apps/web/test/ui-render.test.mjs`
- Read: `apps/web/src/render-player.mjs`
- Read: `apps/web/src/render-shell.mjs`

- [ ] Add tests for missing room ID, ready-to-join, joined-without-character, character-created, waiting-for-Host, and exploration-active states.
- [ ] Assert player output includes stable hooks for scene/action main area and character/status side area.
- [ ] Assert player action composer appears before long feed/log areas.
- [ ] Assert player output excludes known fixture secret, Host review strings, raw state patch strings, hidden IDs, and Host-only notes.
- [ ] Run: `node scripts/run-tests.mjs apps/web/test/ui-render.test.mjs`
- [ ] Expected: FAIL because player renderer still uses the old flat panel layout.

### Task 10: Migrate player join/create states

**Files:**
- Modify: `apps/web/src/render-player.mjs`
- Modify: `apps/web/src/render-shell.mjs`
- Modify: `apps/web/src/render-flow-state.mjs`
- Modify: `apps/web/src/i18n.mjs`
- Modify: `apps/web/public/styles.css`

- [ ] Render the pre-join state as a focused join panel with room ID, display name, language, and error/notice areas.
- [ ] Render joined-without-character state with a prominent demo character action.
- [ ] Keep existing `data-action="join-room"` and `data-action="create-character"` contracts stable.
- [ ] Preserve player session token storage behavior in `player-app.mjs`; do not render tokens.
- [ ] Run: `node scripts/run-tests.mjs apps/web/test/ui-render.test.mjs`
- [ ] Expected: join/create tests PASS or reveal missing labels.

### Task 11: Migrate player exploration room

**Files:**
- Modify: `apps/web/src/render-player.mjs`
- Modify: `apps/web/src/render-shell.mjs`
- Modify: `apps/web/src/render-flow-state.mjs`
- Modify: `apps/web/src/i18n.mjs`
- Modify: `apps/web/public/styles.css`

- [ ] Render current scene, public text, revealed clues, next action hint, and message composer in the main column.
- [ ] Render character summary, party/status summary, dice summary, and compact public feed in the side or secondary area.
- [ ] Keep existing `data-action="send-message"` contract stable.
- [ ] Use only `snapshot`, `adventureSnapshot`, `playerId`, `roomId`, `recap`, and player-visible app state.
- [ ] Run: `node scripts/run-tests.mjs apps/web/test/ui-render.test.mjs`
- [ ] Expected: PASS for player join/create/exploration states and no-leak assertions.

### Task 12: Commit player join/exploration slice

**Files:**
- Stage only files touched in Chunk 3.

- [ ] Run: `node scripts/check-js.mjs`
- [ ] Run: `node scripts/run-tests.mjs apps/web/test/ui-render.test.mjs apps/web/test/browser-locale.test.mjs`
- [ ] Inspect: `git diff --cached --check`
- [ ] Commit with a concise message that avoids forbidden progress terms and AI tool names.

## Chunk 4: Review Workspace

### Task 13: Add failing tests for Host review workspace

**Files:**
- Modify: `apps/web/test/ui-render.test.mjs`
- Read: `apps/web/src/render-host.mjs`
- Read: `apps/web/src/host-review-form.mjs`
- Read: `apps/web/src/host-review-commit.mjs`

- [ ] Add tests for no pending review, single pending review, multiple pending reviews, review payload summary, edit form, approve/reject controls, and review command failure notice area.
- [ ] Assert pending review appears in the current workspace when present.
- [ ] Assert rejected/completed review items do not render in the pending queue.
- [ ] Assert player renderer does not contain review workspace hooks, review payloads, or review command text.
- [ ] Run: `node scripts/run-tests.mjs apps/web/test/ui-render.test.mjs`
- [ ] Expected: FAIL until review workspace is reorganized.

### Task 14: Migrate Host review UI into a priority workspace

**Files:**
- Modify: `apps/web/src/render-host.mjs`
- Modify: `apps/web/src/render-shell.mjs`
- Modify: `apps/web/src/render-flow-state.mjs`
- Modify: `apps/web/src/i18n.mjs`
- Modify: `apps/web/public/styles.css`

- [ ] Route pending review state to the Host current workspace.
- [ ] Keep review type, risk, reason, public message, reveal proposal, state patch proposal, commit scope, approve, edit, and reject content visible to Host.
- [ ] Preserve existing `host.review.update` command `data-*` attributes and edit form names.
- [ ] Add visual urgency using labels and CSS only; do not add modal behavior.
- [ ] Run: `node scripts/run-tests.mjs apps/web/test/ui-render.test.mjs`
- [ ] Expected: PASS for review render tests and existing review parser/commit helper tests.

### Task 15: Commit review workspace slice

**Files:**
- Stage only files touched in Chunk 4.

- [ ] Run: `node scripts/check-js.mjs`
- [ ] Run: `node scripts/run-tests.mjs apps/web/test/ui-render.test.mjs`
- [ ] Inspect: `git diff --cached --check`
- [ ] Commit with a concise message that avoids forbidden progress terms and AI tool names.

## Chunk 5: Combat Workspaces

### Task 16: Add failing tests for Host and player combat workspaces

**Files:**
- Modify: `apps/web/test/ui-render.test.mjs`
- Modify if needed: `tests/acceptance/mvp-ui-playtest.acceptance.test.mjs`
- Read: `apps/web/src/render-utils.mjs`
- Read: `apps/web/src/render-host.mjs`
- Read: `apps/web/src/render-player.mjs`

- [ ] Add tests for Host no-combat, start encounter, active combat, active combatant, turn order, HP patch, condition patch, advance turn, and end combat controls.
- [ ] Add tests for player active combat when it is their turn, when it is not their turn, no valid target, and resolved attack results.
- [ ] Assert player combat actions are absent when combat is inactive or when no player combatant can act.
- [ ] Assert rendered combat output does not require Host-only encounter data in player views.
- [ ] Run: `node scripts/run-tests.mjs apps/web/test/ui-render.test.mjs`
- [ ] Expected: FAIL until combat workspaces are reorganized.

### Task 17: Migrate Host combat workspace

**Files:**
- Modify: `apps/web/src/render-host.mjs`
- Modify: `apps/web/src/render-utils.mjs` only for role-neutral combat display helpers.
- Modify: `apps/web/src/render-shell.mjs`
- Modify: `apps/web/src/render-flow-state.mjs`
- Modify: `apps/web/src/i18n.mjs`
- Modify: `apps/web/public/styles.css`

- [ ] Render combat round, active combatant, turn order, combatant rows, recent attack/damage result, and Host controls in the Host current workspace when combat is active.
- [ ] Keep `combat.start`, `combat.advance_turn`, `combat.patch_hp`, `combat.patch_condition`, and `combat.end` contracts stable.
- [ ] Display HP/condition forms close to combatant rows while preserving stable form field names consumed by `host-app.mjs`.
- [ ] Do not compute authoritative combat outcomes in UI code.
- [ ] Run: `node scripts/run-tests.mjs apps/web/test/ui-render.test.mjs`
- [ ] Expected: Host combat tests PASS or reveal missing labels.

### Task 18: Migrate player combat workspace

**Files:**
- Modify: `apps/web/src/render-player.mjs`
- Modify: `apps/web/src/render-utils.mjs` only for role-neutral combat display helpers.
- Modify: `apps/web/src/render-shell.mjs`
- Modify: `apps/web/src/render-flow-state.mjs`
- Modify: `apps/web/src/i18n.mjs`
- Modify: `apps/web/public/styles.css`

- [ ] Render current round, active combatant, player turn status, target selection, attack action, visible combatants, turn order, dice log, and public combat feed.
- [ ] Keep `data-action="combat-attack"` and hidden field names stable.
- [ ] Ensure attack controls render only for the active player combatant with a valid attack and valid target.
- [ ] Do not calculate hit, damage, HP, or turn outcomes in UI code.
- [ ] Run: `node scripts/run-tests.mjs apps/web/test/ui-render.test.mjs`
- [ ] Expected: PASS for Host and player combat render tests.

### Task 19: Commit combat workspace slice

**Files:**
- Stage only files touched in Chunk 5.

- [ ] Run: `node scripts/check-js.mjs`
- [ ] Run: `node scripts/run-tests.mjs apps/web/test/ui-render.test.mjs`
- [ ] Inspect: `git diff --cached --check`
- [ ] Commit with a concise message that avoids forbidden progress terms and AI tool names.

## Chunk 6: Recap Views And Acceptance Coverage

### Task 20: Add failing tests for role-specific recap views

**Files:**
- Modify: `apps/web/test/ui-render.test.mjs`
- Modify: `tests/acceptance/mvp-ui-playtest.acceptance.test.mjs`

- [ ] Add tests for Host ended state with player-safe recap preview and Host-only management context.
- [ ] Add tests for player ended state with only player-safe recap content.
- [ ] Assert player recap excludes known DM-only text, rejected AI output, private review payloads, raw state patches, and hidden unrevealed content.
- [ ] Add acceptance assertions that the completed demo renders new recap hooks for Host and player.
- [ ] Run: `node scripts/run-tests.mjs apps/web/test/ui-render.test.mjs tests/acceptance/mvp-ui-playtest.acceptance.test.mjs`
- [ ] Expected: FAIL until recap views are reorganized.

### Task 21: Migrate Host and player recap views

**Files:**
- Modify: `apps/web/src/render-host.mjs`
- Modify: `apps/web/src/render-player.mjs`
- Modify: `apps/web/src/render-shell.mjs`
- Modify: `apps/web/src/i18n.mjs`
- Modify: `apps/web/public/styles.css`

- [ ] Render Host recap with completion status, player-safe preview, Host-only management summary area, review decisions, and combat/check highlights when data is available.
- [ ] Render player recap as a clean ended-state summary using only player recap data.
- [ ] Preserve existing recap fetch behavior in `host-app.mjs` and `player-app.mjs`.
- [ ] Keep `renderMarkdown` escaping behavior for recap markdown.
- [ ] Run: `node scripts/run-tests.mjs apps/web/test/ui-render.test.mjs tests/acceptance/mvp-ui-playtest.acceptance.test.mjs`
- [ ] Expected: PASS for recap render and UI playtest acceptance assertions.

### Task 22: Commit recap and acceptance slice

**Files:**
- Stage only files touched in Chunk 6.

- [ ] Run: `node scripts/check-js.mjs`
- [ ] Run: `node scripts/run-tests.mjs apps/web/test/ui-render.test.mjs tests/acceptance/mvp-ui-playtest.acceptance.test.mjs`
- [ ] Inspect: `git diff --cached --check`
- [ ] Commit with a concise message that avoids forbidden progress terms and AI tool names.

## Chunk 7: Responsive Polish And Full Verification

### Task 23: Add responsive and bilingual regression checks

**Files:**
- Modify: `apps/web/test/ui-render.test.mjs`
- Modify: `tests/acceptance/demo-browser-setup.acceptance.test.mjs` if entry behavior changes.
- Modify: `apps/web/README.md` if the UI entry description needs updating.

- [ ] Add tests that assert all new label keys exist for `en` and `zh-CN`.
- [ ] Add tests that assert long invite links, room IDs, review reasons, and recap content render inside wrapping containers or stable hooks.
- [ ] Add tests that assert player primary action hooks appear before feed/log hooks in rendered order.
- [ ] Add tests that assert player render output contains no `host.review`, `state.patch`, known fixture secrets, or Host-only block hooks.
- [ ] Run: `node scripts/run-tests.mjs apps/web/test/ui-render.test.mjs tests/acceptance/demo-browser-setup.acceptance.test.mjs`
- [ ] Expected: PASS after final CSS and render hook adjustments.

### Task 24: Final CSS pass

**Files:**
- Modify: `apps/web/public/styles.css`

- [ ] Review CSS colors to avoid a one-hue palette and avoid disallowed decorative backgrounds.
- [ ] Ensure desktop Host has progress rail, current workspace, and monitor rail.
- [ ] Ensure desktop player has main scene/action and side status columns.
- [ ] Ensure tablet and mobile collapse order follows: current state, primary action, character/combat status, feed/logs, secondary controls.
- [ ] Ensure buttons and inputs can wrap bilingual text without overlap.
- [ ] Run: `node scripts/check-js.mjs`
- [ ] Expected: PASS.

### Task 25: Run full project verification

**Files:**
- No file edits unless verification reveals a defect.

- [ ] Run: `npm run check`
- [ ] Run: `npm test`
- [ ] Run: `npm run acceptance`
- [ ] Run: `npm run build`
- [ ] Run: `TABLEMIND_AI_PROVIDER_ENABLED=false npm run smoke:playtest`
- [ ] If npm or Node 20+ is unavailable, record the exact command, observed `node --version`, observed `npm --version` if available, and the reason.

### Task 26: Final review and commit

**Files:**
- Stage only final files touched by Chunk 7.

- [ ] Re-read `docs/superpowers/specs/2026-06-11-web-ui-redesign-design.md`.
- [ ] Confirm each acceptance criterion is satisfied or explicitly deferred.
- [ ] Run: `git diff --check`
- [ ] Run: `git status --short`
- [ ] Perform `/review` equivalent with a code-review stance: findings first, then test gaps and risks.
- [ ] Commit any final polish with a concise message that avoids forbidden progress terms and AI tool names.

## Completion Report Requirements

The final implementation response must include:

```txt
Scope implemented:
Files changed:
Tests added/updated:
Commands run:
Acceptance criteria satisfied:
Deferred work:
Known risks:
```

It must also note:

- whether the full required commands ran;
- exact environment blockers if any command could not run;
- that player views use only player-projected data;
- that no Host-only review payload, DM-only secret, rejected AI output, raw state patch, provider credential, authorization header, or session token is rendered to player UI.
