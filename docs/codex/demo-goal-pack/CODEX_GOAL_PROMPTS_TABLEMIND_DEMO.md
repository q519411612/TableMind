# Codex `/goal` Prompts for TableMind Demo

下面的 prompt 可直接复制给 Codex。推荐先用“规划型”，再用分阶段实现。不要默认让 Codex 一口气重写项目。

---

## 0. 规划型 `/goal`：只研究，不改代码

```txt
/goal You are working on TableMind, an AI-assisted tabletop session engine for 5e-compatible one-shot play.

Planning only. Do not edit code yet.

Read and obey:
- README.md
- AGENTS.md
- docs/PRD.md
- docs/CURRENT_STATUS.md
- docs/DEVELOPMENT.md
- docs/open-source-integration-strategy.md
- specs/README.md
- specs/000-constitution.md
- specs/000-prd-analysis.md
- specs/GOAL_ACCEPTANCE_GATES.md
- docs/roadmaps/MVP_0_7_to_1_0.md
- docs/codex/GOAL_RUNBOOK_MVP_1_0.md
- docs/codex/demo-goal-pack/TABLEMIND_DEMO_GOAL_RUNBOOK.md
- docs/codex/demo-goal-pack/DEMO_SCOPE_GAP_ANALYSIS.md

Then inspect:
- apps/server/src
- apps/web/src
- apps/web/public
- packages/rules-engine
- packages/session-recap
- packages/adventure-loader
- packages/shared-test-fixtures
- tests/acceptance
- scripts/smoke-playtest-flow.mjs

Produce a concrete implementation plan to bring the current project to demo-level playability, covering UI, combat, Host controls, player full flow, AI/Host review, no-DM-leak safety, and English/Chinese bilingual support.

Output must include:
1. Current capability matrix: already implemented vs missing/hardening needed.
2. Proposed milestones in priority order.
3. Files likely to change.
4. Tests to add/update.
5. Risks and explicit non-goals.
6. A recommended next /goal prompt for the first implementation slice.

Do not write production code in this planning goal.
```

---

## 1. Demo P0/P1：阻塞修复 + Host/Player 主流程

```txt
/goal TableMind Demo P0/P1: harden the existing static Host/Player browser flow so a non-developer can complete the demo setup path.

Read and obey AGENTS.md and docs/codex/demo-goal-pack/*.md, plus docs/PRD.md, docs/CURRENT_STATUS.md, docs/DEVELOPMENT.md, specs/GOAL_ACCEPTANCE_GATES.md, and docs/codex/GOAL_RUNBOOK_MVP_1_0.md.

Scope:
- Fix obvious UI/i18n blocking bugs such as missing labels, undefined button text, stale state after commands, and unfriendly command errors.
- Improve Host flow: create room, load demo adventure, show/copy invite link, show player/character readiness, start session, and show next-step hints.
- Improve Player flow: invite URL pre-fills roomId, join with display name, create/select demo-ready character, view scene/feed/dice/character/combat/recap, and show next-step hints.
- Add friendly command/API error display in Host and Player UI.
- Preserve zero-dependency static web approach unless a tiny first-party helper is enough.

Non-goals:
- no production auth/db/deployment
- no full VTT
- no PDF import
- no live provider calls in default tests
- no architecture rewrite

Tests:
- update apps/web render/unit tests
- add or update an acceptance/smoke path for Host + 2 players through setup/start
- assert player UI does not render Host-only/DM-only content
- assert en and zh-CN labels do not render undefined for touched UI

Run if possible:
- npm run check
- npm test
- npm run acceptance
- npm run build

Final report must include Scope implemented, Files changed, Tests added/updated, Commands run, Acceptance criteria satisfied, Deferred work, Known risks, Recommended next task.
```

---

## 2. Demo P2：战斗 UI 打磨

```txt
/goal TableMind Demo P2: make the existing combat flow playable through the Host and Player UI without raw internal ID typing for normal demo operations.

Read AGENTS.md, docs/codex/demo-goal-pack/*.md, specs/GOAL_ACCEPTANCE_GATES.md, and inspect apps/server/src/room-actions.mjs, room-service.mjs, packages/rules-engine, apps/web/src/render-utils.mjs, render-player.mjs, render-host.mjs, player-app.mjs, host-app.mjs, and combat tests.

Scope:
- Show round, active combatant, initiative/turn order, HP/AC/status in readable labels.
- Player attack form must derive valid owned attacker, attacks, and targets from projected combat state.
- Replace raw targetCombatantId input with a select/dropdown or buttons.
- Host HP/condition patch controls should derive combatant choices from Host snapshot.
- Show hit/miss/damage/check outcomes in feed/dice/combat panels.
- Preserve deterministic rules engine for attack/damage/initiative/HP.
- Keep player combat projection safe; do not expose hidden encounter internals beyond what is already visible in player-safe combat state.

Tests:
- player renderer exposes attack/target controls without DM-only text
- Host renderer exposes combatant selection for patch controls
- combat.attack still emits deterministic attack.resolved and damage.applied events
- player snapshots/UI remain no-DM-leak

Run npm run check, npm test, npm run acceptance, npm run build if possible.
```

---

## 3. Demo P3：Host review / AI safety 打磨

```txt
/goal TableMind Demo P3: make Host review genuinely usable in the browser UI while preserving AI safety boundaries.

Read AGENTS.md, docs/codex/demo-goal-pack/*.md, specs/GOAL_ACCEPTANCE_GATES.md, apps/server/src/ai-room-runner.mjs, room-actions.mjs, room-service.mjs, provider-ai-adapter.mjs, apps/web/src/render-host.mjs, host-app.mjs, and existing AI/review/no-leak tests.

Scope:
- Review queue displays type, risk level, reason, proposed public message/reveal/state patch summary.
- Host can approve, reject, and edit review items through existing command boundaries.
- Edit must submit the edited publicMessage/proposedPayload and refresh UI state.
- AI pause/resume state is obvious.
- Rejected or private review payloads never reach player feed, player SSE, player UI, or player recap.
- Do not allow AI direct state mutation.

Tests:
- approved output can be committed/broadcast safely
- edited output is what players see
- rejected output remains Host-only
- low-confidence/spoiler/reveal/state-patch paths require review
- provider-disabled default tests pass without network calls

Run npm run check, npm test, npm run acceptance, npm run build if possible.
```

---

## 4. Demo P4：中英双语完整演示体验

```txt
/goal TableMind Demo P4: complete English and Simplified Chinese support for fixed demo UI and system-generated demo text without weakening no-DM-leak safety.

Read AGENTS.md, docs/codex/demo-goal-pack/*.md, apps/web/src/i18n.mjs, browser-locale.mjs, render-host.mjs, render-player.mjs, render-utils.mjs, session-recap package, AI context/runner code, and shared demo adventure fixtures.

Scope:
- Add translations for all touched fixed UI labels, buttons, errors, empty states, next-step hints, combat headings, review headings, recap headings.
- Preserve `?lang=` and localStorage behavior.
- Ensure no UI renders undefined labels in en or zh-CN.
- Add locale strategy for mock AI/system output and session recap labels.
- If adding localized adventure fields, use explicit structured fields and fallback to original authored text. Do not hard-translate user-authored content without explicit fields.
- Run no-DM-leak checks under both locales where practical.

Tests:
- English render tests
- zh-CN render tests
- localized flow or smoke for key path
- player UI/recap no-DM-leak in both locales

Run npm run check, npm test, npm run acceptance, npm run build if possible.
```

---

## 5. Demo P5：最终验收、文档和状态同步

```txt
/goal TableMind Demo P5: finalize demo acceptance docs, playtest runbook/report template, README usage, and honest current status after implemented demo functionality.

Read AGENTS.md, docs/codex/demo-goal-pack/DEMO_ACCEPTANCE_CHECKLIST.md, docs/CURRENT_STATUS.md, README.md, docs/DEVELOPMENT.md, docs/playtests/*, and the implemented code.

Scope:
- Update README with Node 20+, test commands, playtest server start, Host/Player UI URLs, mock-provider default, and known limitations.
- Add/update docs/playtests demo runbook and report template for Host + 2 players.
- Update docs/CURRENT_STATUS.md to reflect only what is actually implemented.
- Do not claim production readiness, public launch readiness, unsupervised rooms, permanent provider integration, durable persistence, or PDF import.
- Ensure docs contain no secrets, real tokens, authorization headers, or real provider payloads.

Tests:
- run docs-adjacent checks if present
- run npm run check, npm test, npm run acceptance, npm run build if possible
- run TABLEMIND_AI_PROVIDER_ENABLED=false npm run smoke:playtest if available
```

---

## 6. 一次性长程 `/goal`：只在你愿意接受较大改动时使用

```txt
/goal You are working on TableMind. Bring the current project to a demo-level playable version for a Host and 2 players.

First read and obey:
- AGENTS.md
- README.md
- docs/PRD.md
- docs/CURRENT_STATUS.md
- docs/DEVELOPMENT.md
- specs/GOAL_ACCEPTANCE_GATES.md
- docs/codex/GOAL_RUNBOOK_MVP_1_0.md
- docs/codex/demo-goal-pack/README.md
- docs/codex/demo-goal-pack/DEMO_SCOPE_GAP_ANALYSIS.md
- docs/codex/demo-goal-pack/TABLEMIND_DEMO_GOAL_RUNBOOK.md
- docs/codex/demo-goal-pack/DEMO_ACCEPTANCE_CHECKLIST.md

Non-negotiable invariants:
- LLM is not source of truth.
- Dice/checks/combat/HP are deterministic system operations.
- AI cannot directly mutate state.
- Risky AI output requires Host review.
- Player snapshot/HTTP/SSE/UI/recap must never leak DM-only or rejected/private review payloads.
- UI and HTTP are thin adapters.
- No live provider calls in default tests.
- No secrets.
- No production auth/db/payment/deployment/full VTT/PDF import/D&D Beyond/full 5e automation.

Implementation priority:
P0 gap report and blocking UI/i18n fixes.
P1 Host + Player browser setup and full play flow.
P2 combat UI polish with no raw IDs for normal demo actions.
P3 Host review approve/edit/reject polish.
P4 English/Chinese fixed UI and system/demo text locale strategy.
P5 acceptance/smoke coverage and documentation/status updates.

Working rule:
If this becomes too large, complete the smallest vertical slice that proves Host + 2 players can complete the demo adventure through UI with no player leaks, then explicitly defer the rest. Prefer incremental patches over rewrites.

Definition of done:
- Host can create room, invite players, load/start demo, run/supervise AI, reveal clues, run combat, complete session, and see Host recap.
- Two players can join, create/select characters, see scene/feed/dice/combat/recap, send actions, and attack valid combat targets.
- English and Chinese UI can be selected and remain stable.
- Player-visible paths have no known DM-only leaks.
- Required verification commands are run or exact blockers are reported: npm run check, npm test, npm run acceptance, npm run build, and smoke:playtest if available.

Final report must include exactly:
Scope implemented:
Files changed:
Tests added/updated:
Commands run:
Acceptance criteria satisfied:
Deferred work:
Known risks:
Recommended next task:
```

---

## 7. 快速 bugfix prompt：修 UI/i18n 低级问题

```txt
/goal Find and fix low-risk UI/i18n/demo-flow bugs in TableMind without changing architecture.

Inspect apps/web/src/i18n.mjs, render-host.mjs, render-player.mjs, render-utils.mjs, host-app.mjs, player-app.mjs, api-client.mjs, and UI tests.

Fix issues such as undefined labels, buttons that call missing commands, stale state after commands, forms that submit unusable payloads, and missing user-facing error display. Add regression tests. Do not add dependencies. Run npm run check and relevant tests; run the full suite if feasible.
```

---

## 8. Review prompt：让 Codex 自查一个 PR/patch

```txt
/goal Review the current TableMind changes for demo readiness and safety. Do not implement new features unless the issue is a small obvious regression fix.

Check:
- no-DM-leak in player snapshot/HTTP/SSE/UI/recap
- AI cannot mutate state directly
- deterministic rules for checks/combat
- Host review required for risky AI output
- UI/HTTP are thin adapters
- English/Chinese fixed text coverage
- tests and docs updated
- no secrets or live provider calls in default tests

Run npm run check, npm test, npm run acceptance, and npm run build if environment allows. Produce a review report with blockers, non-blocking issues, and recommended next /goal.
```
