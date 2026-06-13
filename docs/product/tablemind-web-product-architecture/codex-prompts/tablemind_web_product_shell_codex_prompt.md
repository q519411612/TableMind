# TableMind Web Product Shell - Codex Prompt

你现在接手 TableMind 当前仓库。

目标不是创建新 TRPG 项目，也不是把外部 UI zip 直接覆盖进来。
不要把项目改名为“烛影之桌”或其他新产品名。

产品策略：
- TableMind 当前项目是跑团玩法核心，必须保留。
- TableMind Core 负责 AI DM、规则引擎、房间系统、多玩家同步、Host Review、防剧透、骰子、战斗、event log。
- 之前生成的 TRPG UI zip 只作为视觉系统、页面结构和完整产品功能蓝图参考。
- 第一阶段围绕现有 playtest flow 产品化 Host / Player UI，不直接覆盖 apps/web，不破坏当前 demo flow，不扩大到完整 VTT 或泛用跑团后台。

请先阅读 README.md、docs/PRD.md、docs/CURRENT_STATUS.md、apps/web/src/、apps/server/src/room-actions.mjs、apps/server/src/http-server.mjs、apps/server/src/room-service.mjs、tests/acceptance/mvp-ui-playtest.acceptance.test.mjs。

第一阶段目标：TableMind Web Play UI。

请完成：
1. 保留 Host 创建房间、邀请链接、Player 加入、角色、冒险、AI turn、Host review、check、clue、combat、recap 的现有流程。
2. 吸收 UI zip 的 dark fantasy / archive / parchment 风格 tokens。
3. 重构当前 Host/Player UI 布局为产品化 Session Room 和 Host Console。
4. 明确保留 Host-only / Player-safe 权限边界。
5. 不做完整地图编辑器、完整 VTT、完整角色创建器、真实 DB、真实 auth、付费。
6. 更新 docs/frontend-product-shell.md。
7. 运行 npm run check、npm test、npm run acceptance、npm run build；失败则修复或记录原因。

最终回复请说明：
- 阅读到的当前项目状态。
- 修改文件。
- UI zip 吸收了哪些元素。
- 哪些功能刻意没有做。
- 验证命令结果。
- 下一阶段建议。
