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

export function renderSessionPhaseBanner(input = {}) {
  const labels = input.labels ?? uiText();
  const snapshot = input.snapshot;
  const phase = snapshot?.phase ?? "setup";
  const hint = sessionPhaseHint({ ...input, labels, phase });

  return `
    <div class="tm-phase-banner" data-session-phase="${escapeHtml(phase)}">
      <strong>${escapeHtml(labels.sessionPhase)}</strong>
      <span>${escapeHtml(phaseLabel(phase, labels))}</span>
      ${hint ? `<p>${escapeHtml(hint)}</p>` : ""}
    </div>
  `;
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

export function ownCharacters(snapshot, playerId) {
  return Object.values(snapshot?.characters ?? {}).filter(
    (character) => !playerId || character.playerId === playerId,
  );
}

function renderEvent(event, labels, combat, adventureSnapshot, viewerRole) {
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

function combatantName(combat, combatantId) {
  const combatant = (combat?.combatants ?? []).find(
    (candidate) => candidate.id === combatantId,
  );
  return combatant?.displayName ?? combatantId ?? "";
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

function combatantClasses(combatant, activeCombatantId) {
  return [
    combatant.id === activeCombatantId ? "tm-active-combatant" : "",
    isInactiveCombatant(combatant) ? "tm-inactive-combatant" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

function renderAttackSummary(combatant) {
  return (combatant.attacks ?? [])
    .map((attack) => attack.name ?? attack.id)
    .filter((name) => typeof name === "string" && name.length > 0)
    .join(", ");
}

function sessionPhaseHint(input) {
  const {
    snapshot,
    labels,
    role,
    reviewQueue = [],
    joined,
    playerId,
    phase,
    room,
    adventureSnapshot,
  } = input;
  const pendingReviewCount = reviewQueue.filter((item) => item.status === "pending").length;

  if (role === "host") {
    if (!room) {
      return labels.nextCreateRoom;
    }
    if (!adventureSnapshot) {
      return labels.nextLoadDemoAdventure;
    }
    if (playerReadiness(snapshot).ready < 2) {
      return labels.nextWaitForPlayers;
    }
  }

  if (role === "host" && pendingReviewCount > 0) {
    return `${labels.hostReviewRequired}: ${formatPendingReviewCount(pendingReviewCount, labels)}.`;
  }

  if (role === "player") {
    if (!joined) {
      return labels.nextJoinInvite;
    }
    if (ownCharacters(snapshot, playerId).length === 0) {
      return labels.nextCreateDemoCharacter;
    }
    if (phase === "combat") {
      return playerCombatHint(snapshot?.combat, playerId, labels);
    }
  }

  if (!snapshot) {
    return role === "host" ? labels.nextCreateRoom : labels.nextJoinInvite;
  }
  if (phase === "lobby") {
    return role === "host" ? labels.nextReadyToStart : labels.nextWaitingHostStart;
  }
  if (phase === "playing") {
    return role === "host" ? labels.nextRunAi : labels.nextDescribeAction;
  }
  if (phase === "combat") {
    return labels.nextResolveCombat;
  }
  if (phase === "ended") {
    return labels.nextReadRecap;
  }
  return undefined;
}

function playerReadiness(snapshot) {
  const playerRows = Object.values(snapshot?.players ?? {}).filter(
    (player) => player.role === "player",
  );
  const ready = playerRows.filter((player) => player.characterId).length;
  return {
    ready,
    target: Math.max(2, playerRows.length),
  };
}

function playerCombatHint(combat, playerId, labels) {
  const active = activeCombatant(combat);
  if (active?.playerId === playerId) {
    if (isInactiveCombatant(active)) {
      return labels.inactiveCombatantCannotAct;
    }
    return labels.itIsYourTurn;
  }

  return `${labels.waitingForAnotherCombatant}: ${active?.displayName ?? active?.id ?? "?"}.`;
}

function activeCombatant(combat) {
  return (combat?.combatants ?? []).find(
    (combatant) => combatant.id === combat?.activeCombatantId,
  );
}

function isInactiveCombatant(combatant) {
  return ["defeated", "dead", "fled", "inactive"].includes(combatant?.status);
}

function phaseLabel(phase, labels) {
  if (phase === "setup") {
    return labels.phaseSetup;
  }
  if (phase === "lobby") {
    return labels.phaseLobby;
  }
  if (phase === "playing") {
    return labels.phasePlaying;
  }
  if (phase === "combat") {
    return labels.phaseCombat;
  }
  if (phase === "ended") {
    return labels.phaseEnded;
  }
  return labels.phaseUnknown;
}

function formatPendingReviewCount(count, labels) {
  const unit = count === 1 ? labels.pendingReviewItem : labels.pendingReviewItems;
  return `${count} ${unit}`;
}

function safeSceneTitle(event, adventureSnapshot, viewerRole) {
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

function safeClueTitle(event, adventureSnapshot, viewerRole) {
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

function formatLabel(template, values) {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, String(value ?? "")),
    template,
  );
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
