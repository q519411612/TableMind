import { uiText } from "./i18n.mjs";
import { escapeHtml, renderEmpty } from "./render-utils.mjs";

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
      <span class="tm-combat-summary-pill tm-combat-round">${escapeHtml(labels.round)} ${escapeHtml(combat.round ?? 1)}</span>
      <span class="tm-combat-summary-pill tm-combat-active-summary">${escapeHtml(labels.active)}: ${escapeHtml(activeName)}</span>
    </div>
    <p class="tm-combat-hint">${escapeHtml(labels.activeCombatant)}: ${escapeHtml(activeName)}</p>
    <h3>${escapeHtml(labels.turnOrder)}</h3>
    <ul class="tm-list tm-combat-list">
      ${combatants
        .map(
          (combatant) => {
            const status = formatCombatStatus(combatant.status, labels);
            const attackSummary = renderAttackSummary(combatant);
            const isActive = combatant.id === combat.activeCombatantId;
            return `
            <li class="tm-combatant-row ${combatantClasses(
              combatant,
              combat.activeCombatantId,
            )}" data-combatant-id="${escapeHtml(combatant.id)}" data-combatant-active="${escapeHtml(isActive)}">
              <div class="tm-combatant-heading">
                <strong>${escapeHtml(combatant.displayName ?? combatant.id)}</strong>
                ${isActive ? `<span class="tm-combatant-active-badge">${escapeHtml(labels.active)}</span>` : ""}
              </div>
              <span class="tm-combatant-id">${escapeHtml(combatant.id)}</span>
              <div class="tm-combatant-stat-grid">
                ${renderCombatStat("initiative", labels.initiative, combatant.initiative ?? "?")}
                ${renderCombatStat("armor-class", labels.armorClass, combatant.armorClass ?? "?")}
                ${renderCombatStat(
                  "hp",
                  labels.hp,
                  `${combatant.hitPoints?.current ?? "?"}/${combatant.hitPoints?.max ?? "?"}`,
                )}
              </div>
              <div class="tm-combatant-meta">
                <span class="tm-combatant-status">${escapeHtml(status)}</span>
                <span class="tm-combatant-conditions">${escapeHtml(labels.conditions)} ${escapeHtml(
                  renderConditionSummary(combatant.conditions, labels),
                )}</span>
                ${attackSummary ? `<span class="tm-combatant-attacks">${escapeHtml(labels.availableAttack)}: ${escapeHtml(attackSummary)}</span>` : ""}
              </div>
            </li>
          `;
          },
        )
        .join("")}
    </ul>
  `;
}

function renderCombatStat(field, label, value) {
  return `<span class="tm-combatant-stat" data-combat-stat="${escapeHtml(field)}">${escapeHtml(label)} ${escapeHtml(value)}</span>`;
}

export function combatantClasses(combatant, activeCombatantId) {
  return [
    combatant.id === activeCombatantId ? "tm-active-combatant" : "",
    isInactiveCombatant(combatant) ? "tm-inactive-combatant" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export function activeCombatant(combat) {
  return (combat?.combatants ?? []).find(
    (combatant) => combatant.id === combat?.activeCombatantId,
  );
}

export function isInactiveCombatant(combatant) {
  return ["defeated", "dead", "fled", "inactive"].includes(combatant?.status);
}

export function renderConditionSummary(conditions = [], labels) {
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

export function formatCombatStatus(status = "active", labels) {
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

function renderAttackSummary(combatant) {
  return (combatant.attacks ?? [])
    .map((attack) => attack.name ?? attack.id)
    .filter((name) => typeof name === "string" && name.length > 0)
    .join(", ");
}
