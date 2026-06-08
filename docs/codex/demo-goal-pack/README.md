# TableMind Codex `/goal` Demo Pack

生成日期：2026-06-08

用途：把当前 TableMind 仓库推进到“可演示、可完整跑一局”的 demo 级版本，同时避免 Codex 在长程任务里跑偏、越界或破坏现有安全边界。

## 文件索引

- `DEMO_SCOPE_GAP_ANALYSIS.md`：当前代码基础与 demo 差距分析。
- `TABLEMIND_DEMO_GOAL_RUNBOOK.md`：给人看的长程任务执行手册。
- `CODEX_GOAL_PROMPTS_TABLEMIND_DEMO.md`：可直接复制给 Codex 的 `/goal` 提示词。
- `DEMO_ACCEPTANCE_CHECKLIST.md`：最终 demo 验收清单。
- 根目录 `AGENTS.md`：建议让 Codex 自动读取的项目级开发规范。

## 推荐用法

最推荐的做法：先让 Codex 跑 `CODEX_GOAL_PROMPTS_TABLEMIND_DEMO.md` 里的“规划型 `/goal`”。规划确认后，再使用分阶段提示词逐段推进。

如果确实想跑一个长程 `/goal`，也可以使用“一次性长程版”，但必须要求 Codex：先做 gap report，再按 P0/P1/P2 顺序实现，每完成一个阶段都跑测试并提交阶段报告；如果时间或上下文不够，优先交付完整 Host + 2 玩家 demo 主流程，而不是到处铺开。

## 核心策略

TableMind 不是从零开始。当前仓库已经有本地 mock-provider MVP、HTTP/SSE、静态 Host/Player UI、规则/战斗/recap/防泄漏测试。下一步应该是 demo polish：让 Host 和玩家不用知道内部 ID、不用手工补流程，也能通过 UI 顺畅完成一局。

优先级建议：

1. 修阻塞 bug 与粗糙 UX。
2. 打磨 Host + 玩家完整浏览器流程。
3. 打磨战斗交互，不再让用户手填 combatant id。
4. 补齐中英双语：UI、流程提示、AI 输出 locale、recap 标签、demo 冒险可本地化文本。
5. 加强 no-DM-leak、i18n、UI smoke、browser-like acceptance 测试。
6. 更新 playtest docs 和当前状态文档。

## 不要扩大范围

Demo 级不等于 production ready。不要让 Codex 在这个目标里实现生产认证、数据库持久化、支付、公开市场、PDF 完整导入、D&D Beyond 同步、完整 VTT、全 5e 自动化或默认 live provider 测试。
