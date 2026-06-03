import {
  escapeHtml,
  renderCombat,
  renderEmpty,
  renderEventFeed,
  renderMarkdown,
} from "./render-utils.mjs";

export function renderHostRoom(input = {}) {
  const snapshot = input.snapshot;
  const scene = input.adventureSnapshot?.currentScene;
  const room = input.room;

  return `
    <main class="tm-shell tm-host" data-viewer-role="host">
      <header class="tm-topbar">
        <div>
          <p class="tm-kicker">Host Console</p>
          <h1>${escapeHtml(room?.roomId ?? "Create room")}</h1>
        </div>
        <button type="button" data-action="refresh-snapshot">Refresh</button>
      </header>

      <section class="tm-grid">
        <article class="tm-panel" data-panel="create-room">
          <h2>Room</h2>
          <form data-action="create-room">
            <label>
              Host name
              <input name="hostDisplayName" value="Host" required />
            </label>
            <button type="submit">Create Room</button>
          </form>
          ${renderInvite(room)}
        </article>

        <article class="tm-panel" data-panel="players">
          <h2>Players</h2>
          ${renderPlayers(snapshot)}
        </article>

        <article class="tm-panel tm-panel-wide" data-panel="scene">
          <h2>Scene</h2>
          ${renderHostScene(snapshot, scene, input.adventureSnapshot?.truth ?? [])}
          ${renderAdventureControls(scene)}
        </article>

        <article class="tm-panel" data-panel="ai">
          <h2>AI</h2>
          <p>Paused: ${escapeHtml(Boolean(snapshot?.flags?.aiPaused?.value))}</p>
          <button type="button" data-command="ai.pause" data-paused="true">Pause AI</button>
          <button type="button" data-command="ai.pause" data-paused="false">Resume AI</button>
        </article>

        <article class="tm-panel tm-panel-wide" data-panel="review">
          <h2>Review Queue</h2>
          ${renderReviewQueue(input.reviewQueue ?? [])}
        </article>

        <article class="tm-panel tm-panel-wide" data-panel="feed">
          <h2>Audit Feed</h2>
          ${renderEventFeed(snapshot?.eventLog ?? [])}
        </article>

        <article class="tm-panel tm-panel-wide" data-panel="combat">
          <h2>Combat</h2>
          ${renderCombat(snapshot?.combat)}
          ${renderCombatControls()}
        </article>

        <article class="tm-panel tm-panel-wide" data-panel="recap">
          <h2>Recap</h2>
          ${renderSessionComplete()}
          ${renderMarkdown(input.recap?.markdown)}
        </article>
      </section>
    </main>
  `;
}

function renderInvite(room) {
  if (!room) {
    return renderEmpty("No active room.");
  }

  return `
    <dl class="tm-facts">
      <div><dt>Host ID</dt><dd>${escapeHtml(room.hostPlayerId)}</dd></div>
      <div><dt>Invite</dt><dd>${escapeHtml(room.inviteLink)}</dd></div>
    </dl>
  `;
}

function renderPlayers(snapshot) {
  const players = Object.values(snapshot?.players ?? {});
  if (players.length === 0) {
    return renderEmpty("No players yet.");
  }

  return `<ul class="tm-list">${players
    .map(
      (player) => `
        <li>
          <strong>${escapeHtml(player.displayName)}</strong>
          <span>${escapeHtml(player.role)}</span>
          <span>${escapeHtml(player.characterId ?? "No character")}</span>
        </li>
      `,
    )
    .join("")}</ul>`;
}

function renderHostScene(snapshot, scene, truth) {
  if (!snapshot) {
    return renderEmpty("Create a room to load the adventure.");
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

function renderAdventureControls(scene) {
  const clues = scene?.clues ?? [];

  return `
    <div class="tm-command-row">
      <button type="button" data-command="adventure.load">Load Demo Adventure</button>
      <button type="button" data-command="session.start">Start Session</button>
      <button type="button" data-command="scene.change">Change Scene</button>
    </div>
    <div class="tm-command-row">
      ${clues
        .map(
          (clue) =>
            `<button type="button" data-command="clue.reveal" data-clue-id="${escapeHtml(
              clue.id,
            )}">Reveal ${escapeHtml(clue.title ?? clue.id)}</button>`,
        )
        .join("")}
      <button type="button" data-command="clue.reveal">Reveal Clue</button>
    </div>
  `;
}

function renderReviewQueue(reviewQueue) {
  if (reviewQueue.length === 0) {
    return renderEmpty("No pending review items.");
  }

  return `<ul class="tm-list">${reviewQueue
    .map(
      (item) => `
        <li>
          <strong>${escapeHtml(item.type)} ${escapeHtml(item.riskLevel)}</strong>
          <span>${escapeHtml(item.reason)}</span>
          <pre>${escapeHtml(JSON.stringify(item.proposedPayload, null, 2))}</pre>
          <button type="button" data-command="host.review.update" data-action-value="approve" data-review-id="${escapeHtml(
            item.id,
          )}">Approve</button>
          <button type="button" data-command="host.review.update" data-action-value="edit" data-review-id="${escapeHtml(
            item.id,
          )}">Edit</button>
          <button type="button" data-command="host.review.update" data-action-value="reject" data-review-id="${escapeHtml(
            item.id,
          )}">Reject</button>
        </li>
      `,
    )
    .join("")}</ul>`;
}

function renderCombatControls() {
  return `
    <div class="tm-command-row">
      <button type="button" data-command="combat.start">Start Encounter</button>
      <button type="button" data-command="combat.advance_turn">Advance Turn</button>
      <button type="button" data-command="combat.end">End Combat</button>
    </div>
    <form data-command="combat.patch_hp" class="tm-inline-form">
      <label>
        Combatant
        <input name="combatantId" required />
      </label>
      <label>
        Current HP
        <input name="currentHp" type="number" min="0" required />
      </label>
      <button type="submit" data-command="combat.patch_hp">Patch HP</button>
    </form>
    <form data-command="combat.patch_condition" class="tm-inline-form">
      <label>
        Combatant
        <input name="combatantId" required />
      </label>
      <label>
        Condition
        <input name="condition" required />
      </label>
      <label>
        Action
        <select name="action">
          <option value="add">Add</option>
          <option value="remove">Remove</option>
        </select>
      </label>
      <button type="submit" data-command="combat.patch_condition">Patch Condition</button>
    </form>
  `;
}

function renderSessionComplete() {
  return `
    <form data-command="session.complete" class="tm-inline-form">
      <label>
        Ending
        <input name="ending" value="Repair the Lantern" required />
      </label>
      <button type="submit" data-command="session.complete">Complete Session</button>
    </form>
  `;
}
