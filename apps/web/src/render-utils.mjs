import { uiText } from "./i18n.mjs";

export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function renderEmpty(text) {
  return `<p class="tm-empty">${escapeHtml(text)}</p>`;
}

export function renderError(message, labels = uiText()) {
  if (!message) {
    return "";
  }

  return `<div class="tm-error" role="alert"><strong>${escapeHtml(labels.error)}</strong><p>${escapeHtml(message)}</p></div>`;
}

export function renderNotice(message, heading) {
  if (!message) {
    return "";
  }

  return `<div class="tm-notice"><strong>${escapeHtml(heading)}</strong><p>${escapeHtml(message)}</p></div>`;
}

export function renderMarkdown(markdown, labels = uiText()) {
  if (!markdown) {
    return renderEmpty(labels.noRecapYet);
  }

  return escapeHtml(markdown)
    .split(/\n{2,}|\n/)
    .filter((line) => line.trim().length > 0)
    .map((line) => `<p>${line}</p>`)
    .join("");
}

export function renderEventFeed(events = [], labels = uiText()) {
  const feedItems = events
    .map((event) => renderEvent(event, labels))
    .filter((item) => item.length > 0);

  if (feedItems.length === 0) {
    return renderEmpty(labels.noPublicEventsYet);
  }

  return `<ol class="tm-feed">${feedItems.join("")}</ol>`;
}

export function renderDiceLog(diceLog = [], labels = uiText()) {
  if (diceLog.length === 0) {
    return renderEmpty(labels.noDiceRolledYet);
  }

  return `<ul class="tm-list">${diceLog
    .map((roll) => `<li>${renderDiceLogEntry(roll, labels)}</li>`)
    .join("")}</ul>`;
}

function renderDiceLogEntry(roll, labels) {
  if (roll.check) {
    const subject = roll.check.skill ?? roll.check.ability;
    const outcome = roll.check.success ? labels.success : labels.failure;
    return `<strong>${escapeHtml(roll.check.requestType)} ${escapeHtml(
      subject,
    )}</strong><span>DC ${escapeHtml(roll.check.dc)}, d20 ${escapeHtml(
      roll.check.selectedD20,
    )}, ${escapeHtml(labels.total)} ${escapeHtml(roll.check.total)}, ${escapeHtml(
      outcome,
    )}</span><span>${escapeHtml(roll.check.reason)}</span>`;
  }

  return `<strong>${escapeHtml(roll.formula)}</strong> = ${escapeHtml(
    roll.total,
  )}<span>${escapeHtml(roll.reason ?? "")}</span>`;
}

export function renderCombat(combat, labels = uiText()) {
  if (!combat) {
    return renderEmpty(labels.noActiveCombat);
  }

  return `
    <div class="tm-combat-summary">
      <span>${escapeHtml(labels.active)}: ${escapeHtml(combat.activeCombatantId)}</span>
      <span>${escapeHtml(labels.round)} ${escapeHtml(combat.round ?? 1)}</span>
    </div>
    <ul class="tm-list">
      ${(combat.combatants ?? [])
        .map(
          (combatant) => `
            <li>
              <strong>${escapeHtml(combatant.displayName ?? combatant.id)}</strong>
              <span>${escapeHtml(combatant.id)}</span>
              <span>${escapeHtml(labels.hp)} ${escapeHtml(combatant.hitPoints?.current ?? "?")}/${escapeHtml(
                combatant.hitPoints?.max ?? "?",
              )}</span>
              <span>${escapeHtml(combatant.status ?? "active")}</span>
            </li>
          `,
        )
        .join("")}
    </ul>
  `;
}

export function ownCharacters(snapshot, playerId) {
  return Object.values(snapshot?.characters ?? {}).filter(
    (character) => !playerId || character.playerId === playerId,
  );
}

function renderEvent(event, labels) {
  if (event.type === "player.message") {
    return `<li><strong>${escapeHtml(labels.player)}</strong><p>${escapeHtml(event.message)}</p></li>`;
  }
  if (event.type === "ai.message") {
    return `<li><strong>${escapeHtml(labels.ai)}</strong><p>${escapeHtml(event.message)}</p></li>`;
  }
  if (event.type === "system.message") {
    return `<li><strong>${escapeHtml(labels.system)}</strong><p>${escapeHtml(event.message)}</p></li>`;
  }
  if (event.type === "dice.rolled") {
    return `<li><strong>${escapeHtml(labels.dice)}</strong><p>${escapeHtml(
      event.roll?.formula,
    )} = ${escapeHtml(event.roll?.total)} ${escapeHtml(event.reason ?? "")}</p></li>`;
  }
  if (event.type === "scene.changed") {
    return `<li><strong>${escapeHtml(labels.scene)}</strong><p>${escapeHtml(event.sceneId)}</p></li>`;
  }
  if (event.type === "clue.revealed") {
    return `<li><strong>${escapeHtml(labels.revealClue)}</strong><p>${escapeHtml(event.clueId)}</p></li>`;
  }
  if (event.type?.startsWith("combat.") || event.type === "attack.resolved") {
    return `<li><strong>${escapeHtml(labels.combat)}</strong><p>${escapeHtml(event.type)}</p></li>`;
  }
  return "";
}
