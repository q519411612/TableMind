import { uiText } from "./i18n.mjs";
import { escapeHtml, renderEmpty } from "./render-utils.mjs";

export function renderEventFeed(
  events = [],
  labels = uiText(),
  combat,
  adventureSnapshot,
  options = {},
) {
  const viewerRole = options.viewerRole ?? "host";
  const feedItems = events
    .map((event) =>
      renderEvent(event, labels, combat, adventureSnapshot, viewerRole),
    )
    .filter((item) => item.length > 0);

  if (feedItems.length === 0) {
    return renderEmpty(labels.noPublicEventsYet);
  }

  return `<ol class="tm-feed tm-event-feed">${feedItems.join("")}</ol>`;
}

export function renderEvent(event, labels, combat, adventureSnapshot, viewerRole) {
  if (event.type === "player.message") {
    return renderFeedItem("player-action", labels.playerAction, escapeHtml(event.message));
  }
  if (event.type === "ai.message") {
    return renderFeedItem("ai-narration", labels.aiDmNarration, escapeHtml(event.message));
  }
  if (event.type === "system.message") {
    return renderFeedItem("system-event", labels.systemEvent, escapeHtml(event.message));
  }
  if (event.type === "dice.rolled") {
    const formula = event.roll?.formula ?? labels.dice;
    const total = event.roll?.total ?? "?";
    const reason = event.reason ?? "";
    return renderFeedItem(
      "dice-result",
      labels.diceResult,
      escapeHtml(formatLabel(labels.ruleCheckSummary, { formula, total, reason }).trim()),
    );
  }
  if (event.type === "scene.changed") {
    const sceneTitle = safeSceneTitle(event, adventureSnapshot, viewerRole);
    return renderFeedItem(
      "system-event",
      labels.scene,
      escapeHtml(
        sceneTitle
          ? formatLabel(labels.sceneChangedTo, { scene: sceneTitle })
          : labels.sceneChangedGeneric,
      ),
    );
  }
  if (event.type === "clue.revealed") {
    const clueTitle = safeClueTitle(event, adventureSnapshot, viewerRole);
    return renderFeedItem(
      "host-approved-reveal",
      labels.hostApprovedReveal,
      escapeHtml(
        clueTitle
          ? formatLabel(labels.revealedClueNamed, { clue: clueTitle })
          : labels.revealedClueGeneric,
      ),
    );
  }
  if (event.type === "attack.resolved") {
    return renderFeedItem("combat-update", labels.combatUpdate, renderAttackOutcome(event, labels, combat));
  }
  if (event.type === "damage.applied") {
    return renderFeedItem("combat-update", labels.combatUpdate, renderDamageOutcome(event, labels));
  }
  if (event.type === "combat.started") {
    return renderFeedItem("combat-update", labels.combatUpdate, escapeHtml(labels.combatStateChanged));
  }
  if (event.type === "combat.turn_advanced") {
    const activeName = combatantName(combat, event.activeCombatantId);
    return renderFeedItem(
      "combat-update",
      labels.combatUpdate,
      escapeHtml(formatLabel(labels.turnAdvancedTo, { combatant: activeName })),
    );
  }
  if (event.type === "combat.ended") {
    return renderFeedItem("combat-update", labels.combatUpdate, escapeHtml(labels.combatStateChanged));
  }
  if (event.type?.startsWith("combat.")) {
    return renderFeedItem("combat-update", labels.combatUpdate, escapeHtml(labels.combatStateChanged));
  }
  return "";
}

export function renderFeedItem(kind, label, bodyHtml) {
  return `<li class="tm-feed-item tm-event-${escapeHtml(kind)}" data-event-kind="${escapeHtml(
    kind,
  )}"><strong>${escapeHtml(label)}</strong><p>${bodyHtml}</p></li>`;
}

export function safeSceneTitle(event, adventureSnapshot, viewerRole) {
  const currentScene = adventureSnapshot?.currentScene;
  if (currentScene?.id === event.sceneId && typeof currentScene.title === "string") {
    return currentScene.title;
  }
  if (viewerRole === "player") {
    return undefined;
  }
  if (typeof event.sceneTitle === "string" && event.sceneTitle.length > 0) {
    return event.sceneTitle;
  }
  return undefined;
}

export function safeClueTitle(event, adventureSnapshot, viewerRole) {
  const clues = adventureSnapshot?.currentScene?.clues ?? [];
  const matchingClue = clues.find(
    (clue) => clue.id === event.clueId || clue.publicHandle === event.clueId,
  );
  if (matchingClue?.title) {
    return matchingClue.title;
  }
  if (viewerRole === "player") {
    return undefined;
  }
  if (typeof event.clueTitle === "string" && event.clueTitle.length > 0) {
    return event.clueTitle;
  }
  return undefined;
}

function renderAttackOutcome(event, labels, combat) {
  const result = event.attackResult ?? {};
  const armorClass = result.targetArmorClass ?? result.armorClass ?? "?";
  const outcome = result.hit ? labels.hit : labels.miss;
  return escapeHtml(
    `${attackName(event, result, combat)} ${labels.attackResult} ${result.total ?? "?"} ${labels.versus} ${labels.armorClass} ${armorClass}: ${outcome}`,
  );
}

function renderDamageOutcome(event, labels) {
  const result = event.damageResult ?? {};
  return escapeHtml(
    `${labels.damage} ${result.amount ?? "?"} ${result.damageType ?? ""}, ${labels.hp} ${result.resultingHp ?? "?"}`,
  );
}

function attackName(event, result, combat) {
  if (result.attackName) {
    return result.attackName;
  }
  const attacker = (combat?.combatants ?? []).find(
    (combatant) => combatant.id === event.attackerCombatantId,
  );
  const attack = (attacker?.attacks ?? []).find(
    (candidate) => candidate.id === event.attackId,
  );
  return attack?.name ?? event.attackId ?? event.attackerCombatantId ?? "";
}

function combatantName(combat, combatantId) {
  const combatant = (combat?.combatants ?? []).find(
    (candidate) => candidate.id === combatantId,
  );
  return combatant?.displayName ?? combatantId ?? "";
}

function formatLabel(template, values) {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, String(value ?? "")),
    template,
  );
}
