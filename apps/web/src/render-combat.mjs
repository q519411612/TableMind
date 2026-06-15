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
      <span>${escapeHtml(labels.round)} ${escapeHtml(combat.round ?? 1)}</span>
      <span>${escapeHtml(labels.active)}: ${escapeHtml(activeName)}</span>
    </div>
    <p class="tm-combat-hint">${escapeHtml(labels.activeCombatant)}: ${escapeHtml(activeName)}</p>
    <h3>${escapeHtml(labels.turnOrder)}</h3>
    <ul class="tm-list">
      ${combatants
        .map(
          (combatant) => {
            const status = formatCombatStatus(combatant.status, labels);
            const attackSummary = renderAttackSummary(combatant);
            return `
            <li class="${combatantClasses(combatant, combat.activeCombatantId)}">
              <strong>${escapeHtml(combatant.displayName ?? combatant.id)}</strong>
              <span>${escapeHtml(combatant.id)}</span>
              <span>${escapeHtml(labels.initiative)} ${escapeHtml(combatant.initiative ?? "?")}</span>
              <span>${escapeHtml(labels.armorClass)} ${escapeHtml(combatant.armorClass ?? "?")}</span>
              <span>${escapeHtml(labels.hp)} ${escapeHtml(combatant.hitPoints?.current ?? "?")}/${escapeHtml(
                combatant.hitPoints?.max ?? "?",
              )}</span>
              <span>${escapeHtml(status)}</span>
              <span>${escapeHtml(labels.conditions)} ${escapeHtml(renderConditionSummary(combatant.conditions, labels))}</span>
              ${attackSummary ? `<span>${escapeHtml(labels.availableAttack)}: ${escapeHtml(attackSummary)}</span>` : ""}
            </li>
          `;
          },
        )
        .join("")}
    </ul>
  `;
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
