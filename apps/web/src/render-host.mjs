import { renderLanguageSwitcher, uiText } from "./i18n.mjs";
import {
  escapeHtml,
  renderCombat,
  renderDiceLog,
  renderEmpty,
  renderError,
  renderEventFeed,
  renderMarkdown,
  renderNotice,
} from "./render-utils.mjs";

export function renderHostRoom(input = {}) {
  const snapshot = input.snapshot;
  const scene = input.adventureSnapshot?.currentScene;
  const room = input.room;
  const labels = uiText(input.locale);

  return `
    <main class="tm-shell tm-host" data-viewer-role="host">
      <header class="tm-topbar">
        <div>
          <p class="tm-kicker">${escapeHtml(labels.hostConsole)}</p>
          <h1>${escapeHtml(room?.roomId ?? labels.createRoomHeading)}</h1>
        </div>
        <div class="tm-topbar-actions">
          ${renderLanguageSwitcher(input.locale)}
          <button type="button" data-action="refresh-snapshot">${escapeHtml(labels.refresh)}</button>
        </div>
      </header>

      <section class="tm-grid">
        ${renderError(input.errorMessage, labels)}
        ${renderNotice(input.statusMessage, labels.system)}
        ${renderNotice(hostNextStep({ room, snapshot, adventureSnapshot: input.adventureSnapshot, labels }), labels.nextStep)}

        <article class="tm-panel" data-panel="create-room">
          <h2>${escapeHtml(labels.room)}</h2>
          <form data-action="create-room">
            <label>
              ${escapeHtml(labels.hostName)}
              <input name="hostDisplayName" value="Host" required />
            </label>
            <button type="submit">${escapeHtml(labels.createRoom)}</button>
          </form>
          ${renderInvite(room, labels)}
        </article>

        <article class="tm-panel" data-panel="players">
          <h2>${escapeHtml(labels.players)}</h2>
          ${renderPlayers(snapshot, labels)}
        </article>

        <article class="tm-panel tm-panel-wide" data-panel="scene">
          <h2>${escapeHtml(labels.scene)}</h2>
          ${renderHostScene(snapshot, scene, input.adventureSnapshot?.truth ?? [], labels)}
          ${renderAdventureControls(scene, labels)}
        </article>

        <article class="tm-panel" data-panel="ai">
          <h2>${escapeHtml(labels.ai)}</h2>
          ${renderAiStatus(snapshot, labels)}
          <button type="button" data-command="ai.turn.run">${escapeHtml(labels.runAi)}</button>
          <button type="button" data-command="ai.pause" data-paused="true">${escapeHtml(labels.pauseAi)}</button>
          <button type="button" data-command="ai.pause" data-paused="false">${escapeHtml(labels.resumeAi)}</button>
        </article>

        <article class="tm-panel tm-panel-wide" data-panel="review">
          <h2>${escapeHtml(labels.reviewQueue)}</h2>
          ${renderReviewQueue(input.reviewQueue ?? [], labels)}
        </article>

        <article class="tm-panel tm-panel-wide" data-panel="feed">
          <h2>${escapeHtml(labels.auditFeed)}</h2>
          ${renderEventFeed(snapshot?.eventLog ?? [], labels, snapshot?.combat)}
        </article>

        <article class="tm-panel" data-panel="dice">
          <h2>${escapeHtml(labels.diceLog)}</h2>
          ${renderDiceLog(snapshot?.diceLog ?? [], labels, snapshot?.eventLog ?? [], snapshot?.combat)}
        </article>

        <article class="tm-panel tm-panel-wide" data-panel="combat">
          <h2>${escapeHtml(labels.combat)}</h2>
          ${renderCombat(snapshot?.combat, labels)}
          ${renderCombatControls(snapshot?.combat, labels)}
        </article>

        <article class="tm-panel tm-panel-wide" data-panel="recap">
          <h2>${escapeHtml(labels.recap)}</h2>
          ${renderSessionComplete(labels)}
          ${renderMarkdown(input.recap?.markdown, labels)}
        </article>
      </section>
    </main>
  `;
}

function renderInvite(room, labels) {
  if (!room) {
    return renderEmpty(labels.noActiveRoom);
  }

  return `
    <dl class="tm-facts">
      <div><dt>${escapeHtml(labels.hostId)}</dt><dd>${escapeHtml(room.hostPlayerId)}</dd></div>
      <div>
        <dt>${escapeHtml(labels.invite)}</dt>
        <dd>
          <span>${escapeHtml(room.inviteLink)}</span>
          <a class="tm-link-button" href="${escapeHtml(room.inviteLink)}">${escapeHtml(labels.openInvite)}</a>
          <button type="button" data-action="copy-invite" data-invite-link="${escapeHtml(room.inviteLink)}">${escapeHtml(
            labels.copyInvite,
          )}</button>
        </dd>
      </div>
    </dl>
  `;
}

function renderPlayers(snapshot, labels) {
  const players = Object.values(snapshot?.players ?? {});
  if (players.length === 0) {
    return renderEmpty(labels.noPlayersYet);
  }

  const readiness = playerReadiness(players);

  return `
    <p class="tm-readiness">${escapeHtml(labels.playersReady)}: ${escapeHtml(readiness.ready)}/${escapeHtml(
      readiness.target,
    )}</p>
    <ul class="tm-list">${players
    .map(
      (player) => `
        <li>
          <strong>${escapeHtml(player.displayName)}</strong>
          <span>${escapeHtml(player.role)}</span>
          <span>${escapeHtml(player.characterId ?? labels.noCharacter)}</span>
          <span>${escapeHtml(player.role === "host" ? labels.hostConsole : player.characterId ? labels.ready : labels.needsCharacter)}</span>
        </li>
      `,
    )
    .join("")}</ul>
  `;
}

function renderHostScene(snapshot, scene, truth, labels) {
  if (!snapshot) {
    return renderEmpty(labels.createRoomToLoadAdventure);
  }

  return `
    <h3>${escapeHtml(scene?.title ?? snapshot.currentSceneId)}</h3>
    <p>${escapeHtml(scene?.readAloud?.text ?? "")}</p>
    <p class="tm-dm-note">${escapeHtml(scene?.dmNotes?.text ?? "")}</p>
    <ul class="tm-list">
      ${truth
        .map(
          (secret) => `
            <li>
              <strong>${escapeHtml(secret.title)}</strong>
              <span>${escapeHtml(secret.text)}</span>
            </li>
          `,
        )
        .join("")}
    </ul>
  `;
}

function renderAdventureControls(scene, labels) {
  const clues = scene?.clues ?? [];

  return `
    <div class="tm-command-row">
      <button type="button" data-command="adventure.load">${escapeHtml(labels.loadDemoAdventure)}</button>
      <button type="button" data-command="session.start">${escapeHtml(labels.startSession)}</button>
      <button type="button" data-command="scene.change">${escapeHtml(labels.changeScene)}</button>
    </div>
    <div class="tm-command-row">
      ${clues
        .map(
          (clue) =>
            `<button type="button" data-command="clue.reveal" data-clue-id="${escapeHtml(
              clue.id,
            )}">${escapeHtml(labels.reveal)} ${escapeHtml(clue.title ?? clue.id)}</button>`,
        )
        .join("")}
      <button type="button" data-command="clue.reveal">${escapeHtml(labels.revealClue)}</button>
    </div>
  `;
}

function renderReviewQueue(reviewQueue, labels) {
  const pendingItems = reviewQueue.filter((item) => item.status === "pending");
  if (pendingItems.length === 0) {
    return renderEmpty(labels.noPendingReviewItems);
  }

  return `<ul class="tm-list">${pendingItems
    .map((item) => renderReviewItem(item, labels))
    .join("")}</ul>`;
}

function renderAiStatus(snapshot, labels) {
  const aiPaused = Boolean(snapshot?.flags?.aiPaused?.value);
  return `
    <p>
      <strong>${escapeHtml(labels.aiStatus)}</strong>
      <span data-ai-status="${escapeHtml(aiPaused ? "paused" : "active")}">${escapeHtml(
        aiPaused ? labels.aiPausedStatus : labels.aiActiveStatus,
      )}</span>
    </p>
  `;
}

function renderReviewItem(item, labels) {
  return `
    <li class="tm-review-card" data-review-id="${escapeHtml(item.id)}">
      <dl class="tm-facts tm-review-summary">
        ${renderFact(labels.reviewType, item.type)}
        ${renderFact(labels.reviewRisk, item.riskLevel)}
        ${renderFact(labels.reviewReason, item.reason)}
      </dl>
      ${renderReviewPayloadSummary(item.proposedPayload, labels)}
      <div class="tm-command-row">
        <button type="button" data-command="host.review.update" data-action-value="approve" data-review-id="${escapeHtml(
          item.id,
        )}">${escapeHtml(labels.approve)}</button>
        <button type="button" data-command="host.review.update" data-action-value="reject" data-review-id="${escapeHtml(
          item.id,
        )}">${escapeHtml(labels.reject)}</button>
      </div>
      ${renderReviewEditForm(item, labels)}
    </li>
  `;
}

function renderReviewPayloadSummary(payload, labels) {
  const rows = [];
  if (typeof payload?.publicMessage === "string" && payload.publicMessage.length > 0) {
    rows.push(renderFact(labels.publicMessage, payload.publicMessage));
  }
  const revealSummary = reviewRevealSummary(payload);
  if (revealSummary) {
    rows.push(renderFact(labels.revealProposal, revealSummary));
  }
  const statePatchSummary = reviewStatePatchSummary(payload);
  if (statePatchSummary) {
    rows.push(renderFact(labels.statePatch, statePatchSummary));
  }

  if (rows.length === 0) {
    return renderEmpty(labels.noReviewPayloadSummary);
  }
  return `<dl class="tm-facts tm-review-summary">${rows.join("")}</dl>`;
}

function renderReviewEditForm(item, labels) {
  const payloadJson = JSON.stringify(item.proposedPayload ?? {}, null, 2);
  const publicMessage = item.proposedPayload?.publicMessage ?? "";
  return `
    <form data-command="host.review.update" data-review-action="edit" class="tm-review-edit">
      <input type="hidden" name="itemId" value="${escapeHtml(item.id)}" />
      <input type="hidden" name="action" value="edit" />
      <label>
        ${escapeHtml(labels.publicMessage)}
        <textarea name="publicMessage" rows="3">${escapeHtml(publicMessage)}</textarea>
      </label>
      <label>
        ${escapeHtml(labels.proposedPayloadJson)}
        <textarea name="proposedPayload" rows="7">${escapeHtml(payloadJson)}</textarea>
      </label>
      <label>
        ${escapeHtml(labels.reviewEditReason)}
        <input name="reason" value="${escapeHtml(labels.defaultReviewEditReason)}" required />
      </label>
      <button type="submit">${escapeHtml(labels.saveEdit)}</button>
    </form>
  `;
}

function reviewRevealSummary(payload) {
  const proposals = payload?.revealProposals;
  if (Array.isArray(proposals) && proposals.length > 0) {
    return proposals
      .map((proposal) => `${proposal.entityType}: ${proposal.entityId}`)
      .join(", ");
  }
  if (typeof payload?.clueId === "string") {
    return `clue: ${payload.clueId}`;
  }
  return undefined;
}

function reviewStatePatchSummary(payload) {
  const patch = payload?.statePatch;
  if (!patch || typeof patch !== "object") {
    return undefined;
  }
  return [patch.op, patch.path].filter(Boolean).join(" ");
}

function renderFact(label, value) {
  return `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value ?? "")}</dd></div>`;
}

function renderCombatControls(combat, labels) {
  const combatantOptions = renderCombatantOptions(combat);
  const patchForms =
    combatantOptions.length === 0
      ? ""
      : `
    <form data-command="combat.patch_hp" class="tm-inline-form">
      <label>
        ${escapeHtml(labels.combatant)}
        <select name="combatantId" required>
          ${combatantOptions}
        </select>
      </label>
      <label>
        ${escapeHtml(labels.currentHp)}
        <input name="currentHp" type="number" min="0" required />
      </label>
      <button type="submit" data-command="combat.patch_hp">${escapeHtml(labels.patchHp)}</button>
    </form>
    <form data-command="combat.patch_condition" class="tm-inline-form">
      <label>
        ${escapeHtml(labels.combatant)}
        <select name="combatantId" required>
          ${combatantOptions}
        </select>
      </label>
      <label>
        ${escapeHtml(labels.condition)}
        <input name="condition" required />
      </label>
      <label>
        ${escapeHtml(labels.action)}
        <select name="action">
          <option value="apply">${escapeHtml(labels.apply)}</option>
          <option value="remove">${escapeHtml(labels.remove)}</option>
        </select>
      </label>
      <button type="submit" data-command="combat.patch_condition">${escapeHtml(labels.patchCondition)}</button>
    </form>`;

  return `
    <div class="tm-command-row">
      <button type="button" data-command="combat.start">${escapeHtml(labels.startEncounter)}</button>
      <button type="button" data-command="combat.advance_turn">${escapeHtml(labels.advanceTurn)}</button>
      <button type="button" data-command="combat.end">${escapeHtml(labels.endCombat)}</button>
    </div>
    ${patchForms}
  `;
}

function renderCombatantOptions(combat) {
  return (combat?.combatants ?? [])
    .map(
      (combatant) =>
        `<option value="${escapeHtml(combatant.id)}">${escapeHtml(combatant.displayName ?? combatant.id)}</option>`,
    )
    .join("");
}

function renderSessionComplete(labels) {
  return `
    <form data-command="session.complete" class="tm-inline-form">
      <label>
        ${escapeHtml(labels.ending)}
        <input name="ending" value="Repair the Lantern" required />
      </label>
      <button type="submit" data-command="session.complete">${escapeHtml(labels.completeSession)}</button>
    </form>
  `;
}

function playerReadiness(players) {
  const playerRows = players.filter((player) => player.role === "player");
  const ready = playerRows.filter((player) => player.characterId).length;
  return {
    ready,
    target: Math.max(2, playerRows.length),
  };
}

function hostNextStep(input) {
  if (!input.room) {
    return input.labels.nextCreateRoom;
  }
  if (!input.adventureSnapshot) {
    return input.labels.nextLoadDemoAdventure;
  }
  const readiness = playerReadiness(Object.values(input.snapshot?.players ?? {}));
  if (readiness.ready < 2) {
    return input.labels.nextWaitForPlayers;
  }
  if (input.snapshot?.phase === "lobby") {
    return input.labels.nextReadyToStart;
  }
  if (input.snapshot?.phase === "playing") {
    return input.labels.nextRunAi;
  }
  if (input.snapshot?.phase === "combat") {
    return input.labels.nextResolveCombat;
  }
  if (input.snapshot?.phase === "ended") {
    return input.labels.nextReadRecap;
  }
  return undefined;
}
