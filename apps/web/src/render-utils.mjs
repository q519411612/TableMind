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

export function renderEventFeed(events = [], labels = uiText(), combat) {
  const feedItems = events
    .map((event) => renderEvent(event, labels, combat))
    .filter((item) => item.length > 0);

  if (feedItems.length === 0) {
    return renderEmpty(labels.noPublicEventsYet);
  }

  return `<ol class="tm-feed">${feedItems.join("")}</ol>`;
}

export function renderDiceLog(diceLog = [], labels = uiText(), events = [], combat) {
  const entries = [
    ...diceLog.map((roll) => renderDiceLogEntry(roll, labels)),
    ...renderCombatDiceLogEntries(events, labels, combat),
  ];

  if (entries.length === 0) {
    return renderEmpty(labels.noDiceRolledYet);
  }

  return `<ul class="tm-list">${entries.map((entry) => `<li>${entry}</li>`).join("")}</ul>`;
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

  const combatants = combat.combatants ?? [];
  const activeCombatant = combatants.find(
    (combatant) => combatant.id === combat.activeCombatantId,
  );
  const activeName = activeCombatant?.displayName ?? activeCombatant?.id ?? combat.activeCombatantId;

  return `
    <div class="tm-combat-summary">
      <span>${escapeHtml(labels.round)} ${escapeHtml(combat.round ?? 1)}</span>
      <span>${escapeHtml(labels.active)}: ${escapeHtml(activeName)}</span>
    </div>
    <h3>${escapeHtml(labels.turnOrder)}</h3>
    <ul class="tm-list">
      ${combatants
        .map(
          (combatant) => `
            <li class="${combatant.id === combat.activeCombatantId ? "tm-active-combatant" : ""}">
              <strong>${escapeHtml(combatant.displayName ?? combatant.id)}</strong>
              <span>${escapeHtml(combatant.id)}</span>
              <span>${escapeHtml(labels.initiative)} ${escapeHtml(combatant.initiative ?? "?")}</span>
              <span>${escapeHtml(labels.armorClass)} ${escapeHtml(combatant.armorClass ?? "?")}</span>
              <span>${escapeHtml(labels.hp)} ${escapeHtml(combatant.hitPoints?.current ?? "?")}/${escapeHtml(
                combatant.hitPoints?.max ?? "?",
              )}</span>
              <span>${escapeHtml(formatCombatStatus(combatant.status, labels))}</span>
              <span>${escapeHtml(labels.conditions)} ${escapeHtml(renderConditionSummary(combatant.conditions, labels))}</span>
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

function renderEvent(event, labels, combat) {
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
  if (event.type === "attack.resolved") {
    return `<li><strong>${escapeHtml(labels.combat)}</strong><p>${renderAttackOutcome(event, labels, combat)}</p></li>`;
  }
  if (event.type === "damage.applied") {
    return `<li><strong>${escapeHtml(labels.combat)}</strong><p>${renderDamageOutcome(event, labels)}</p></li>`;
  }
  if (event.type?.startsWith("combat.")) {
    return `<li><strong>${escapeHtml(labels.combat)}</strong><p>${escapeHtml(event.type)}</p></li>`;
  }
  return "";
}

function renderCombatDiceLogEntries(events, labels, combat) {
  return events
    .map((event) => {
      if (event.type === "attack.resolved") {
        const result = event.attackResult ?? {};
        return `<strong>${escapeHtml(labels.attackRoll)}</strong><span>${escapeHtml(
          attackRollFormula(result),
        )} = ${escapeHtml(result.total)}</span><span>${escapeHtml(attackName(event, result, combat))}</span>`;
      }
      if (event.type === "damage.applied") {
        const result = event.damageResult ?? {};
        const roll = result.roll ?? {};
        return `<strong>${escapeHtml(labels.damageRoll)}</strong><span>${escapeHtml(
          roll.formula ?? labels.damage,
        )} = ${escapeHtml(roll.total ?? result.amount)}</span><span>${escapeHtml(result.damageType ?? "")}</span>`;
      }
      return "";
    })
    .filter((entry) => entry.length > 0);
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

function attackRollFormula(result) {
  const base = result.d20?.formula ?? "1d20";
  const bonus = result.attackBonus ?? 0;
  if (bonus === 0) {
    return base;
  }
  if (bonus > 0) {
    return `${base}+${bonus}`;
  }
  return `${base}${bonus}`;
}

function renderConditionSummary(conditions = [], labels) {
  if (!Array.isArray(conditions) || conditions.length === 0) {
    return labels.noConditions;
  }

  return conditions
    .map((condition) => {
      if (typeof condition === "string") {
        return condition;
      }
      return condition.conditionId;
    })
    .filter((conditionId) => typeof conditionId === "string" && conditionId.length > 0)
    .join(", ");
}

function formatCombatStatus(status = "active", labels) {
  if (status === "active") {
    return labels.combatStatusActive;
  }
  if (status === "defeated") {
    return labels.combatStatusDefeated;
  }
  if (status === "dead") {
    return labels.combatStatusDead;
  }
  if (status === "fled") {
    return labels.combatStatusFled;
  }
  return status;
}
