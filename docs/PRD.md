# TableMind PRD：AI DM for D&D 5e-compatible Adventures

> 文档版本：v0.1  
> 日期：2026-05-26  
> 项目代号：TableMind  
> 产品阶段：MVP / 内测原型  
> 目标产物：支持 D&D 5e SRD 规则包、5e-compatible 冒险导入、多人同房间游玩、AI DM 主持、Host 可接管的短团 Demo。

---

## 1. 背景与愿景

TableMind 的长期目标是做一个 **AI 驱动的多人跑团剧本引擎**：用户可以导入规则、剧本、地图、手卡、NPC、怪物与线索，由 AI 担任 DM/GM/KP，支持多人同时进入同一个剧本房间游玩，并由系统维护规则、隐藏信息、角色状态、战斗状态与剧情进度。

第一阶段不做“万能跑团平台”，而是选择一个足够具体、用户认知明确、可验证体验的切口：

> **基于 D&D 5e SRD 规则包，让 2–4 名玩家进入同一个房间，由 AI DM 主持一个 60–90 分钟的 5e-compatible 短冒险。**

这个 MVP 要验证的不是“AI 能不能写好故事”，而是更关键的五件事：

1. AI DM 能否基于结构化剧本稳定主持一场短团。
2. 系统能否避免 AI 提前泄露 DM-only 信息。
3. 多人同房间时，消息、骰子、状态、战斗轮次能否保持一致。
4. 规则裁判能否由可执行规则工具承担，而不是让大模型凭感觉胡判。
5. Host/人类 DM 是否能通过面板及时纠错、接管和推进。

TableMind 的核心理念：

> **LLM 负责叙事与交互，规则引擎负责裁判，状态机负责世界事实，Host 面板负责兜底。**

---

## 2. 产品定位

### 2.1 一句话描述

TableMind 是一个面向 D&D 5e-compatible 冒险的多人 AI DM 房间，支持导入结构化剧本，由 AI 基于 SRD 规则、剧本状态和多人输入主持短团。

### 2.2 产品关键词

- AI DM
- 多人跑团房间
- D&D 5e SRD
- 5e-compatible 冒险导入
- 剧本结构化
- 防剧透
- 规则引擎
- 骰子日志
- 战斗状态
- Host 接管
- Session Recap

### 2.3 与传统 VTT 的区别

TableMind 不以复杂地图、动态光照、3D 棋子为第一优先级，而是优先解决：

- 没有 DM 也能开短团
- 新手玩家能快速进入冒险
- Host 可以半自动主持
- 剧本可以被 AI 结构化理解
- AI 不乱剧透、不乱改状态、不乱判规则

传统 VTT 重点是“桌面工具”；TableMind 第一阶段重点是“AI 主持与剧本执行”。

---

## 3. MVP 范围定义

### 3.1 MVP 名称

**MVP-0.5：AI DM for 5e-compatible One-shot**

### 3.2 MVP 目标

在 2–4 名玩家参与的情况下，使用 D&D 5e SRD 规则包和一个结构化 5e-compatible 短冒险，让 AI DM 完成一场 60–90 分钟的可玩 Demo。

### 3.3 MVP 成功判断

一场内测短团结束后，如果满足以下条件，MVP 视为初步成功：

- 玩家能通过链接进入同一房间。
- Host 能创建房间并选择一个 5e-compatible 冒险。
- 至少 2 名玩家完成 1 级角色创建或导入。
- AI DM 能完成开场、调查、至少一次检定、至少一次战斗、结局总结。
- 攻击、伤害、HP、AC、先攻等基础规则基本正确。
- AI DM 没有提前泄露核心秘密或最终真相。
- Host 能查看 DM-only 信息，并能修改、撤回或接管 AI 输出。
- 玩家反馈“像是在玩 D&D”，且愿意再玩一局。
- Host 反馈 AI 至少减少了一部分主持压力，而不是增加负担。

### 3.4 MVP 非目标

MVP 明确不做以下内容：

- 不内置 D&D 官方非 SRD 内容。
- 不内置官方商业冒险全文。
- 不做 D&D Beyond 同步。
- 不做任意官方 PDF 一键完美导入。
- 不做完整 D&D Beyond 级角色创建器。
- 不做完整 Roll20/Foundry 级 VTT。
- 不做复杂动态光照、复杂网格移动和 3D 地图。
- 不自动化所有职业特性、所有法术、所有反应链。
- 不做大型长期战役记忆。
- 不做公开剧本市场。
- 不做付费系统。
- 不默认完全无 Host 监督的正式体验。

---

## 4. 内容与授权边界

> 说明：本节是产品边界设计，不构成法律意见。正式商业化前应由法律顾问复核。

### 4.1 内置规则内容

MVP 内置规则包仅使用 D&D SRD 5e 相关开放内容。

建议第一版优先支持：

- `5e-srd-5.2.1`：作为默认规则包。
- 架构预留 `5e-srd-5.1`：用于兼容更多旧版 5e-compatible 内容。

系统应在规则包元数据中记录：

```ts
rulesetId: "5e-srd-5.2.1"
sourceName: "D&D 5e SRD"
license: "CC-BY-4.0"
attribution: string
```

### 4.2 不内置的内容

MVP 不内置以下内容：

- Player's Handbook 非 SRD 内容。
- Dungeon Master's Guide 非 SRD 内容。
- Monster Manual 非 SRD 内容。
- 官方商业冒险全文。
- D&D Beyond 用户账号内容。
- 任何未取得授权的设定、角色、地点、插图、地图或剧情文本。

### 4.3 用户上传内容

MVP 可以允许 Host 上传私人冒险文本或 PDF，但默认边界如下：

- 文件只属于上传用户和对应房间。
- 文件不进入公共内容库。
- 文件不用于训练公共模型。
- 导入结果默认不可公开分享。
- 不提供官方书籍下载、复刻阅读或全文搜索服务。
- AI 输出应以运行游戏为目的，避免大段复刻原文。

### 4.4 推荐 Demo 内容

第一版公开 Demo 应使用：

- 自制 5e-compatible 短冒险。
- SRD 中可用的怪物、装备、规则与法术。
- 原创地点、NPC、剧情和手卡。

---

## 5. 目标用户与核心场景

### 5.1 用户类型

#### 5.1.1 新手玩家

特征：

- 想体验 D&D，但没有固定 DM。
- 对复杂规则不熟悉。
- 能接受 AI 引导。
- 希望快速开始，不想读厚规则书。

需求：

- 快速创建角色。
- AI 告诉自己可以做什么。
- 需要检定时系统自动提示。
- 战斗时知道轮到谁、能攻击谁、造成多少伤害。
- 不需要理解全部规则也能玩。

#### 5.1.2 人类 Host / DM

特征：

- 可能是熟悉 D&D 的玩家，也可能是组织者。
- 想用 AI 分担主持、查规则、扮演 NPC、记录状态。
- 不完全信任 AI，需要可控、可撤回、可接管。

需求：

- 导入或选择冒险。
- 查看 DM-only 信息。
- 监督 AI 输出。
- 修改 AI 叙述和判定。
- 手动调整状态。
- 查看规则依据。
- 生成战报。

#### 5.1.3 创作者 / 模组作者（MVP 后）

特征：

- 写 5e-compatible 冒险。
- 希望自己的冒险能被 AI 主持。
- 愿意使用结构化 Markdown 模板。

MVP 阶段暂不重点服务，但导入格式应为后续创作者生态预留空间。

---

## 6. 核心用户故事

### 6.1 Host 创建房间

作为 Host，我希望能创建一个 AI DM 房间，选择 SRD 规则包和一个短冒险，然后邀请朋友加入，这样我不用完整手动主持也能开一局 D&D。

验收标准：

- Host 可以点击“创建房间”。
- 系统生成唯一邀请链接。
- Host 可以选择内置 Demo 冒险或上传结构化冒险文件。
- 房间中展示当前规则包、冒险名、玩家列表。

### 6.2 玩家加入房间

作为玩家，我希望通过链接加入房间，创建一个简单角色，然后开始游玩。

验收标准：

- 玩家打开邀请链接后输入昵称。
- 玩家可以创建 1 级角色。
- 玩家能看到公共聊天区、角色状态、骰子日志和当前场景提示。

### 6.3 AI DM 开场

作为玩家，我希望 AI DM 自动介绍背景、当前场景和可行动线索，让我知道如何开始。

验收标准：

- Host 点击“开始冒险”后，AI DM 生成开场白。
- 开场白只包含玩家可见信息。
- 不泄露 DM-only 真相、陷阱或最终反派。

### 6.4 AI 请求检定

作为玩家，当我尝试调查、潜行、说服或攻击时，我希望系统告诉我需要进行什么检定，并自动计算结果。

验收标准：

- AI DM 可以提出检定请求。
- 系统显示检定类型、属性/技能、DC、原因。
- 玩家确认后系统掷骰。
- 系统根据角色属性、熟练项、优势/劣势计算结果。
- 结果写入公开骰子日志。

### 6.5 战斗遭遇

作为玩家，我希望遭遇怪物时系统能自动处理先攻、回合顺序、攻击、伤害和 HP。

验收标准：

- Host 或 AI DM 可以开始遭遇。
- 系统为所有参战者掷先攻。
- 显示当前回合和下一位行动者。
- 玩家攻击时系统计算命中和伤害。
- 怪物 HP 正确减少。
- 角色倒地或怪物死亡时状态更新。

### 6.6 防剧透

作为 Host，我希望 AI 可以读取 DM-only 信息用于主持，但不能提前把这些信息说给玩家。

验收标准：

- 剧本信息有 visibility 标记。
- AI 输出前经过防剧透检查。
- 未揭示线索、隐藏动机、陷阱、最终真相不能直接出现在 publicMessage 中。
- 若 AI 输出疑似泄密，系统提示 Host 审核。

### 6.7 Host 接管

作为 Host，我希望 AI 出错时可以撤回、修改、重发或完全接管。

验收标准：

- Host 可以编辑 AI 即将发送的 publicMessage。
- Host 可以撤回最近一条 AI 消息。
- Host 可以手动揭示线索。
- Host 可以手动切换场景。
- Host 可以修改角色、NPC、怪物状态。
- Host 可以暂停 AI 自动回应。

### 6.8 Session Recap

作为 Host 和玩家，我希望游戏结束后获得本局战报，包括剧情、关键检定、战斗结果、发现线索和未解决悬念。

验收标准：

- 结束冒险后生成 recap。
- recap 包含主要事件时间线。
- recap 包含骰子关键结果。
- recap 包含角色状态和获得奖励。
- recap 可复制为 Markdown。

---

## 7. 用户流程

### 7.1 Host 流程

1. 进入 TableMind。
2. 点击“创建房间”。
3. 选择规则包：`D&D 5e SRD 5.2.1`。
4. 选择冒险来源：
   - 内置 Demo 冒险。
   - 上传结构化 Markdown。
   - 上传 PDF，进入实验性导入流程。
5. 系统生成冒险模块草稿。
6. Host 审核并确认：
   - 场景
   - 地点
   - NPC
   - 遭遇
   - 线索
   - 秘密
   - 宝藏
   - read-aloud text
7. Host 邀请玩家加入。
8. 玩家创建角色。
9. Host 点击“开始冒险”。
10. AI DM 主持。
11. Host 通过面板监督和接管。
12. 冒险结束后生成 recap。

### 7.2 玩家流程

1. 打开邀请链接。
2. 输入昵称。
3. 创建或导入角色。
4. 进入房间。
5. 阅读 AI DM 开场白。
6. 在公共频道描述行动。
7. 接受检定请求并掷骰。
8. 战斗时按回合行动。
9. 查看线索、状态、骰子和战报。

### 7.3 AI DM 回应流程

1. 收到玩家消息或 Host 指令。
2. 获取当前 SessionState。
3. 获取当前场景 public 与 DM-only 信息。
4. 获取最近消息窗口。
5. 检索相关 SRD 规则。
6. 检索相关冒险模块内容。
7. 调用 AI DM Orchestrator 生成结构化输出。
8. 运行防剧透检查。
9. 若有规则调用，交给 Rules Engine 执行。
10. 若有状态变更，生成待确认 statePatch。
11. 若需要 Host 审核，则进入 Host 待审队列。
12. 通过后广播 publicMessage。
13. 写入 event log。

---

## 8. 功能需求

### 8.1 房间系统

#### P0

- 创建房间。
- 加入房间。
- 唯一邀请链接。
- Host 身份。
- 玩家昵称。
- 房间内实时消息同步。
- 房间状态持久化。

#### P1

- 房间密码。
- 玩家断线重连。
- 观众模式。
- 房间归档。

#### P2

- 房间大厅。
- 公开招募。
- 匹配系统。

---

### 8.2 聊天与消息系统

#### P0

- 公共聊天频道。
- AI DM 消息。
- 玩家消息。
- 系统消息。
- 骰子消息。
- 消息时间戳。
- 消息作者标识。
- 消息事件写入日志。

#### P1

- AI 对单个玩家私聊。
- Host 私密频道。
- 消息引用。
- 消息撤回。
- 消息编辑。

---

### 8.3 角色卡 MVP

#### P0 字段

```ts
type Dnd5eCharacter = {
  id: string;
  playerId: string;
  name: string;
  ancestry?: string;
  className: string;
  level: number;
  abilities: {
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;
  };
  proficiencyBonus: number;
  armorClass: number;
  hitPoints: {
    current: number;
    max: number;
    temporary: number;
  };
  speed: number;
  savingThrowProficiencies: AbilityKey[];
  skillProficiencies: SkillKey[];
  attacks: Attack[];
  spells: SpellRef[];
  inventory: ItemRef[];
  conditions: ConditionRef[];
};
```

#### P0 能力

- 手动创建 1 级角色。
- 自动计算属性修正值。
- 自动计算熟练加值。
- 管理 HP、AC、速度。
- 标记技能熟练。
- 添加武器攻击。
- 添加少量法术引用。

#### P1

- 从 JSON 导入角色。
- 预设职业模板。
- 自动生成新手角色。
- 长休/短休恢复。

#### P2

- 完整角色创建器。
- 升级系统。
- 多职业。
- 专长。
- 复杂职业特性。

---

### 8.4 SRD 规则包

#### P0

系统需要内置一个可查询、可结构化执行的 SRD 规则包。

规则包包含两类数据：

1. **CompendiumEntry**：用于解释、引用、检索。
2. **StructuredRuleData**：用于规则执行。

```ts
type CompendiumEntry = {
  id: string;
  type: "rule" | "condition" | "action" | "spell" | "monster" | "item" | "class";
  name: string;
  normalizedName: string;
  source: string;
  license: string;
  sectionPath: string[];
  rawText: string;
  summary: string;
  structuredData?: Record<string, unknown>;
  tags: string[];
};
```

#### P0 范围

- 能力检定。
- 技能检定。
- 豁免。
- 熟练加值。
- 优势/劣势。
- 攻击检定。
- 伤害。
- AC。
- HP。
- 先攻。
- 回合与行动。
- 移动。
- 状态条件。
- 死亡豁免。
- 短休/长休简化。
- 常用 SRD 怪物。
- 常用 SRD 武器。
- 常用 SRD 法术查询。

#### P1

- 更多法术结构化。
- 更多怪物能力结构化。
- 装备与物品效果。
- 环境规则。

---

### 8.5 规则引擎

规则引擎负责确定性结算，不由 AI 自行计算关键结果。

#### P0 API

```ts
type AdvantageState = "normal" | "advantage" | "disadvantage";

function rollAbilityCheck(input: {
  characterId: string;
  ability: AbilityKey;
  skill?: SkillKey;
  dc: number;
  advantage: AdvantageState;
  reason: string;
}): RollResult;

function rollSavingThrow(input: {
  characterId: string;
  ability: AbilityKey;
  dc: number;
  advantage: AdvantageState;
  reason: string;
}): RollResult;

function rollAttack(input: {
  attackerId: string;
  targetId: string;
  attackId: string;
  advantage: AdvantageState;
  reason: string;
}): AttackResult;

function rollDamage(input: {
  attackerId: string;
  targetId: string;
  damageFormula: string;
  damageType?: string;
  critical?: boolean;
}): DamageResult;

function applyDamage(input: {
  targetId: string;
  amount: number;
  damageType?: string;
}): StatePatch;

function heal(input: {
  targetId: string;
  amount: number;
}): StatePatch;

function applyCondition(input: {
  targetId: string;
  conditionId: string;
  duration?: string;
}): StatePatch;

function removeCondition(input: {
  targetId: string;
  conditionId: string;
}): StatePatch;
```

#### P0 规则原则

- 骰子必须由系统产生随机结果。
- 骰子结果必须写入 event log。
- AI 可以建议 DC 和检定类型，但 Host 可以修改。
- 命中、伤害、HP、状态由系统记录。
- 所有关键状态变化可回放。

---

### 8.6 冒险导入器

#### P0：结构化 Markdown 导入

第一版主推结构化 Markdown。

示例格式：

```md
# Adventure: The Lantern Beneath the Hill

## Metadata
Ruleset: 5e-srd-5.2.1
Level: 1
Players: 2-4
Estimated Time: 90 minutes

## Synopsis
A village lantern has gone dark, and something beneath the old hill has awakened.

## Truth
The mayor secretly made a pact with a goblin warlock.
This section is DM-only.

## Scene: Village Square
ID: village_square
Visibility: public

### Read Aloud
Morning fog hangs over the wet cobblestones...

### DM Notes
The old well leads to the buried shrine.

### Clues
- C1: Muddy goblin tracks near the well.
- C2: The mayor avoids mentioning the old shrine.

### NPCs
- mayor_elric

### Exits
- old_well
- tavern

## Encounter: Goblins at the Well
ID: goblins_well
Location: old_well
Trigger: Players inspect the well at night.
Monsters:
- goblin x2
Tactics: They flee if reduced to half numbers.
```

#### P0 导入结果

```ts
type AdventureModule = {
  id: string;
  title: string;
  rulesetId: string;
  recommendedLevel: string;
  playerCount: string;
  estimatedTime: string;
  synopsis: string;
  startingSceneId: string;
  truth: Secret[];
  scenes: Scene[];
  locations: Location[];
  npcs: NPC[];
  encounters: Encounter[];
  clues: Clue[];
  treasure: Treasure[];
  endings: Ending[];
};
```

#### P1：PDF 半自动导入

PDF 导入作为实验功能，不承诺一键完美。

流程：

1. 用户上传 PDF。
2. 系统提取文本。
3. 系统识别章节、场景、NPC、怪物、宝藏、read-aloud text、DM-only 信息。
4. 生成模块草稿。
5. Host 在导入审核页确认和修正。
6. 确认后才能进入房间。

PDF 导入必须有人工审核，不直接运行。

---

### 8.7 冒险模块数据结构

```ts
type Visibility = "public" | "dm_only" | "revealed" | "player_specific";

type Scene = {
  id: string;
  title: string;
  publicDescription: string;
  readAloud?: string;
  dmNotes: string;
  visibility: Visibility;
  locationIds: string[];
  npcIds: string[];
  encounterIds: string[];
  clueIds: string[];
  treasureIds: string[];
  secretIds: string[];
  exits: SceneExit[];
  triggers: Trigger[];
};

type Clue = {
  id: string;
  title: string;
  publicText: string;
  dmOnlyText?: string;
  visibility: Visibility;
  revealCondition?: string;
  status: "hidden" | "revealed" | "spent";
  sourceRef?: SourceRef;
};

type NPC = {
  id: string;
  name: string;
  publicDescription: string;
  dmOnlyMotivation?: string;
  currentLocationId?: string;
  attitude: "friendly" | "neutral" | "hostile" | "afraid";
  status: "active" | "missing" | "dead" | "escaped";
  statBlockId?: string;
};

type Encounter = {
  id: string;
  title: string;
  locationId: string;
  monsters: {
    monsterId: string;
    count: number;
    initialDisposition: "hostile" | "neutral" | "hidden" | "fleeing";
  }[];
  tactics: string;
  triggerCondition: string;
  victoryCondition: string;
  treasureIds: string[];
};
```

---

### 8.8 AI DM Orchestrator

AI DM 不直接输出纯文本，而是输出结构化 JSON，由系统校验后执行。

#### P0 输入上下文

- System prompt：AI DM 行为规则。
- 当前规则包 ID。
- 当前场景 public 信息。
- 当前场景 DM-only 信息。
- 已揭示线索。
- 未揭示线索摘要。
- 当前 NPC 状态。
- 当前玩家角色状态。
- 当前战斗状态。
- 最近 20 条消息。
- 相关 SRD 规则检索结果。
- 相关冒险模块内容。
- Host 设置：严格模式/即兴模式/审核模式。

#### P0 输出格式

```ts
type AIDMOutput = {
  publicMessage: string;
  privateMessages: {
    playerId: string;
    message: string;
  }[];
  requestedRolls: RollRequest[];
  rulesCitations: RuleCitation[];
  statePatch: StatePatch;
  revealClues: string[];
  startEncounterId?: string;
  endEncounter?: boolean;
  sceneChange?: {
    fromSceneId: string;
    toSceneId: string;
    reason: string;
  };
  dmNote: string;
  riskFlags: RiskFlag[];
};
```

#### P0 行为约束

AI DM 必须：

- 只向玩家讲述 public 或已揭示信息。
- 使用 DM-only 信息指导表现，但不能直接泄露。
- 对关键行动请求检定或交给 Host 决定。
- 不能自行伪造骰子结果。
- 不能擅自改变 HP、AC、状态、物品、线索状态，必须通过 statePatch。
- 不确定规则时检索规则，不凭空编造。
- 不确定剧情推进时给 Host 一个建议，而不是硬推进。

---

### 8.9 防剧透检查

#### P0

系统在 AI 输出后、广播前执行防剧透检查。

检查内容：

- `publicMessage` 是否包含未 reveal 的 clue 文本。
- `publicMessage` 是否包含 secret/truth 内容。
- `publicMessage` 是否暴露 NPC 的 dmOnlyMotivation。
- `publicMessage` 是否直接说出隐藏陷阱、隐藏门、最终反派。
- `privateMessages` 是否只发送给目标玩家。
- `revealClues` 是否满足 revealCondition 或 Host 审核。

风险等级：

```ts
type RiskFlag = {
  type: "spoiler" | "rule_hallucination" | "state_conflict" | "unsafe_state_patch";
  severity: "low" | "medium" | "high";
  message: string;
  relatedEntityIds: string[];
};
```

处理策略：

- low：正常发送，记录。
- medium：发送前提示 Host。
- high：默认拦截，必须 Host 审核。

---

### 8.10 Session State

Session State 是系统事实来源，不依赖模型记忆。

```ts
type Dnd5eSessionState = {
  sessionId: string;
  roomId: string;
  adventureModuleId: string;
  rulesetId: string;
  currentSceneId: string;
  partyLocationId?: string;
  characters: Record<string, CharacterState>;
  npcs: Record<string, NPCState>;
  monsters: Record<string, MonsterState>;
  discoveredClues: string[];
  hiddenClues: string[];
  revealedSecrets: string[];
  sharedInventory: ItemRef[];
  combat?: CombatState;
  flags: Record<string, unknown>;
  timeline: TimelineEvent[];
};
```

所有关键变化都应写入 event log。

```ts
type SessionEvent =
  | { type: "player_message"; playerId: string; text: string; createdAt: string }
  | { type: "ai_dm_message"; text: string; citations?: RuleCitation[]; createdAt: string }
  | { type: "host_message"; text: string; createdAt: string }
  | { type: "dice_roll"; roll: RollResult; createdAt: string }
  | { type: "state_patch"; patch: StatePatch; reason: string; createdAt: string }
  | { type: "clue_revealed"; clueId: string; reason: string; createdAt: string }
  | { type: "scene_change"; from: string; to: string; reason: string; createdAt: string }
  | { type: "combat_started"; encounterId: string; createdAt: string }
  | { type: "combat_ended"; encounterId: string; createdAt: string };
```

---

### 8.11 战斗系统 MVP

#### P0

- 开始遭遇。
- 创建参战者。
- 掷先攻。
- 展示回合顺序。
- 当前行动者标记。
- 攻击检定。
- 伤害结算。
- HP 变化。
- 状态条件。
- 怪物死亡/角色倒地。
- 结束遭遇。

```ts
type CombatState = {
  encounterId: string;
  round: number;
  turnIndex: number;
  combatants: Combatant[];
  status: "active" | "ended";
};

type Combatant = {
  id: string;
  entityType: "character" | "npc" | "monster";
  entityId: string;
  initiative: number;
  armorClass: number;
  hitPoints: {
    current: number;
    max: number;
    temporary: number;
  };
  conditions: string[];
  isDefeated: boolean;
};
```

#### P1

- 反应。
- 集中。
- 机会攻击。
- 地形。
- 范围法术。
- 网格移动。

---

### 8.12 Host 面板

Host 面板是 MVP 的安全绳。

#### P0 区域

1. 当前场景
   - public description
   - read-aloud text
   - DM notes
   - exits

2. 剧本秘密
   - truth
   - hidden clues
   - NPC motivations
   - traps

3. 玩家状态
   - HP
   - AC
   - 条件
   - 技能熟练
   - 物品

4. NPC / 怪物状态
   - 位置
   - 态度
   - HP
   - 战术

5. AI 待审输出
   - publicMessage
   - requestedRolls
   - statePatch
   - riskFlags

6. 操作按钮
   - 发送 AI 输出
   - 编辑 AI 输出
   - 撤回上一条 AI 输出
   - 手动揭示线索
   - 手动切换场景
   - 开始遭遇
   - 结束遭遇
   - 暂停 AI

#### P1

- AI 下一步建议。
- 规则引用侧栏。
- 一键生成 NPC 台词。
- 一键 recap 当前场景。

---

### 8.13 日志与回放

#### P0

- 所有消息写入日志。
- 所有骰子写入日志。
- 所有状态变化写入日志。
- 所有线索揭示写入日志。
- 所有战斗开始/结束写入日志。
- 支持导出 Markdown recap。

#### P1

- 完整 session replay。
- 分玩家视角回放。
- Host 审计视图。

---

## 9. 信息架构与页面设计

### 9.1 玩家房间页

布局建议：

```txt
┌──────────────────────────────────────────────┐
│ 顶部：房间名 / 冒险名 / 当前规则包 / 状态       │
├───────────────┬─────────────────┬────────────┤
│ 左侧           │ 中间聊天区        │ 右侧信息栏  │
│ 玩家列表       │ AI DM / 玩家消息   │ 角色状态    │
│ 角色摘要       │ 骰子结果          │ 已发现线索  │
│ 战斗顺序       │ 系统提示          │ 当前场景    │
├───────────────┴─────────────────┴────────────┤
│ 底部：输入框 / 行动按钮 / 掷骰按钮               │
└──────────────────────────────────────────────┘
```

### 9.2 Host 面板页

布局建议：

```txt
┌──────────────────────────────────────────────┐
│ 顶部：Host Controls / AI 模式 / 暂停 AI         │
├──────────────┬──────────────────┬────────────┤
│ 剧本树        │ 当前房间实时画面    │ DM 控制区   │
│ 场景          │ 聊天与事件日志      │ 待审输出    │
│ NPC           │                  │ 状态修改    │
│ 遭遇          │                  │ 规则引用    │
│ 线索          │                  │ 风险提示    │
└──────────────┴──────────────────┴────────────┘
```

### 9.3 冒险导入审核页

布局建议：

```txt
┌──────────────────────────────────────────────┐
│ 上传文件 / 导入进度 / 错误提示                  │
├──────────────┬──────────────────┬────────────┤
│ 原文预览      │ 识别出的结构       │ 编辑表单     │
│              │ scenes           │ public/dm   │
│              │ npcs             │ visibility  │
│              │ encounters       │ triggers    │
│              │ clues            │             │
└──────────────┴──────────────────┴────────────┘
```

---

## 10. AI 行为模式

### 10.1 Strict Mode：严格按剧本

适合首次内测和官方 Demo。

行为：

- 不主动新增关键剧情。
- 不新增核心 NPC。
- 不改变谜底。
- 不跳过场景。
- 对不确定内容提示 Host。

### 10.2 Flexible Mode：允许小幅即兴

适合玩家跑偏时。

行为：

- 可以补充氛围细节。
- 可以生成临时 NPC 小台词。
- 可以为失败检定生成代价。
- 不可改变核心秘密和主线结构。

### 10.3 Wild Mode：高自由即兴

MVP 不建议默认启用。

行为：

- 允许大幅扩写支线。
- 适合 sandbox。
- 风险高，需要 Host 明确开启。

---

## 11. 技术架构建议

### 11.1 前端

推荐：

- Next.js / React
- TypeScript
- WebSocket 客户端
- Markdown 渲染
- 简单状态管理：Zustand / Redux Toolkit

### 11.2 后端

推荐：

- Node.js + NestJS，或 Python + FastAPI
- WebSocket / Socket.IO
- REST API 用于房间、导入、角色、日志
- LLM Orchestrator 服务
- Rules Engine 服务

### 11.3 数据库

MVP 推荐：

- PostgreSQL
- pgvector 用于规则/剧本检索
- Redis 可选，用于房间实时状态缓存

核心表：

```txt
users
rooms
room_players
characters
adventure_modules
module_scenes
module_npcs
module_clues
module_encounters
srd_compendium_entries
sessions
session_state
session_events
messages
dice_rolls
combat_states
```

### 11.4 文件存储

- 本地存储 / S3 / R2 / MinIO
- 用户上传文件应私有化存储
- 文件与房间/用户绑定

### 11.5 LLM 接入

MVP 支持 OpenAI-compatible API 即可。

需预留：

- 模型供应商切换
- 本地模型接入
- 不同任务不同模型
- JSON schema 输出校验
- 重试与降级策略

---

## 12. API 草案

### 12.1 Room API

```http
POST /api/rooms
GET /api/rooms/:roomId
POST /api/rooms/:roomId/join
POST /api/rooms/:roomId/start
POST /api/rooms/:roomId/pause-ai
POST /api/rooms/:roomId/resume-ai
```

### 12.2 Character API

```http
POST /api/rooms/:roomId/characters
GET /api/rooms/:roomId/characters
PATCH /api/characters/:characterId
```

### 12.3 Adventure API

```http
POST /api/adventures/import/markdown
POST /api/adventures/import/pdf
GET /api/adventures/:adventureId
PATCH /api/adventures/:adventureId
POST /api/adventures/:adventureId/confirm
```

### 12.4 AI DM API

```http
POST /api/rooms/:roomId/ai/respond
POST /api/rooms/:roomId/ai/regenerate
POST /api/rooms/:roomId/ai/review-output
```

### 12.5 Rules API

```http
POST /api/rules/ability-check
POST /api/rules/saving-throw
POST /api/rules/attack
POST /api/rules/damage
POST /api/rules/initiative
POST /api/rules/condition/apply
POST /api/rules/condition/remove
GET /api/rules/search?q=
```

### 12.6 Session API

```http
GET /api/rooms/:roomId/session-state
PATCH /api/rooms/:roomId/session-state
GET /api/rooms/:roomId/events
POST /api/rooms/:roomId/recap
```

---

## 13. WebSocket 事件草案

```ts
type ClientToServerEvent =
  | { type: "player_message"; roomId: string; text: string }
  | { type: "host_command"; roomId: string; command: HostCommand }
  | { type: "roll_confirmed"; roomId: string; rollRequestId: string }
  | { type: "combat_action"; roomId: string; action: CombatAction };

type ServerToClientEvent =
  | { type: "message_created"; message: Message }
  | { type: "dice_rolled"; result: RollResult }
  | { type: "state_updated"; patch: StatePatch }
  | { type: "ai_output_pending_review"; output: AIDMOutput }
  | { type: "clue_revealed"; clue: Clue }
  | { type: "combat_updated"; combat: CombatState }
  | { type: "scene_changed"; scene: Scene };
```

---

## 14. 数据安全与隐私

### 14.1 P0

- 用户上传内容默认私有。
- 房间 ID 不应可枚举。
- Host 才能查看 DM-only 信息。
- 玩家只能查看 public/revealed/player_specific 给自己的内容。
- 服务端控制权限，不依赖前端隐藏。
- API 返回内容必须按角色过滤。

### 14.2 P1

- 房间密码。
- 上传文件删除。
- Session 删除。
- 导出数据。
- 模型调用日志脱敏。

---

## 15. 关键指标

### 15.1 体验指标

- 完成一局短团的比例。
- 玩家平均每分钟发言数。
- AI 平均响应时间。
- Host 手动介入次数。
- AI 输出被撤回/改写比例。
- 剧透风险拦截次数。
- 玩家满意度。
- Host 感知减负比例。

### 15.2 技术指标

- WebSocket 断连率。
- 消息同步延迟。
- AI JSON 输出解析成功率。
- 规则工具调用成功率。
- 状态 patch 应用成功率。
- 骰子日志完整率。
- 防剧透误报/漏报比例。

### 15.3 MVP 成功阈值建议

- 3 场内测中至少 2 场能完整跑完。
- AI 严重剧透次数为 0。
- 每场 Host 强制接管次数不超过 5 次。
- 规则严重错误不超过 3 次/场。
- 至少 70% 玩家愿意再玩。
- Host 认为“比纯人工主持更轻松”或“至少值得继续试”。

---

## 16. 风险与应对

### 16.1 AI 剧透

风险：AI 读取 DM-only 信息后提前说出真相。

应对：

- 所有内容标记 visibility。
- publicMessage 发送前做防剧透检查。
- 高风险输出必须 Host 审核。
- Strict Mode 默认开启。

### 16.2 规则幻觉

风险：AI 胡编 D&D 规则，或混用不同版本。

应对：

- 规则引擎做确定性结算。
- AI 必须通过 rules API 请求检定和攻击。
- 规则查询只检索当前 ruleset。
- Host 可修改 DC 和判定。

### 16.3 PDF 导入质量差

风险：PDF 排版复杂导致场景、NPC、遭遇识别错误。

应对：

- MVP 主推结构化 Markdown。
- PDF 标记为实验功能。
- 导入后必须人工审核。
- 提供导入模板和错误提示。

### 16.4 Host 负担过重

风险：Host 需要不断修正 AI，反而更累。

应对：

- 默认只做短冒险。
- 限制 AI 即兴范围。
- 提供一键通过/编辑/撤回。
- 提供清晰状态面板。

### 16.5 D&D 内容授权风险

风险：不小心内置或分发非 SRD 官方内容。

应对：

- 内置内容仅来自 SRD。
- 用户上传内容私有化。
- 不做公共官方模块。
- 不做 D&D Beyond 同步。
- 后续商业化前法律复核。

### 16.6 多人输入混乱

风险：多个玩家同时发言，AI 不知道先处理谁。

应对：

- 自由探索时按消息顺序聚合处理。
- 战斗时只处理当前行动者。
- Host 可锁定发言阶段。
- AI 可询问“你们要先执行哪一个行动？”

---

## 17. 开发里程碑

### Milestone 0：文档与 Demo 内容

产出：

- MVP PRD。
- 内容边界文档。
- 结构化 Markdown 冒险模板。
- 自制 1 级短冒险。
- SRD 规则包字段设计。

验收：

- 可以用纸面方式模拟一局。
- 冒险模块结构完整。

### Milestone 1：基础多人房间

产出：

- 创建房间。
- 玩家加入。
- 公共聊天。
- WebSocket 同步。
- 角色创建 MVP。

验收：

- 2–4 人可在同一房间实时聊天。
- 角色状态可展示。

### Milestone 2：规则与骰子

产出：

- d20 骰子系统。
- 能力/技能检定。
- 攻击/伤害。
- 先攻。
- HP 状态。
- 骰子日志。

验收：

- 可以完成一次检定和一次基础攻击结算。

### Milestone 3：冒险模块与 Host 面板

产出：

- Markdown 冒险导入。
- 场景/NPC/线索/遭遇结构化展示。
- Host 面板。
- 手动揭示线索。
- 手动切换场景。

验收：

- Host 能查看 DM-only 信息。
- 玩家只能看到 public/revealed 信息。

### Milestone 4：AI DM Orchestrator

产出：

- AI DM 结构化输出。
- 防剧透检查。
- AI 生成开场。
- AI 请求检定。
- AI 建议状态 patch。
- Host 审核流。

验收：

- AI 可以主持前 15 分钟探索流程。
- 高风险输出能被拦截。

### Milestone 5：战斗与完整内测

产出：

- 遭遇开始/结束。
- 回合顺序。
- 怪物攻击。
- 角色倒地。
- 战斗结束奖励。
- Recap 生成。

验收：

- 完成一场 60–90 分钟 one-shot 内测。

---

## 18. 推荐首个 Demo 冒险

### 18.1 冒险名

**The Lantern Beneath the Hill / 山丘下的灯火**

### 18.2 基本信息

- 规则：D&D 5e SRD 5.2.1
- 等级：1
- 人数：2–4
- 时长：60–90 分钟
- 类型：调查 + 小型地城 + 简单战斗

### 18.3 场景

1. 雾中的村庄广场
2. 村长家
3. 老井
4. 山丘下的废弃祭坛
5. 地精术士的藏身处

### 18.4 NPC

- 村长 Elric：表面焦虑，实际隐瞒旧契约。
- 灯塔守夜人 Mara：知道老井的传说。
- 地精术士 Grib：试图重新点燃地下祭坛。

### 18.5 遭遇

- 老井边的 2 只 goblin。
- 地下祭坛的 skeleton。
- 最终对峙：goblin boss / goblin warlock-like NPC，可用 SRD 怪物改皮但不引入非 SRD 内容。

### 18.6 核心秘密

村长多年前为了保护村庄，与地下怪物达成契约。现在契约失效，村庄灯火熄灭，怪物索要新的代价。

### 18.7 胜利条件

- 找到契约真相。
- 阻止地下祭坛重启。
- 或与怪物重新谈判代价。

---

## 19. 验收测试清单

### 19.1 房间

- [ ] Host 可以创建房间。
- [ ] 玩家可以通过链接加入。
- [ ] 消息实时同步。
- [ ] 玩家断线后可重新进入。

### 19.2 角色

- [ ] 玩家可以创建 1 级角色。
- [ ] 属性修正值计算正确。
- [ ] 技能熟练计算正确。
- [ ] HP / AC 展示正确。

### 19.3 规则

- [ ] 能力检定正确。
- [ ] 技能检定正确。
- [ ] 优势/劣势正确。
- [ ] 攻击命中判断正确。
- [ ] 伤害结算正确。
- [ ] 先攻顺序正确。

### 19.4 冒险

- [ ] Markdown 导入成功。
- [ ] 场景识别成功。
- [ ] NPC 识别成功。
- [ ] 遭遇识别成功。
- [ ] 线索识别成功。
- [ ] DM-only 信息不显示给玩家。

### 19.5 AI DM

- [ ] AI 能生成开场白。
- [ ] AI 能根据玩家行动回应。
- [ ] AI 能请求检定。
- [ ] AI 能根据骰子结果叙述后果。
- [ ] AI 不提前泄露核心秘密。
- [ ] AI 输出 JSON 可解析。

### 19.6 Host

- [ ] Host 能查看 DM-only 信息。
- [ ] Host 能编辑 AI 输出。
- [ ] Host 能撤回 AI 输出。
- [ ] Host 能揭示线索。
- [ ] Host 能切换场景。
- [ ] Host 能开始/结束战斗。

### 19.7 Recap

- [ ] 能生成战报。
- [ ] 包含关键事件。
- [ ] 包含关键骰子。
- [ ] 包含发现线索。
- [ ] 包含奖励和后续悬念。

---

## 20. Open Questions

1. 第一版默认规则包选择 SRD 5.2.1，是否同时支持 SRD 5.1 查询？
2. 角色创建是手动表单优先，还是提供预生成角色优先？
3. AI DM 默认输出是否每条都要 Host 审核，还是仅风险输出审核？
4. 战斗是否需要地图/token，还是第一版纯文本战斗？
5. PDF 导入是否进入 MVP，还是放入 P1？
6. 是否支持玩家私聊 AI DM？
7. 是否允许 AI 主动控制怪物战术，还是 Host 批准怪物行动？
8. 首个 Demo 冒险是否使用英文、中文，还是双语？
9. LLM 供应商如何配置？是否支持用户自带 API key？
10. 是否开源核心规则引擎或冒险模板格式？

---

## 21. 下一步建议

优先做四件事：

1. **确定内容边界**：只内置 SRD，不内置非 SRD 官方内容。
2. **写 Demo 冒险**：使用结构化 Markdown 写《山丘下的灯火》。
3. **实现规则最小闭环**：能力检定、攻击、伤害、先攻、HP。
4. **实现多人房间 + Host 面板骨架**：即使 UI 丑，也要能控制状态和防剧透。

第一版不要追求“像 Roll20”，而要追求：

> **这是否真的能让 2–4 个玩家在 AI DM 带领下跑完一场 D&D 5e-compatible 短冒险。**

只要这个问题答案是“能”，TableMind 就有继续投入的价值。
