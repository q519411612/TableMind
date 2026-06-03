export function generateSessionRecap(input) {
  if (!["player", "host"].includes(input.viewerRole)) {
    throw new Error(`Unsupported viewerRole: ${input.viewerRole}`);
  }

  const title = `${input.adventure.title} Recap`;
  const audience = input.viewerRole;
  const events = projectEventsForRecap(input.events ?? [], input.viewerRole);
  const timeline = buildTimeline(events);
  const keyRolls = buildKeyRolls(events);
  const discoveredClues = buildDiscoveredClues(input);
  const combatOutcomes = buildCombatOutcomes(events);
  const rewards = publicListFlag(input.sessionState.flags?.rewards);
  const characterStates = buildCharacterStates(input.sessionState);
  const unresolvedThreads =
    input.viewerRole === "host" ? buildUnresolvedThreads(input) : undefined;
  const summary = buildSummary({
    discoveredClues,
    combatOutcomes,
    rewards,
    ending: input.sessionState.flags?.ending?.value,
  });
  const recap = {
    title,
    audience,
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
    markdown: renderMarkdown(recap),
  };
}

function buildTimeline(events) {
  return events.map((event) => ({
    eventId: event.id,
    type: event.type,
    createdAt: event.createdAt,
    text: timelineText(event),
  }));
}

function timelineText(event) {
  if (event.type === "scene.changed") {
    return `Scene changed to ${event.sceneId}.`;
  }
  if (event.type === "clue.revealed") {
    return `Clue revealed: ${event.clueId}.`;
  }
  if (event.type === "dice.rolled") {
    return `${event.reason} (${event.roll.formula} = ${event.roll.total}).`;
  }
  if (event.type === "combat.started") {
    return `Combat started: ${event.encounterId}.`;
  }
  if (event.type === "damage.applied") {
    return `${event.targetCombatantId} took ${event.damageResult.amount} damage and ended at ${event.damageResult.resultingHp} HP.`;
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
    return `Review created: ${event.reviewItem.reason}.`;
  }
  if (event.type === "host.review.updated") {
    return `Review ${event.action}: ${event.reason ?? event.itemId}.`;
  }
  if (event.type === "state.patch") {
    return event.reason;
  }
  return event.type;
}

function buildKeyRolls(events) {
  return events
    .filter((event) => event.type === "dice.rolled")
    .map((event) => ({
      eventId: event.id,
      formula: event.roll.formula,
      total: event.roll.total,
      reason: event.reason,
    }));
}

function buildDiscoveredClues(input) {
  const clueById = new Map(input.adventure.clues.map((clue) => [clue.id, clue]));
  return input.sessionState.discoveredClueIds
    .map((clueId) => clueById.get(clueId))
    .filter(Boolean)
    .map((clue) => clue.title);
}

function buildCombatOutcomes(events) {
  return events
    .filter((event) => ["combat.started", "damage.applied", "combat.ended"].includes(event.type))
    .map((event) => timelineText(event));
}

function buildCharacterStates(sessionState) {
  return Object.values(sessionState.characters ?? {}).map(
    (character) =>
      `${character.name}: ${character.hitPoints.current}/${character.hitPoints.max} HP`,
  );
}

function buildUnresolvedThreads(input) {
  const discovered = new Set(input.sessionState.discoveredClueIds);
  const secretThreads = (input.adventure.truth ?? []).map(
    (secret) => `Secret: ${secret.title}`,
  );
  const clueThreads = (input.adventure.clues ?? [])
    .filter((clue) => !discovered.has(clue.id))
    .map((clue) => `Unrevealed clue: ${clue.title}`);

  return [...secretThreads, ...clueThreads];
}

function buildSummary(input) {
  const parts = [];
  if (input.discoveredClues.length > 0) {
    parts.push(`Discovered ${input.discoveredClues.length} clue(s).`);
  }
  if (input.combatOutcomes.length > 0) {
    parts.push("Resolved a combat encounter.");
  }
  if (input.ending) {
    parts.push(`Ending: ${input.ending}.`);
  }
  if (input.rewards.length > 0) {
    parts.push(`Rewards: ${input.rewards.join(", ")}.`);
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
    !["approved", "auto_approved"].includes(event.reviewStatus)
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

function renderMarkdown(recap) {
  const sections = [
    `# ${recap.title}`,
    `Audience: ${recap.audience}`,
    "",
    "## Summary",
    recap.summary || "No major events recorded.",
    "",
    "## Timeline",
    renderList(recap.timeline.map((item) => item.text)),
    "",
    "## Key Rolls",
    renderList(recap.keyRolls.map((roll) => `${roll.reason}: ${roll.formula} = ${roll.total}`)),
    "",
    "## Discovered Clues",
    renderList(recap.discoveredClues),
    "",
    "## Combat Outcomes",
    renderList(recap.combatOutcomes),
    "",
    "## Character States",
    renderList(recap.characterStates),
    "",
    "## Rewards",
    renderList(recap.rewards),
  ];

  if (recap.unresolvedThreads) {
    sections.push("", "## Host Notes", renderList(recap.unresolvedThreads));
  }

  return `${sections.join("\n")}\n`;
}

function renderList(items) {
  if (!items || items.length === 0) {
    return "- None";
  }
  return items.map((item) => `- ${item}`).join("\n");
}

function publicListFlag(flag) {
  if (!flag || flag.visibility !== "public") {
    return [];
  }
  if (!Array.isArray(flag.value)) {
    throw new Error("public list flag must contain an array");
  }
  return flag.value;
}
