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

  return `<ol class="tm-feed tm-event-feed">${feedItems.join("")}</ol>`;
}

export function renderDiceLog(diceLog = [], labels = uiText(), events = [], combat) {
  const entries = [
    ...diceLog.map((roll) => renderDiceLogEntry(roll, labels)),
    ...renderCombatDiceLogEntries(events, labels, combat),
  ];

  if (entries.length === 0) {
    return renderEmpty(labels.noDiceRolledYet);
  }

  return `<ul class="tm-list tm-rules-log">${entries
    .map((entry) => `<li class="tm-rules-card" data-log-kind="rules-engine">${entry}</li>`)
    .join("")}</ul>`;
}

function renderDiceLogEntry(roll, labels) {
  if (roll.check) {
    const subject = roll.check.skill ?? roll.check.ability;
    const outcome = roll.check.success ? labels.success : labels.failure;
    return `
      <div class="tm-rule-card-heading">
        <strong>${escapeHtml(roll.check.requestType)} ${escapeHtml(subject)}</strong>
        <span class="tm-outcome ${roll.check.success ? "tm-outcome-success" : "tm-outcome-failure"}">${escapeHtml(
          outcome,
        )}</span>
      </div>
      <div class="tm-rules-grid">
        ${renderRuleField(labels.rollExpression, roll.formula ?? checkExpression(roll.check), "expression")}
        ${renderRuleField(labels.modifier, formatSignedModifier(checkModifier(roll.check)), "modifier")}
        ${renderRuleField("DC", roll.check.dc, "dc")}
        ${renderRuleField(labels.result, `${roll.check.total} ${outcome}`, "result")}
        ${renderRuleField(labels.source, labels.rulesEngine, "source")}
      </div>
      <p>${escapeHtml(roll.check.reason)}</p>
    `;
  }

  return `
    <div class="tm-rule-card-heading">
      <strong>${escapeHtml(labels.diceResult)}</strong>
    </div>
    <div class="tm-rules-grid">
      ${renderRuleField(labels.rollExpression, roll.formula, "expression")}
      ${renderRuleField(labels.result, roll.total, "result")}
      ${renderRuleField(labels.source, labels.rulesEngine, "source")}
    </div>
    <p>${escapeHtml(roll.reason ?? "")}</p>
  `;
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
    return renderFeedItem("player-action", labels.playerAction, escapeHtml(event.message));
  }
  if (event.type === "ai.message") {
    return renderFeedItem("ai-narration", labels.aiDmNarration, escapeHtml(event.message));
  }
  if (event.type === "system.message") {
    return renderFeedItem("system-event", labels.systemEvent, escapeHtml(event.message));
  }
  if (event.type === "dice.rolled") {
    return renderFeedItem(
      "dice-result",
      labels.diceResult,
      `${escapeHtml(event.roll?.formula)} = ${escapeHtml(event.roll?.total)} ${escapeHtml(event.reason ?? "")}`,
    );
  }
  if (event.type === "scene.changed") {
    return renderFeedItem("system-event", labels.scene, escapeHtml(event.sceneId));
  }
  if (event.type === "clue.revealed") {
    return renderFeedItem("host-approved-reveal", labels.hostApprovedReveal, escapeHtml(labels.revealClue));
  }
  if (event.type === "attack.resolved") {
    return renderFeedItem("combat-update", labels.combatUpdate, renderAttackOutcome(event, labels, combat));
  }
  if (event.type === "damage.applied") {
    return renderFeedItem("combat-update", labels.combatUpdate, renderDamageOutcome(event, labels));
  }
  if (event.type?.startsWith("combat.")) {
    return renderFeedItem("combat-update", labels.combatUpdate, escapeHtml(labels.combatStateChanged));
  }
  return "";
}

function renderCombatDiceLogEntries(events, labels, combat) {
  return events
    .map((event) => {
      if (event.type === "attack.resolved") {
        const result = event.attackResult ?? {};
        return `
          <div class="tm-rule-card-heading">
            <strong>${escapeHtml(labels.attackRoll)}</strong>
            <span class="tm-outcome ${result.hit ? "tm-outcome-success" : "tm-outcome-failure"}">${escapeHtml(
              result.hit ? labels.hit : labels.miss,
            )}</span>
          </div>
          <div class="tm-rules-grid">
            ${renderRuleField(labels.rollExpression, attackRollFormula(result), "expression")}
            ${renderRuleField(labels.modifier, formatSignedModifier(result.attackBonus ?? 0), "modifier")}
            ${renderRuleField(labels.armorClass, result.targetArmorClass ?? result.armorClass ?? "?", "dc")}
            ${renderRuleField(labels.result, result.total ?? "?", "result")}
            ${renderRuleField(labels.source, labels.rulesEngine, "source")}
          </div>
          <p>${escapeHtml(attackName(event, result, combat))}</p>
        `;
      }
      if (event.type === "damage.applied") {
        const result = event.damageResult ?? {};
        const roll = result.roll ?? {};
        return `
          <div class="tm-rule-card-heading">
            <strong>${escapeHtml(labels.damageRoll)}</strong>
          </div>
          <div class="tm-rules-grid">
            ${renderRuleField(labels.rollExpression, roll.formula ?? labels.damage, "expression")}
            ${renderRuleField(labels.result, roll.total ?? result.amount, "result")}
            ${renderRuleField(labels.source, labels.rulesEngine, "source")}
          </div>
          <p>${escapeHtml(result.damageType ?? "")}</p>
        `;
      }
      return "";
    })
    .filter((entry) => entry.length > 0);
}

function renderFeedItem(kind, label, bodyHtml) {
  return `<li class="tm-feed-item tm-event-${escapeHtml(kind)}" data-event-kind="${escapeHtml(
    kind,
  )}"><strong>${escapeHtml(label)}</strong><p>${bodyHtml}</p></li>`;
}

function renderRuleField(label, value, field) {
  return `<span class="tm-rule-field" data-rule-field="${escapeHtml(field)}"><b>${escapeHtml(
    label,
  )}</b><span>${escapeHtml(value)}</span></span>`;
}

function checkModifier(check) {
  if (Number.isFinite(check.modifier)) {
    return check.modifier;
  }
  if (Number.isFinite(check.total) && Number.isFinite(check.selectedD20)) {
    return check.total - check.selectedD20;
  }
  return 0;
}

function checkExpression(check) {
  return `1d20${formatSignedModifier(checkModifier(check))}`;
}

function formatSignedModifier(value) {
  const modifier = Number.isFinite(value) ? value : 0;
  if (modifier > 0) {
    return `+${modifier}`;
  }
  return String(modifier);
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
