# TableMind 开源整合与自研边界决策

> 状态：Proposed  
> 建议落库路径：`docs/open-source-integration-strategy.md`  
> 日期：2026-05-26  
> 适用阶段：MVP / 内测原型  
> 结论摘要：**核心从零搭建，非核心能力精选开源模块；不 fork 完整 VTT，不把 GPL/AGPL 代码并入核心。**

---

## 1. 本文目的

本文综合当前仓库中的 PRD、spec、工程约束、开源项目调研和本轮会话中的讨论，给出 TableMind 在 MVP 阶段的开源整合策略。

本文回答四个问题：

1. 哪些能力必须自研，不能交给外部项目定义？
2. 哪些开源库可以直接作为依赖集成？
3. 哪些成熟开源 VTT/跑团项目只适合参考，不适合 fork 或并入？
4. 第一阶段应该如何落地到 repo 结构和任务拆分？

---

## 2. 资料输入

### 2.1 仓库内资料

已参考当前仓库中的以下资料：

- [`docs/PRD.md`](./PRD.md)
- [`specs/README.md`](../specs/README.md)
- [`specs/000-constitution.md`](../specs/000-constitution.md)
- [`specs/000-prd-analysis.md`](../specs/000-prd-analysis.md)
- [`specs/CODEX_PLAN_PROMPT.md`](../specs/CODEX_PLAN_PROMPT.md)
- [`specs/002-project-foundation`](../specs/002-project-foundation)
- [`specs/003-domain-model-event-log`](../specs/003-domain-model-event-log)
- [`specs/004-realtime-room`](../specs/004-realtime-room)
- [`specs/005-character-sheet`](../specs/005-character-sheet)
- [`specs/006-rules-engine`](../specs/006-rules-engine)
- [`specs/007-srd-compendium`](../specs/007-srd-compendium)
- [`specs/008-adventure-importer`](../specs/008-adventure-importer)
- [`specs/009-ai-dm-orchestrator`](../specs/009-ai-dm-orchestrator)
- [`specs/010-spoiler-guard`](../specs/010-spoiler-guard)
- [`specs/011-host-panel`](../specs/011-host-panel)
- [`specs/012-combat-mvp`](../specs/012-combat-mvp)
- [`specs/013-session-recap`](../specs/013-session-recap)
- [`specs/014-demo-adventure`](../specs/014-demo-adventure)

### 2.2 会话资料

本轮会话中已形成的初步判断是：

> TableMind 不应完整 fork 一个成熟 VTT，也不应所有能力从零实现。更稳的路线是：自研核心状态、权限、防剧透、AI DM 编排和事件日志；对骰子解析、规则资料结构、可选 3D 骰子表现、地图架构经验等能力进行选择性整合或参考。

跨会话检索未找到更多可用的 TableMind 历史上下文，因此本文以当前仓库资料和本轮会话为准。

### 2.3 外部开源 / 官方资料

已参考：

- [`dice-roller/rpg-dice-roller`](https://github.com/dice-roller/rpg-dice-roller)
- [`avrae/d20`](https://github.com/avrae/d20)
- [`3d-dice/dice-box-threejs`](https://github.com/3d-dice/dice-box-threejs)
- [`Kruptein/PlanarAlly`](https://github.com/Kruptein/PlanarAlly)
- [`open5e/open5e-api`](https://github.com/open5e/open5e-api)
- [`avrae/avrae`](https://github.com/avrae/avrae)
- [`cyruzzo/AboveVTT`](https://github.com/cyruzzo/AboveVTT)
- [`RPTools/maptool`](https://github.com/RPTools/maptool)
- [D&D Beyond SRD v5.2.1](https://www.dndbeyond.com/srd)
- [OSI MIT License](https://opensource.org/license/mit)
- [GNU GPL FAQ](https://www.gnu.org/licenses/gpl-faq.html)
- [GNU AGPL v3](https://www.gnu.org/licenses/agpl-3.0.en.html)

---

## 3. 从 PRD/spec 得出的产品约束

TableMind 的 PRD 和 spec 给出的核心方向非常明确：它不是传统 VTT 克隆，而是一个围绕 AI DM 主持、结构化冒险、确定性规则、事件日志、防剧透和 Host 兜底构建的多人跑团引擎。

关键约束如下。

### 3.1 TableMind 的 MVP 不是完整 VTT

PRD 定义 MVP 为 2–4 名玩家完成 60–90 分钟的 D&D 5e-compatible one-shot。MVP 要验证的是 AI DM 能否稳定主持、系统能否守住隐藏信息、多人状态能否一致、规则裁判能否交给确定性工具、Host 能否纠错接管。

这意味着：

- 地图、动态光照、3D 棋子、复杂网格不是第一优先级。
- 第一阶段重点不是“做 Roll20/Foundry 替代品”。
- 开源 VTT 的地图、光照、token 系统只能作为参考，不应主导架构。

### 3.2 LLM 不能成为状态源

工程宪法明确规定：LLM 永远不是游戏状态的 source of truth。权威状态应来自：

- persisted session state
- append-only event log
- deterministic rules engine outputs
- approved Host overrides

因此，任何开源库的引入都不能绕过 TableMind 自己的状态模型。骰子库可以负责解析和执行表达式，但投骰结果必须进入 TableMind 的事件日志。地图或规则库可以提供结构参考，但最终可见性、状态更新、授权和回放必须由 TableMind 自己掌控。

### 3.3 规则与骰子必须确定性、可测试、可回放

`006-rules-engine` 要求规则引擎负责骰子、检定、豁免、攻击、伤害、治疗、状态、先攻和回合推进。AI DM 可以提出规则请求，但不能伪造骰子或直接修改 HP/条件/资源。

所以骰子库必须满足这些条件：

- 能输出公式、原始骰面、修正值、总值。
- 能被包装成 TableMind 的 typed result。
- 能在测试中支持可控随机源，或至少由 TableMind 适配层提供可控随机与结果记录。
- 结果能序列化进 `SessionEvent`。

### 3.4 防剧透和可见性是底层数据能力

`003-domain-model-event-log`、`010-spoiler-guard` 和 `011-host-panel` 都要求 `public`、`dm_only`、`revealed`、`player_specific` 等可见性元数据贯穿实体、投影和输出检查。

这意味着：

- 外部冒险数据、规则数据、地图对象都必须经过 TableMind 的 visibility model。
- AI 输出必须经过 spoiler guard 才能广播。
- 玩家 API 不能直接拿到 raw session/adventure state。

### 3.5 Host override 是必需能力，不是锦上添花

Host 必须能查看 DM-only 信息、审核 AI 输出、手动揭示线索、切换场景、修改状态、暂停 AI。任何开源整合都不能让 Host 失去最终控制权。

---

## 4. 总体决策

### 4.1 推荐路线

**核心自研 + 模块化整合 + 外部项目参考。**

具体来说：

1. **自研核心**：domain model、event log、visibility projection、spoiler guard、AI DM orchestrator、Host panel、session service。
2. **直接整合低耦合库**：骰子表达式解析、可选 3D 骰子展示。
3. **参考成熟项目架构**：PlanarAlly 的地图、layer、socket、vision 设计可作为未来地图模块参考。
4. **谨慎使用规则内容**：优先使用官方 SRD v5.2.1；Open5e 可参考数据模型和 API 思路，但不要无脑导入其全部内容。
5. **避免 copyleft 代码污染核心**：GPL/AGPL 项目只做参考，除非未来明确决定把对应模块开源并满足许可证义务。

### 4.2 不推荐路线

不推荐以下路线：

- 完整 fork PlanarAlly、MapTool、AboveVTT、Avrae 作为 TableMind 底座。
- 在 MVP 阶段投入完整地图、动态光照、复杂 token movement。
- 把 Open5e 数据全量导入为产品规则库而不做 source/license 审核。
- 把 GPL/AGPL 代码复制进 `packages/*` 或 `apps/*`。
- 让 AI DM 自己算骰子、改 HP、决定隐藏信息何时展示。

---

## 5. 开源项目评估矩阵

| 项目 | 许可证/约束 | 建议等级 | 建议用途 | 不建议用途 |
|---|---:|---:|---|---|
| `@dice-roller/rpg-dice-roller` | MIT | A | TypeScript/JS 骰子表达式解析候选；适合封装为 `DiceRollerAdapter` | 不要让它直接写状态；必须由 rules engine 包装结果 |
| `avrae/d20` | MIT | A- | Python 后端骰子引擎候选；表达式强、D&D/d20 生态成熟 | 若项目主栈选择 TypeScript，则不要为了它引入 Python 规则服务 |
| `3d-dice/dice-box-threejs` | MIT | B | P2/P3 的 3D 骰子视觉层；只展示已确定结果或 UI 动画 | 不作为权威随机源，不放入 MVP 阻塞链路 |
| `Kruptein/PlanarAlly` | MIT | B+ | 地图、layer、vision、socket 分层的架构参考；未来轻量地图模块的灵感来源 | 不建议 MVP fork 或直接吸收地图核心代码 |
| `open5e/open5e-api` | modified MIT；图片和第三方 SRD/OGL 内容另有例外 | B | 参考 compendium 数据模型、API、搜索、fixture 组织 | 不建议直接全量导入内容；不要忽视第三方内容和图片授权 |
| D&D SRD v5.2.1 | CC-BY-4.0 | A | TableMind 内置规则内容的首选合法来源 | 不代表可使用 D&D 全部官方书籍、设定、怪物、冒险全文 |
| `avrae/avrae` | GPL-3.0 | C | 研究 Discord 跑团机器人、initiative、命令设计 | 不并入核心代码；不作为服务底座 |
| `cyruzzo/AboveVTT` | AGPL-3.0 | C | 研究 D&D Beyond 嵌入式 VTT 体验 | 不并入 SaaS/Web 核心 |
| `RPTools/maptool` | AGPL-3.0 | C | 研究完整 VTT 功能边界 | 不并入核心；不 fork 作为 TableMind 基础 |

---

## 6. 可直接整合的模块

### 6.1 骰子解析模块

#### 推荐决策

若 TableMind 采用 spec 推荐的 TypeScript/monorepo 方向，优先评估：

```txt
@dice-roller/rpg-dice-roller
```

如果后端最终选择 Python，并且 rules engine 主要在 Python 服务中实现，则可评估：

```txt
d20
```

两者不建议同时进入 MVP。第一版只选一个，避免规则结果格式分裂。

#### 适配层要求

必须通过 TableMind 自己的适配层调用骰子库：

```ts
type DiceRollerAdapter = {
  roll(input: {
    formula: string;
    reason?: string;
    rng?: RandomSource;
  }): DiceRollResult;
};

type DiceRollResult = {
  formula: string;
  rolls: Array<{
    sides: number;
    value: number;
    kept?: boolean;
    label?: string;
  }>;
  modifierTotal: number;
  total: number;
  normalizedExpression?: string;
  engine: "rpg-dice-roller" | "d20" | "tablemind-minimal";
};
```

适配层的职责：

- 统一输出格式。
- 过滤危险表达式。
- 限制最大骰子数量和表达式复杂度。
- 接入测试随机源或记录原始结果。
- 把结果转成 `dice.rolled` / `check.resolved` / `attack.resolved` 等事件 payload。

#### 验收标准

- `1d20`、`2d6+3`、`1d8 + 4` 可解析。
- 能支持 advantage/disadvantage 或由 rules engine 自己实现 d20 选择。
- 所有骰子结果能序列化进事件日志。
- replay 时不重新投骰，只读取事件中的结果。
- 测试能覆盖固定 RNG 或固定 roll fixture。

#### 风险

即使使用成熟骰子库，TableMind 也不能把“规则结算”外包给该库。骰子库只处理表达式和随机结果；命中、DC 成败、HP、状态、事件提交仍由 rules engine/session service 负责。

---

### 6.2 SRD / 规则资料模块

#### 推荐决策

内置规则内容以官方 D&D SRD v5.2.1 为主，记录 CC-BY-4.0 attribution。

Open5e 可以作为以下内容的参考：

- compendium entry 的字段组织。
- API/search 的资源建模。
- fixture 目录和测试方式。
- rule/monster/spell/item 分类方式。

Open5e 不建议作为第一版的全量内容来源，因为其 license 说明中明确排除了仓库中的艺术图片和第三方 SRD 内容，且声明不对包含的 SRD/OGL 内容主张许可证。

#### 数据模型要求

每个 compendium entry 必须携带 source metadata：

```ts
type ContentSource = {
  id: string;
  title: string;
  contentClass:
    | "embedded_srd"
    | "embedded_original"
    | "user_private_upload"
    | "licensed_partner_content"
    | "unknown";
  license?: string;
  attribution?: string;
  url?: string;
};
```

第一版只放小 fixture，不要急着导入完整 SRD：

- ability checks
- advantage/disadvantage
- grappled condition
- 1–2 个 SRD-safe monster fixture
- short sword item fixture
- 1–2 个常用 spell fixture

#### 验收标准

- 所有 fixture 都通过 source/license metadata 校验。
- 公共 UI 可以显示 attribution。
- AI DM 输出规则说明时能附带 rule citation。
- rules engine 使用 structuredData，而不是解析 rawText。
- 不提交商业 D&D 内容、官方冒险全文、D&D Beyond 用户内容。

---

### 6.3 3D 骰子视觉模块

#### 推荐决策

`3d-dice/dice-box-threejs` 可作为 P2/P3 视觉增强候选，MVP 不依赖它。

正确定位：

- 它是 UI 层效果，不是权威随机源。
- 它可以播放“已经由 rules engine 决定的结果”。
- 如果视觉库自己产生随机值，也必须被视为动画，不作为权威规则结果。

#### 接入边界

```txt
rules-engine 产生权威结果
  -> event log 记录结果
  -> web UI 订阅 dice.rolled event
  -> 3D dice 播放对应动画
```

不要这样做：

```txt
3D dice animation 产生结果
  -> 直接决定规则结算
```

---

## 7. 只参考、不整合的模块

### 7.1 PlanarAlly

PlanarAlly 是最值得研究的 VTT 参考项目。它具备 self-host、offline support、simple layers、infinite canvas、dynamic lighting、player vision、initiative tracker 等能力。其架构文档还说明了 session 中使用 socket.io/WebSocket 双向通信，并通过 namespace 区分 asset store 与 core game。

但 TableMind MVP 不应 fork PlanarAlly，原因是：

- TableMind 的第一目标是 AI DM one-shot，不是完整地图工具。
- PlanarAlly 的复杂 vision/layer/shape 代码会把项目拖向 VTT 内核。
- TableMind 的事件日志、防剧透、Host 审核、AI 编排比地图更核心。
- 即使许可证允许，也不代表产品边界适合。

建议参考内容：

- websocket 事件分层。
- asset store 与 core game namespace 分离。
- layer/shape/visibility 的概念建模。
- 临时事件和持久化事件的区别。

不建议直接复制内容：

- dynamic lighting / vision 核心实现。
- shape draw loop。
- 完整地图编辑 UI。

未来地图模块可以使用更小的自研模型：

```ts
type SceneMap = {
  id: string;
  sceneId: string;
  grid?: GridConfig;
  tokens: MapToken[];
  zones: MapZone[];
  annotations: MapAnnotation[];
  visibility: Visibility;
};
```

MVP 甚至可以先没有地图，只保留 scene + location + encounter + theater-of-the-mind 文本房间。

### 7.2 Avrae 主项目

Avrae 主项目适合研究 Discord 跑团机器人、命令交互、initiative、角色数据和骰子日志，但主项目是 GPL-3.0。

建议：

- 可以研究产品交互和命令设计。
- 可以研究它如何把复杂 D&D 操作转成用户可理解的命令。
- 不复制代码到 TableMind。
- 如需骰子能力，使用独立 MIT 的 `avrae/d20`，而不是 GPL 的 `avrae/avrae` 主项目。

### 7.3 AboveVTT / MapTool

AboveVTT 和 MapTool 都是很好的 VTT 体验参考，但 license 为 AGPL-3.0。

AGPL 对网络服务场景尤其敏感：如果修改后的 AGPL 程序通过网络提供交互，通常需要向远程用户提供对应源码。除非 TableMind 未来明确决定把对应模块按 AGPL 要求开源，否则不要把 AGPL 代码并入核心。

建议用途：

- 研究功能边界。
- 研究用户体验。
- 研究地图/encounter/initiative 设计。

禁止用途：

- 复制源代码进 TableMind。
- fork 作为 SaaS 核心。
- 改造后闭源部署。

---

## 8. 许可证策略

### 8.1 默认允许

以下许可证类型可以优先考虑作为依赖或参考实现：

- MIT
- Apache-2.0
- BSD-2-Clause / BSD-3-Clause
- ISC
- CC-BY-4.0，限内容/文本/数据，必须保留 attribution

### 8.2 默认禁止直接并入核心

以下许可证或情况默认禁止复制代码进核心仓库：

- GPL-2.0 / GPL-3.0
- AGPL-3.0
- LGPL，除非明确评估动态链接/分发义务
- CC-BY-NC / 非商业限制内容
- 无许可证仓库
- license 不清晰的数据包
- 商业 D&D 内容、官方冒险全文、非 SRD 内容

### 8.3 必须新增的仓库规范

建议在第一阶段加入：

```txt
THIRD_PARTY_NOTICES.md
```

每个第三方依赖记录：

```md
## @dice-roller/rpg-dice-roller

- Repository: https://github.com/dice-roller/rpg-dice-roller
- Package: @dice-roller/rpg-dice-roller
- License: MIT
- Usage: Dice expression parsing behind TableMind DiceRollerAdapter
- Copied code: No
- Notes: Results are converted into TableMind events; library does not own session state.
```

另外建议在 PR checklist 加入：

- [ ] 新增依赖已记录 license。
- [ ] 未复制 GPL/AGPL 代码。
- [ ] 所有规则/冒险 fixture 均为 SRD/open/original/user-private。
- [ ] 所有 embedded content 均带 source/license/attribution metadata。

---

## 9. 推荐落地顺序

### Milestone 1：Foundation + Core Contracts

目标：不接真实 LLM，不做完整 UI，先把可测试核心打牢。

任务：

1. 建立 monorepo 或 app scaffold。
2. 创建：
   - `packages/domain`
   - `packages/rules-engine`
   - `packages/compendium`
   - `packages/adventure-loader`
   - `packages/shared-test-fixtures`
3. 创建 placeholder：
   - `apps/web`
   - `apps/server`
4. 建立 test/lint/typecheck/build 脚本。
5. 定义 `SessionState`、`SessionEvent`、`Visibility`。
6. 定义 dice result/event payload。
7. 建立 `THIRD_PARTY_NOTICES.md`。

### Milestone 2：Dice + Rules Engine MVP

目标：让规则和骰子可测试、可回放。

任务：

1. 选择一个骰子库：优先 `@dice-roller/rpg-dice-roller`；若主栈改为 Python 则选 `d20`。
2. 实现 `DiceRollerAdapter`。
3. 实现 `abilityModifier`、proficiency、checks、saves。
4. 实现 attack vs AC、damage、healing、condition basics。
5. 所有结果转事件 payload。
6. 测试 replay 不重新投骰。

### Milestone 3：Compendium + Demo Fixtures

目标：让 AI DM 和 rules engine 有结构化、合规的数据可用。

任务：

1. 定义 `CompendiumEntry` 和 `ContentSource`。
2. 加小型 SRD/open fixture。
3. 加 source/license metadata 校验。
4. 编写 Demo adventure `The Lantern Beneath the Hill / 山丘下的灯火` 的 structured Markdown。
5. 解析为 AdventureModule draft。
6. 测试 visibility 标记与 clue reveal。

### Milestone 4：Realtime Room + Event Projection

目标：多人房间可同步，不泄露 Host-only 数据。

任务：

1. 实现 server-authoritative room lifecycle。
2. 实现 player/host projection。
3. 提交事件后再广播。
4. 支持 reconnect snapshot。
5. 测试 player projection 排除 `dm_only`。

### Milestone 5：AI DM Orchestrator + Spoiler Guard

目标：AI 可以参与主持，但必须经过结构化校验和防剧透检查。

任务：

1. 实现 provider-agnostic `AiModelAdapter`。
2. 先用 mock adapter 测试。
3. 定义 `AiDmResponse` schema。
4. 接入 compendium/adventure retrieval。
5. publicMessage 经过 spoiler guard。
6. risky output 进入 Host review queue。

### Milestone 6：Host Panel + Combat MVP + Recap

目标：跑通一场短团闭环。

任务：

1. Host review queue。
2. Host 手动 scene/clue/state override。
3. CombatState、initiative、turn advancement。
4. attack/damage/HP event。
5. player-safe recap 与 host recap。

### Milestone 7：Optional Visual Enhancements

目标：增强沉浸感，不影响权威规则。

候选：

- `3d-dice/dice-box-threejs`
- 轻量 token board
- scene image/handout
- map annotation

---

## 10. 架构边界建议

### 10.1 包边界

建议 repo 使用或接近以下结构：

```txt
/apps
  /web
  /server
/packages
  /domain
  /rules-engine
  /compendium
  /adventure-loader
  /shared-test-fixtures
/docs
/specs
```

### 10.2 依赖方向

```txt
apps/web -> packages/domain
apps/server -> packages/domain
apps/server -> packages/rules-engine
apps/server -> packages/compendium
apps/server -> packages/adventure-loader
```

禁止方向：

```txt
packages/domain -> apps/server
packages/rules-engine -> AI provider SDK
packages/domain -> UI framework
packages/compendium -> commercial D&D data
```

### 10.3 外部库封装原则

所有第三方库必须通过本项目 adapter/facade 进入核心：

```txt
Third-party library
  -> TableMind adapter
  -> typed domain result
  -> event payload
  -> session service commit
  -> role-aware projection
  -> client broadcast
```

这样可以避免后续替换库时污染核心模型。

---

## 11. 关键决策记录

### ADR-001：不 fork 完整 VTT

**决策**：不以 PlanarAlly、MapTool、AboveVTT 或其他完整 VTT 为项目底座。

**原因**：TableMind 的核心问题是 AI DM 主持、结构化冒险执行、状态可靠性、防剧透和 Host 控制，不是完整地图工具。完整 VTT 会放大地图/光照/资产管理复杂度，拖慢 MVP 验证。

### ADR-002：骰子库可以集成，但规则裁判必须自有

**决策**：骰子表达式解析可使用 MIT 库，但 check/attack/damage/state patch/event log 由 TableMind rules engine/session service 完成。

**原因**：spec 要求可测试、可回放、确定性和事件化。骰子库不是 game state source of truth。

### ADR-003：SRD 内容优先来自官方 CC-BY 来源

**决策**：内置规则内容优先使用 D&D SRD v5.2.1，并显式记录 CC-BY-4.0 attribution。

**原因**：这是与 PRD 一致的最稳内容边界。Open5e 可参考技术和数据模型，但不作为未经审核的内容全集来源。

### ADR-004：GPL/AGPL 项目只研究，不并入

**决策**：GPL/AGPL 代码不复制进 TableMind 核心。

**原因**：TableMind 未来可能是 Web/SaaS 产品；AGPL 对网络服务有源码提供义务，GPL 对组合/分发有 copyleft 义务。除非未来明确接受这些义务，否则不应引入。

### ADR-005：3D 骰子后置

**决策**：3D 骰子是视觉增强，不是 MVP blocker。

**原因**：MVP 成败取决于房间、事件、规则、防剧透、Host 接管和 demo adventure，而不是动画效果。炫酷骰子可以晚点上，技术债的牙口可比哥布林硬多了。

---

## 12. 第一批 GitHub issue 建议

### Issue 1：Add third-party dependency policy

内容：

- 新增 `THIRD_PARTY_NOTICES.md`。
- 新增 PR checklist。
- 记录允许/禁止许可证策略。
- 明确 GPL/AGPL 只参考不复制。

### Issue 2：Define DiceRollerAdapter contract

内容：

- 在 `packages/rules-engine` 设计 `DiceRollerAdapter`。
- 定义 `DiceRollResult`。
- 写 fixture：`1d20`、`2d6+3`、`1d8 + 4`。
- 不引入真实库也可先用 `tablemind-minimal` mock。

### Issue 3：Evaluate `@dice-roller/rpg-dice-roller`

内容：

- 验证 Node/ESM 兼容性。
- 验证是否能注入或控制随机源。
- 验证复杂表达式限制能力。
- 验证输出能否映射到 TableMind event payload。
- 结论写入 `docs/open-source-integration-strategy.md` 或 ADR。

### Issue 4：Add compendium source metadata validation

内容：

- 定义 `ContentSource`。
- 为 fixture 添加 source/license/attribution。
- 测试缺失 metadata 时失败。

### Issue 5：Draft SRD-safe demo adventure fixture

内容：

- 写 `The Lantern Beneath the Hill / 山丘下的灯火` structured Markdown。
- 所有文本原创。
- 标记 public / dm_only / hidden clues。
- 添加 spoiler guard fixture test。

### Issue 6：PlanarAlly architecture notes for future map module

内容：

- 记录可借鉴点：socket namespace、layer、shape、temporary event、asset/game separation。
- 明确 MVP 不实现 full VTT。
- 输出未来 `SceneMap` 最小数据模型草案。

---

## 13. 风险与缓解

| 风险 | 影响 | 缓解 |
|---|---|---|
| 骰子库不支持测试随机源 | replay/test 不稳定 | 适配层记录结果；必要时 MVP 自研最小骰子解析 |
| AI 输出绕过规则引擎 | 状态错误、玩家不信任 | AI 只发 rule request；rules engine 结算；Host 可审 |
| Open5e 内容授权混乱 | 法务/商业风险 | 只参考模型；内置内容来自官方 SRD/open/original；所有 entry 带 source metadata |
| 过早做地图/VTT | MVP 失焦 | 地图后置；scene/encounter 文本优先 |
| AGPL/GPL 代码误入 | 许可证义务触发 | PR checklist + THIRD_PARTY_NOTICES + dependency review |
| 防剧透仅靠 prompt | 隐藏信息泄露 | visibility projection + deterministic spoiler check + Host review |
| Host 面板太晚做 | AI 错误无法兜底 | Host override 与 review queue 作为 P1 关键链路，不后置到商业化 |

---

## 14. 最终建议

TableMind 的核心竞争力不是“又一个地图工具”，而是：

```txt
结构化冒险 + AI DM 编排 + 确定性规则 + 事件日志 + 防剧透 + Host 兜底
```

因此，MVP 阶段推荐：

1. **核心从零搭建**：domain、event、projection、rules、orchestrator、spoiler guard、Host panel。
2. **骰子表达式用成熟 MIT 库加速**：优先 `@dice-roller/rpg-dice-roller`，Python 栈才考虑 `d20`。
3. **SRD 内容走官方 CC-BY 路线**：Open5e 只做 schema/API 参考，不全量搬内容。
4. **PlanarAlly 只做地图架构参考**：未来轻量地图再研究，不进 MVP 阻塞链路。
5. **GPL/AGPL 项目只研究，不并入**：避免许可证义务和产品形态冲突。
6. **3D 骰子后置**：先确保投骰可信、事件可回放、规则正确，再追求动画。

一句话：

> **TableMind 应该自己掌握“桌上的真相”，把开源项目当工具箱，不要把方向盘交给任何一个现成 VTT。**
