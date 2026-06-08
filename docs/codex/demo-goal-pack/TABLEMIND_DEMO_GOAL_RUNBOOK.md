# TableMind Demo `/goal` Runbook

## 目标

把当前 TableMind 仓库从“本地 MVP / 工程可验证”推进到“demo 级可演示”：一名 Host 和 2 名玩家可以通过浏览器 UI 完成原创 5e-compatible 短冒险，包含创建房间、加入、创建角色、AI DM 主持、检定、战斗、Host 审核/接管、中英双语和 recap。

## 不要把它当成重写项目

Codex 必须基于当前架构增量改造。优先复用：

- `apps/server/src/room-service.mjs`
- `apps/server/src/room-actions.mjs`
- `apps/server/src/http-server.mjs`
- `apps/server/src/playtest-server.mjs`
- `apps/web/src/*`
- `packages/rules-engine`
- `packages/adventure-loader`
- `packages/session-recap`
- `packages/shared-test-fixtures`
- 现有 `specs/**` 和 `docs/**`

## 全局硬性约束

1. LLM 不是事实源；AI 输出不能直接改状态。
2. 掷骰、检定、攻击、伤害、先攻、HP 变化必须由 deterministic rules/system code 产生。
3. 玩家 snapshot、HTTP response、SSE、UI、recap 不能包含 DM-only / Host-only / rejected AI output。
4. risky AI 输出、低置信度、揭示建议、state patch 必须进入 Host review。
5. 默认测试不得调用 live provider。
6. 不提交 provider key、token、authorization header、真实 payload。
7. 业务逻辑留在 domain/room/command/rules 模块；UI 和 HTTP handler 只做薄适配。
8. demo 只做短团，不做完整 VTT。

## 建议执行顺序

### Phase 0 — Gap report 和阻塞修复

Codex 先读文档和代码，输出当前功能矩阵。然后修明显阻塞 bug，例如缺失 i18n label、按钮无效、流程状态不同步、错误提示缺失。

验收：

- UI 渲染测试覆盖新增/修复 label。
- 不扩大架构。
- `npm run check` 和相关测试通过。

### Phase 1 — Host/Player 完整浏览器流程

目标是“不会代码的人也能跑起来”：

- Host 创建房间、加载 demo、复制邀请、看到玩家/角色、开始团局。
- Player 从邀请链接加入，创建/选择预设角色，看到场景、feed、角色、骰子、战斗、recap。
- 每个阶段显示下一步提示和错误提示。

验收：

- 增加/更新 render tests。
- 增加完整 UI acceptance 或 browser-like smoke。
- 玩家 UI 不依赖 Host snapshot。

### Phase 2 — 战斗 demo polish

目标是让 demo 中一次战斗可顺畅完成：

- 显示先攻顺序、当前回合、HP、AC、状态。
- 玩家目标和攻击用下拉选择，不手填 ID。
- Host 可下拉 patch HP / condition，可结束战斗。
- 回合限制和错误提示清楚。

验收：

- 攻击事件仍为 deterministic rules result。
- combat.attack / damage.applied 流程有回归测试。
- no-DM-leak 测试覆盖 combat snapshot。

### Phase 3 — Host review 和 AI safety polish

目标是让 Host 真正能管 AI：

- review queue 展示风险类型、原因、public payload。
- approve/edit/reject 可用；edit 必须能提交编辑后的 publicMessage 或 proposedPayload。
- rejected/edited private payload 不进入玩家端。
- AI pause/resume 状态明确。

验收：

- Review edit path 有 unit/acceptance test。
- Player feed/SSE/recap 不含 rejected payload。

### Phase 4 — 中英双语 demo 体验

目标不只是按钮中英切换，而是演示全流程有语言策略：

- `en` / `zh-CN` dictionary 覆盖所有固定 UI 文案。
- 浏览器语言可通过 `?lang=` 和 localStorage 持久化。
- 房间或 viewer locale 能进入 AI context / mock AI / recap。
- Demo 冒险支持本地化字段，至少 current scene/read-aloud/clue title/text/recap headings 有中英策略。
- 没有 translation 的 authored text 保持原文，不要擅自硬翻成“似是而非”的内容。

验收：

- English 和中文 render tests。
- 至少一条 end-to-end smoke 用中文 UI 跑关键路径。
- no-DM-leak 在两种 locale 下都成立。

### Phase 5 — Playtest docs 和状态同步

目标是可交给别人演示：

- README 写清 Node 20、启动命令、Host/Player URL、mock/live provider 边界。
- docs/playtests 增加 demo checklist/report。
- CURRENT_STATUS 更新为真实状态：demo 可跑 ≠ production ready。

验收：

- 文档不包含秘密。
- 文档不声称 production readiness。

## 每个 Codex 回合必须跑的命令

优先跑：

```bash
npm run check
npm test
npm run acceptance
npm run build
```

如果环境 Node 版本不满足 Node 20，应明确记录：

- 当前 `node --version`
- 哪些命令无法跑
- 需要如何切换 Node 20+

## Review 清单

Review Codex 输出时，先看这些：

- 是否读了 `docs/PRD.md`、`docs/CURRENT_STATUS.md`、`docs/DEVELOPMENT.md`、`specs/GOAL_ACCEPTANCE_GATES.md`、相关 specs？
- 是否把 UI/HTTP 保持为薄层，没有塞业务逻辑？
- 是否没有重写项目、没有引入大框架？
- 是否新增/更新了测试？
- 是否默认 provider disabled？
- 是否所有玩家可见输出都经过 projection/no-leak 测试？
- 是否中英文案完整，不存在 `undefined` label？
- 是否 final report 包含 Scope / Files changed / Tests / Commands / Risks / Deferred work？

## 停止并拆分的信号

看到这些就让 Codex 停下来拆任务：

- 一次性引入 React/Vite/Tailwind 或大型状态管理，但没有必要。
- 修改规则引擎来迎合 UI，而不是通过 command/API 正确使用规则。
- 在默认测试里打 live provider。
- 为 demo 引入生产 auth/db/deployment。
- 用 Host snapshot 渲染玩家 UI。
- 为了中文支持硬翻整个冒险文本而没有结构化 locale 字段。
- 删除或弱化 no-DM-leak、防剧透、Host review 测试。
