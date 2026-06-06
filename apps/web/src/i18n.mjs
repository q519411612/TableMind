export const SUPPORTED_LOCALES = ["en", "zh-CN"];

const en = {
  action: "Action",
  active: "Active",
  advanceTurn: "Advance Turn",
  ai: "AI",
  apply: "Apply",
  approve: "Approve",
  attack: "Attack",
  auditFeed: "Audit Feed",
  changeScene: "Change Scene",
  character: "Character",
  combat: "Combat",
  combatant: "Combatant",
  completeSession: "Complete Session",
  condition: "Condition",
  createFighter: "Create Fighter",
  createRoom: "Create Room",
  createRoomHeading: "Create room",
  createRoomToLoadAdventure: "Create a room to load the adventure.",
  currentHp: "Current HP",
  currentScene: "Current Scene",
  dice: "Dice",
  diceLog: "Dice Log",
  displayName: "Display name",
  edit: "Edit",
  ending: "Ending",
  failure: "failure",
  hostConsole: "Host Console",
  hostId: "Host ID",
  hostName: "Host name",
  hp: "HP",
  invite: "Invite",
  joinARoom: "Join a room",
  joinRoom: "Join Room",
  joinRoomToSeeScene: "Join a room to see the scene.",
  language: "Language",
  level: "level",
  loadDemoAdventure: "Load Demo Adventure",
  message: "Message",
  noActiveCombat: "No active combat.",
  noActiveRoom: "No active room.",
  noCharacter: "No character",
  noCharacterYet: "No character yet.",
  noDiceRolledYet: "No dice rolled yet.",
  noPendingReviewItems: "No pending review items.",
  noPlayersYet: "No players yet.",
  noPublicEventsYet: "No public events yet.",
  noRecapYet: "No recap yet.",
  openHostConsole: "Open Host Console",
  openPlayerRoom: "Open Player Room",
  patchCondition: "Patch Condition",
  patchHp: "Patch HP",
  pauseAi: "Pause AI",
  paused: "Paused",
  player: "Player",
  playerRoom: "Player Room",
  players: "Players",
  publicFeed: "Public Feed",
  recap: "Recap",
  refresh: "Refresh",
  reject: "Reject",
  remove: "Remove",
  resumeAi: "Resume AI",
  reveal: "Reveal",
  revealClue: "Reveal Clue",
  reviewQueue: "Review Queue",
  room: "Room",
  roomConsole: "Room Console",
  roomId: "Room ID",
  round: "Round",
  runAi: "Run AI",
  scene: "Scene",
  send: "Send",
  startEncounter: "Start Encounter",
  startSession: "Start Session",
  success: "success",
  system: "System",
  target: "Target",
  total: "total",
};

const zhCN = {
  action: "操作",
  active: "当前",
  advanceTurn: "推进回合",
  ai: "AI",
  apply: "施加",
  approve: "批准",
  attack: "攻击",
  auditFeed: "审计动态",
  changeScene: "切换场景",
  character: "角色",
  combat: "战斗",
  combatant: "战斗单位",
  completeSession: "完成团局",
  condition: "状态",
  createFighter: "创建战士角色",
  createRoom: "创建房间",
  createRoomHeading: "创建房间",
  createRoomToLoadAdventure: "创建房间后加载冒险。",
  currentHp: "当前生命值",
  currentScene: "当前场景",
  dice: "骰子",
  diceLog: "骰子记录",
  displayName: "显示名称",
  edit: "编辑",
  ending: "结局",
  failure: "失败",
  hostConsole: "主持控制台",
  hostId: "主持 ID",
  hostName: "主持名称",
  hp: "HP",
  invite: "邀请链接",
  joinARoom: "加入房间",
  joinRoom: "加入房间",
  joinRoomToSeeScene: "加入房间后查看场景。",
  language: "语言",
  level: "等级",
  loadDemoAdventure: "加载 Demo 冒险",
  message: "消息",
  noActiveCombat: "暂无进行中的战斗。",
  noActiveRoom: "暂无活跃房间。",
  noCharacter: "暂无角色",
  noCharacterYet: "还没有角色。",
  noDiceRolledYet: "还没有骰子记录。",
  noPendingReviewItems: "暂无待审核项目。",
  noPlayersYet: "还没有玩家。",
  noPublicEventsYet: "暂无公开动态。",
  noRecapYet: "暂无战报。",
  openHostConsole: "打开主持控制台",
  openPlayerRoom: "打开玩家房间",
  patchCondition: "调整状态",
  patchHp: "调整生命值",
  pauseAi: "暂停 AI",
  paused: "已暂停",
  player: "玩家",
  playerRoom: "玩家房间",
  players: "玩家",
  publicFeed: "公共动态",
  recap: "战报",
  refresh: "刷新",
  reject: "拒绝",
  remove: "移除",
  resumeAi: "恢复 AI",
  reveal: "揭示",
  revealClue: "揭示线索",
  reviewQueue: "审核队列",
  room: "房间",
  roomConsole: "房间控制台",
  roomId: "房间 ID",
  round: "轮次",
  runAi: "运行 AI",
  scene: "场景",
  send: "发送",
  startEncounter: "开始遭遇",
  startSession: "开始团局",
  success: "成功",
  system: "系统",
  target: "目标",
  total: "总值",
};

const dictionaries = {
  en,
  "zh-CN": zhCN,
};

export function resolveLocale(value) {
  if (value === undefined || value === null || value === "") {
    return "en";
  }
  if (!SUPPORTED_LOCALES.includes(value)) {
    throw new Error(`Unsupported locale: ${value}`);
  }
  return value;
}

export function uiText(locale) {
  return dictionaries[resolveLocale(locale)];
}

export function renderLanguageSwitcher(locale) {
  const activeLocale = resolveLocale(locale);
  const labels = uiText(activeLocale);

  return `
    <div class="tm-language-switcher" data-language-switcher>
      <span>${labels.language}</span>
      ${SUPPORTED_LOCALES.map(
        (candidate) => `
          <button type="button" data-action="set-language" data-locale="${candidate}" aria-pressed="${String(
            candidate === activeLocale,
          )}">${candidate === "zh-CN" ? "中文" : "English"}</button>
        `,
      ).join("")}
    </div>
  `;
}
