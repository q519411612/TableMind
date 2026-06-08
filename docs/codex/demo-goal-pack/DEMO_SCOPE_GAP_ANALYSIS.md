# TableMind Demo Scope Gap Analysis

## 当前仓库可复用基础

当前项目不是空白工程，Codex 不应该重写架构。现有基础包括：

- Node 20+、ESM、npm scripts、workspace 风格项目。
- 本地 mock-provider MVP：创建房间、两名玩家加入、创建角色、加载 demo 冒险、开始团局、AI 回合、检定、揭示线索、战斗、结束、recap。
- `apps/server` 中的 room service、command dispatcher、HTTP API、SSE event stream、AI room runner/provider boundary。
- `apps/web` 中零依赖静态 Host/Player UI。
- `packages` 中规则引擎、compendium、adventure loader、session recap 等。
- 中英 UI label 字典：`en` 和 `zh-CN`。
- no-DM-leak、防剧透、provider-disabled 默认测试、mock AI 回归测试。

## 主要差距

### 1. Demo 体验仍像“工程控制台”

现有 UI 已能跑流程，但很多操作仍需要理解内部 ID 或按固定顺序手动操作。demo 级版本应让 Host/玩家通过可见按钮、下拉列表、状态提示完成流程。

要补：

- Host onboarding：创建房间 -> 加载冒险 -> 复制邀请链接 -> 等待玩家 -> 开始团局。
- Player onboarding：从邀请链接自动带 roomId；输入昵称；选择/创建预设角色；进入场景。
- 流程状态提示：下一步该做什么、缺什么、错误如何恢复。
- UI 错误提示：HTTP/command 失败时展示友好消息，不只是控制台异常。

### 2. 战斗 UI 需要从“手填 ID”升级为“可玩操作”

玩家攻击现在容易依赖 `combatantId` 字符串；Host 调 HP/condition 也偏工程化。demo 级应支持：

- 当前行动者、轮次、先攻顺序清晰显示。
- 玩家只能在自己角色可行动时攻击。
- 攻击目标下拉选择，显示怪物/角色名称、HP、状态。
- 攻击招式下拉选择，显示命中加值、伤害式。
- 命中/伤害结果写入 dice log 和 public feed。
- Host 能通过下拉选择 combatant，调整 HP/condition，结束战斗。
- 至少一个怪物回合可由 Host/AI 安全推进；不要求完整 AI 怪物战术。

### 3. Host review 的“编辑”能力要真实可用

Host 面板当前有 approve/edit/reject 按钮，但 demo 级需要：

- 展示 publicMessage / proposed reveal / state patch 风险。
- 允许 Host 编辑 AI 即将发送的 publicMessage。
- approve/edit/reject 后状态即时更新。
- 被 reject 的内容绝不进入 player feed、player SSE、player recap。
- risky AI 输出必须进入 review，不得直接变更状态。

### 4. 中英双语需要从“UI label”扩展为“完整演示语言体验”

已有 `en` / `zh-CN` UI 字典，但 demo 级应覆盖：

- 所有固定 UI 文案、按钮、空状态、错误、流程提示。
- URL `?lang=` + localStorage 持久化。
- AI 输出 locale：Host/房间语言进入 AI context，mock/live provider 输出对应语言。
- Recap 标签和系统生成摘要支持 locale。
- Demo 冒险内容支持本地化字段；没有本地化时保留原文，不要机器硬翻商业/作者文本。
- 测试覆盖 English 与中文两套渲染，不泄露 DM-only。

### 5. Browser-like end-to-end smoke 需要更贴近真实用户

当前 acceptance 偏 API/render 层；demo 级应增加 browser-like smoke 或至少 DOM-level flow：

- Host 打开 `host.html` 创建房间并复制邀请。
- Player A/B 打开 `player.html?roomId=...` 加入。
- 两名玩家创建角色。
- Host 加载冒险、开始、运行 AI、揭示线索、开始战斗、完成战斗、结束团局。
- 玩家视图无 DM-only 文本。
- 中英文模式均能跑关键路径。

### 6. 文档与状态页要同步

需要更新：

- `docs/CURRENT_STATUS.md`：只声明实际完成内容，不夸大生产可用。
- `docs/playtests/*`：补一份 demo playtest runbook 和报告模板。
- `README.md`：把当前可运行 demo 命令、UI 入口、限制写清楚。

## 非目标

Codex 不应为了 demo 做这些事：

- 生产认证、账号系统、付费系统。
- 持久化数据库、多进程扩展、部署平台。
- PDF 完整导入、商业 D&D 内容、D&D Beyond 同步。
- 完整 Roll20/Foundry 级 VTT、地图网格、动态光照、token 移动。
- 全 5e 自动化、完整角色构筑器、全部法术/职业特性。
- 默认测试调用 live provider。

## Demo Definition of Done

可以称为 demo 级版本时，至少满足：

1. Host + 2 players 能通过浏览器 UI 完成 demo 冒险主流程。
2. 支持创建/加入/角色/场景/聊天/AI 回合/检定/线索/战斗/recap。
3. 玩家侧全程无 DM-only 泄漏。
4. Host 可查看 DM-only、审核/编辑/拒绝 AI、手动推进和修正。
5. 中英 UI 可切换；AI/recap/demo 文案有可验证的 locale 策略。
6. `npm run check`、`npm test`、`npm run acceptance`、`npm run build` 通过，或明确记录环境原因。
7. 文档说明启动方式、演示脚本、已知限制。
