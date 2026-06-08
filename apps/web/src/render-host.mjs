import { renderLanguageSwitcher, uiText } from "./i18n.mjs";
import {
  escapeHtml,
  renderCombat,
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
          <p>${escapeHtml(labels.paused)}: ${escapeHtml(Boolean(snapshot?.flags?.aiPaused?.value))}</p>
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
          ${renderEventFeed(snapshot?.eventLog ?? [], labels)}
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
    .map(
      (item) => `
        <li>
          <strong>${escapeHtml(item.type)} ${escapeHtml(item.riskLevel)}</strong>
          <span>${escapeHtml(item.reason)}</span>
          <pre>${escapeHtml(JSON.stringify(item.proposedPayload, null, 2))}</pre>
          <button type="button" data-command="host.review.update" data-action-value="approve" data-review-id="${escapeHtml(
            item.id,
          )}">${escapeHtml(labels.approve)}</button>
          <button type="button" data-command="host.review.update" data-action-value="edit" data-review-id="${escapeHtml(
            item.id,
          )}">${escapeHtml(labels.edit)}</button>
          <button type="button" data-command="host.review.update" data-action-value="reject" data-review-id="${escapeHtml(
            item.id,
          )}">${escapeHtml(labels.reject)}</button>
        </li>
      `,
    )
    .join("")}</ul>`;
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
