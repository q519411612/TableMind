import { uiText } from "./i18n.mjs";
import { escapeHtml, renderEmpty } from "./render-utils.mjs";

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

export function renderDiceLogEntry(roll, labels) {
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

export function renderCombatDiceLogEntries(events, labels, combat) {
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

export function renderRuleField(label, value, field) {
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
