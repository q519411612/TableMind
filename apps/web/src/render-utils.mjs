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

export function ownCharacters(snapshot, playerId) {
  return Object.values(snapshot?.characters ?? {}).filter(
    (character) => !playerId || character.playerId === playerId,
  );
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
