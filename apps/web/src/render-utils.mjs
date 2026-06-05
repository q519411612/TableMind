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

export function renderMarkdown(markdown) {
  if (!markdown) {
    return renderEmpty("No recap yet.");
  }

  return escapeHtml(markdown)
    .split(/\n{2,}|\n/)
    .filter((line) => line.trim().length > 0)
    .map((line) => `<p>${line}</p>`)
    .join("");
}

export function renderEventFeed(events = []) {
  const feedItems = events
    .map((event) => renderEvent(event))
    .filter((item) => item.length > 0);

  if (feedItems.length === 0) {
    return renderEmpty("No public events yet.");
  }

  return `<ol class="tm-feed">${feedItems.join("")}</ol>`;
}

export function renderDiceLog(diceLog = []) {
  if (diceLog.length === 0) {
    return renderEmpty("No dice rolled yet.");
  }

  return `<ul class="tm-list">${diceLog
    .map((roll) => `<li>${renderDiceLogEntry(roll)}</li>`)
    .join("")}</ul>`;
}

function renderDiceLogEntry(roll) {
  if (roll.check) {
    const subject = roll.check.skill ?? roll.check.ability;
    const outcome = roll.check.success ? "success" : "failure";
    return `<strong>${escapeHtml(roll.check.requestType)} ${escapeHtml(
      subject,
    )}</strong><span>DC ${escapeHtml(roll.check.dc)}, d20 ${escapeHtml(
      roll.check.selectedD20,
    )}, total ${escapeHtml(roll.check.total)}, ${escapeHtml(
      outcome,
    )}</span><span>${escapeHtml(roll.check.reason)}</span>`;
  }

  return `<strong>${escapeHtml(roll.formula)}</strong> = ${escapeHtml(
    roll.total,
  )}<span>${escapeHtml(roll.reason ?? "")}</span>`;
}

export function renderCombat(combat) {
  if (!combat) {
    return renderEmpty("No active combat.");
  }

  return `
    <div class="tm-combat-summary">
      <span>Active: ${escapeHtml(combat.activeCombatantId)}</span>
      <span>Round ${escapeHtml(combat.round ?? 1)}</span>
    </div>
    <ul class="tm-list">
      ${(combat.combatants ?? [])
        .map(
          (combatant) => `
            <li>
              <strong>${escapeHtml(combatant.displayName ?? combatant.id)}</strong>
              <span>${escapeHtml(combatant.id)}</span>
              <span>HP ${escapeHtml(combatant.hitPoints?.current ?? "?")}/${escapeHtml(
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

function renderEvent(event) {
  if (event.type === "player.message") {
    return `<li><strong>Player</strong><p>${escapeHtml(event.message)}</p></li>`;
  }
  if (event.type === "ai.message") {
    return `<li><strong>AI</strong><p>${escapeHtml(event.message)}</p></li>`;
  }
  if (event.type === "system.message") {
    return `<li><strong>System</strong><p>${escapeHtml(event.message)}</p></li>`;
  }
  if (event.type === "dice.rolled") {
    return `<li><strong>Dice</strong><p>${escapeHtml(
      event.roll?.formula,
    )} = ${escapeHtml(event.roll?.total)} ${escapeHtml(event.reason ?? "")}</p></li>`;
  }
  if (event.type === "scene.changed") {
    return `<li><strong>Scene</strong><p>${escapeHtml(event.sceneId)}</p></li>`;
  }
  if (event.type === "clue.revealed") {
    return `<li><strong>Clue</strong><p>${escapeHtml(event.clueId)}</p></li>`;
  }
  if (event.type?.startsWith("combat.") || event.type === "attack.resolved") {
    return `<li><strong>Combat</strong><p>${escapeHtml(event.type)}</p></li>`;
  }
  return "";
}
