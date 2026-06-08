export function generateSessionRecap(input) {
  if (!["player", "host"].includes(input.viewerRole)) {
    throw new Error(`Unsupported viewerRole: ${input.viewerRole}`);
  }

  const labels = recapLabels(input.locale);
  const title = labels.title(input.adventure.title);
  const audience = input.viewerRole;
  const events = projectEventsForRecap(input.events ?? [], input.viewerRole);
  const timeline = buildTimeline(events, labels);
  const keyRolls = buildKeyRolls(events);
  const discoveredClues = buildDiscoveredClues(input);
  const combatOutcomes = buildCombatOutcomes(events, labels);
  const rewards = publicListFlag(input.sessionState.flags?.rewards);
  const characterStates = buildCharacterStates(input.sessionState);
  const unresolvedThreads =
    input.viewerRole === "host" ? buildUnresolvedThreads(input, labels) : undefined;
  const summary = buildSummary({
    discoveredClues,
    combatOutcomes,
    rewards,
    ending: input.sessionState.flags?.ending?.value,
    labels,
  });
  const recap = {
    title,
    audience,
    locale: labels.locale,
    summary,
    timeline,
    keyRolls,
    discoveredClues,
    combatOutcomes,
    rewards,
    characterStates,
    unresolvedThreads,
  };

  return {
    ...recap,
    markdown: renderMarkdown(recap, labels),
  };
}

function buildTimeline(events, labels) {
  return events.map((event) => ({
    eventId: event.id,
    type: event.type,
    createdAt: event.createdAt,
    text: timelineText(event, labels),
  }));
}

function timelineText(event, labels) {
  if (event.type === "scene.changed") {
    return labels.sceneChanged(event.sceneId);
  }
  if (event.type === "clue.revealed") {
    return labels.clueRevealed(event.clueId);
  }
  if (event.type === "dice.rolled") {
    if (event.check) {
      return checkText(event.check, labels);
    }
    return `${event.reason} (${event.roll.formula} = ${event.roll.total}).`;
  }
  if (event.type === "combat.started") {
    return labels.combatStarted(event.encounterId);
  }
  if (event.type === "damage.applied") {
    return labels.damageApplied(
      event.targetCombatantId,
      event.damageResult.amount,
      event.damageResult.resultingHp,
    );
  }
  if (event.type === "combat.ended") {
    return event.reason;
  }
  if (event.type === "player.message") {
    return event.message;
  }
  if (event.type === "ai.message") {
    return event.message;
  }
  if (event.type === "host.review.created") {
    return labels.reviewCreated(event.reviewItem.reason);
  }
  if (event.type === "host.review.updated") {
    return labels.reviewUpdated(event.action, event.reason ?? event.itemId);
  }
  if (event.type === "state.patch") {
    return event.reason;
  }
  return event.type;
}

function buildKeyRolls(events) {
  return events
    .filter((event) => event.type === "dice.rolled")
    .map((event) => {
      const roll = {
        eventId: event.id,
        formula: event.roll.formula,
        total: event.roll.total,
        reason: event.reason,
      };
      if (event.check) {
        roll.check = structuredClone(event.check);
      }
      return roll;
    });
}

function buildDiscoveredClues(input) {
  const clueById = new Map(input.adventure.clues.map((clue) => [clue.id, clue]));
  return input.sessionState.discoveredClueIds
    .map((clueId) => clueById.get(clueId))
    .filter(Boolean)
    .map((clue) => clue.title);
}

function buildCombatOutcomes(events, labels) {
  return events
    .filter((event) => ["combat.started", "damage.applied", "combat.ended"].includes(event.type))
    .map((event) => timelineText(event, labels));
}

function buildCharacterStates(sessionState) {
  return Object.values(sessionState.characters ?? {}).map(
    (character) =>
      `${character.name}: ${character.hitPoints.current}/${character.hitPoints.max} HP`,
  );
}

function buildUnresolvedThreads(input, labels) {
  const discovered = new Set(input.sessionState.discoveredClueIds);
  const secretThreads = (input.adventure.truth ?? []).map(
    (secret) => labels.secretThread(secret.title),
  );
  const clueThreads = (input.adventure.clues ?? [])
    .filter((clue) => !discovered.has(clue.id))
    .map((clue) => labels.unrevealedClueThread(clue.title));

  return [...secretThreads, ...clueThreads];
}

function buildSummary(input) {
  const parts = [];
  if (input.discoveredClues.length > 0) {
    parts.push(input.labels.discoveredSummary(input.discoveredClues.length));
  }
  if (input.combatOutcomes.length > 0) {
    parts.push(input.labels.combatSummary);
  }
  if (input.ending) {
    parts.push(input.labels.endingSummary(input.ending));
  }
  if (input.rewards.length > 0) {
    parts.push(input.labels.rewardsSummary(input.rewards));
  }
  return parts.join(" ");
}

function projectEventsForRecap(events, viewerRole) {
  if (viewerRole === "host") {
    return events.map((event) => structuredClone(event));
  }

  return events.filter(isPlayerSafeEvent).map(redactEventForPlayer);
}

function isPlayerSafeEvent(event) {
  if (event.visibility === "dm_only" || event.visibility === "player_specific") {
    return false;
  }
  if (event.type === "state.patch" || event.type === "host.override") {
    return false;
  }
  if (
    event.type === "ai.message" &&
    event.reviewStatus &&
    !["approved", "edited", "auto_approved"].includes(event.reviewStatus)
  ) {
    return false;
  }

  return [
    "player.message",
    "ai.message",
    "system.message",
    "dice.rolled",
    "scene.changed",
    "clue.revealed",
    "combat.started",
    "combat.turn_advanced",
    "combat.ended",
    "attack.resolved",
    "damage.applied",
  ].includes(event.type);
}

function redactEventForPlayer(event) {
  const output = structuredClone(event);
  delete output.patch;
  delete output.proposedPayload;
  delete output.privateNotes;
  delete output.dmNotes;
  if (output.type === "combat.started") {
    delete output.combat;
  }
  return output;
}

function renderMarkdown(recap, labels) {
  const sections = [
    `# ${recap.title}`,
    labels.audienceLine(recap.audience),
    "",
    `## ${labels.summaryHeading}`,
    recap.summary || labels.noMajorEvents,
    "",
    `## ${labels.timelineHeading}`,
    renderList(recap.timeline.map((item) => item.text), labels),
    "",
    `## ${labels.keyRollsHeading}`,
    renderList(recap.keyRolls.map((roll) => renderKeyRoll(roll, labels)), labels),
    "",
    `## ${labels.discoveredCluesHeading}`,
    renderList(recap.discoveredClues, labels),
    "",
    `## ${labels.combatOutcomesHeading}`,
    renderList(recap.combatOutcomes, labels),
    "",
    `## ${labels.characterStatesHeading}`,
    renderList(recap.characterStates, labels),
    "",
    `## ${labels.rewardsHeading}`,
    renderList(recap.rewards, labels),
  ];

  if (recap.unresolvedThreads) {
    sections.push("", `## ${labels.hostNotesHeading}`, renderList(recap.unresolvedThreads, labels));
  }

  return `${sections.join("\n")}\n`;
}

function renderKeyRoll(roll, labels) {
  if (roll.check) {
    return checkText(roll.check, labels);
  }
  return `${roll.reason}: ${roll.formula} = ${roll.total}`;
}

function checkText(check, labels) {
  const subject = check.skill ?? check.ability;
  const outcome = check.success ? labels.success : labels.failure;
  return `${check.reason}: ${check.requestType} ${subject} DC ${check.dc}${labels.inlineSeparator}d20 ${check.selectedD20}${labels.inlineSeparator}${labels.total} ${check.total}${labels.inlineSeparator}${outcome}${labels.sentenceEnd}`;
}

function renderList(items, labels) {
  if (!items || items.length === 0) {
    return `- ${labels.none}`;
  }
  return items.map((item) => `- ${item}`).join("\n");
}

function recapLabels(locale = "en") {
  if (locale === undefined || locale === null || locale === "" || locale === "en") {
    return enLabels;
  }
  if (locale === "zh-CN") {
    return zhCNLabels;
  }
  throw new Error(`Unsupported locale: ${locale}`);
}

const enLabels = {
  locale: "en",
  title: (adventureTitle) => `${adventureTitle} Recap`,
  audienceLine: (audience) => `Audience: ${audience}`,
  summaryHeading: "Summary",
  timelineHeading: "Timeline",
  keyRollsHeading: "Key Rolls",
  discoveredCluesHeading: "Discovered Clues",
  combatOutcomesHeading: "Combat Outcomes",
  characterStatesHeading: "Character States",
  rewardsHeading: "Rewards",
  hostNotesHeading: "Host Notes",
  noMajorEvents: "No major events recorded.",
  none: "None",
  success: "success",
  failure: "failure",
  total: "total",
  inlineSeparator: ", ",
  sentenceEnd: ".",
  sceneChanged: (sceneId) => `Scene changed to ${sceneId}.`,
  clueRevealed: (clueId) => `Clue revealed: ${clueId}.`,
  combatStarted: (encounterId) => `Combat started: ${encounterId}.`,
  damageApplied: (target, amount, hp) =>
    `${target} took ${amount} damage and ended at ${hp} HP.`,
  reviewCreated: (reason) => `Review created: ${reason}.`,
  reviewUpdated: (action, reason) => `Review ${action}: ${reason}.`,
  secretThread: (title) => `Secret: ${title}`,
  unrevealedClueThread: (title) => `Unrevealed clue: ${title}`,
  discoveredSummary: (count) => `Discovered ${count} clue(s).`,
  combatSummary: "Resolved a combat encounter.",
  endingSummary: (ending) => `Ending: ${ending}.`,
  rewardsSummary: (rewards) => `Rewards: ${rewards.join(", ")}.`,
};

const zhCNLabels = {
  locale: "zh-CN",
  title: (adventureTitle) => `${adventureTitle} 战报`,
  audienceLine: (audience) => `受众：${audience === "host" ? "主持" : "玩家"}`,
  summaryHeading: "摘要",
  timelineHeading: "时间线",
  keyRollsHeading: "关键骰子",
  discoveredCluesHeading: "已发现线索",
  combatOutcomesHeading: "战斗结果",
  characterStatesHeading: "角色状态",
  rewardsHeading: "奖励",
  hostNotesHeading: "主持备注",
  noMajorEvents: "暂无重要事件。",
  none: "无",
  success: "成功",
  failure: "失败",
  total: "总值",
  inlineSeparator: "，",
  sentenceEnd: "。",
  sceneChanged: (sceneId) => `场景切换至 ${sceneId}。`,
  clueRevealed: (clueId) => `线索已揭示：${clueId}。`,
  combatStarted: (encounterId) => `战斗开始：${encounterId}。`,
  damageApplied: (target, amount, hp) =>
    `${target} 受到 ${amount} 点伤害，剩余 ${hp} HP。`,
  reviewCreated: (reason) => `审核创建：${reason}。`,
  reviewUpdated: (action, reason) => `审核 ${action}：${reason}。`,
  secretThread: (title) => `秘密：${title}`,
  unrevealedClueThread: (title) => `未揭示线索：${title}`,
  discoveredSummary: (count) => `已发现 ${count} 条线索。`,
  combatSummary: "已完成一场战斗。",
  endingSummary: (ending) => `结局：${ending}。`,
  rewardsSummary: (rewards) => `奖励：${rewards.join(", ")}。`,
};

function publicListFlag(flag) {
  if (!flag || flag.visibility !== "public") {
    return [];
  }
  if (!Array.isArray(flag.value)) {
    throw new Error("public list flag must contain an array");
  }
  return flag.value;
}
