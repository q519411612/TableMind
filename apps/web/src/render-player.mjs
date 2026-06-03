import {
  escapeHtml,
  ownCharacters,
  renderCombat,
  renderDiceLog,
  renderEmpty,
  renderEventFeed,
  renderMarkdown,
} from "./render-utils.mjs";

export function renderPlayerRoom(input = {}) {
  const snapshot = input.snapshot;
  const scene = input.adventureSnapshot?.currentScene;

  return `
    <main class="tm-shell tm-player" data-viewer-role="player">
      <header class="tm-topbar">
        <div>
          <p class="tm-kicker">Player Room</p>
          <h1>${escapeHtml(input.roomId ?? "Join a room")}</h1>
        </div>
        <button type="button" data-action="refresh-snapshot">Refresh</button>
      </header>

      ${renderJoinPanel(input)}

      <section class="tm-grid">
        <article class="tm-panel tm-panel-wide" data-panel="scene">
          <h2>Current Scene</h2>
          ${renderPlayerScene(snapshot, scene)}
        </article>

        <article class="tm-panel" data-panel="character">
          <h2>Character</h2>
          ${renderCharacters(snapshot, input.playerId)}
        </article>

        <article class="tm-panel tm-panel-wide" data-panel="feed">
          <h2>Public Feed</h2>
          ${renderEventFeed(snapshot?.eventLog ?? [])}
          ${renderMessageForm(snapshot)}
        </article>

        <article class="tm-panel" data-panel="dice">
          <h2>Dice Log</h2>
          ${renderDiceLog(snapshot?.diceLog ?? [])}
        </article>

        <article class="tm-panel tm-panel-wide" data-panel="combat">
          <h2>Combat</h2>
          ${renderCombat(snapshot?.combat)}
          ${renderAttackForm(snapshot)}
        </article>

        <article class="tm-panel tm-panel-wide" data-panel="recap">
          <h2>Recap</h2>
          ${renderMarkdown(input.recap?.markdown)}
        </article>
      </section>
    </main>
  `;
}

function renderJoinPanel(input) {
  if (input.playerId) {
    return "";
  }

  return `
    <section class="tm-panel tm-join">
      <form data-action="join-room">
        <label>
          Room ID
          <input name="roomId" value="${escapeHtml(input.roomId ?? "")}" required />
        </label>
        <label>
          Display name
          <input name="displayName" required />
        </label>
        <button type="submit">Join Room</button>
      </form>
    </section>
  `;
}

function renderPlayerScene(snapshot, scene) {
  if (!snapshot) {
    return renderEmpty("Join a room to see the scene.");
  }

  const title = scene?.title ?? snapshot.currentSceneId;
  const readAloud = scene?.readAloud?.text ?? "";
  const clues = scene?.clues ?? [];

  return `
    <h3>${escapeHtml(title)}</h3>
    <p>${escapeHtml(readAloud)}</p>
    <ul class="tm-list">
      ${clues
        .map(
          (clue) => `
            <li>
              <strong>${escapeHtml(clue.title ?? clue.id)}</strong>
              <span>${escapeHtml(clue.text ?? "")}</span>
            </li>
          `,
        )
        .join("")}
    </ul>
  `;
}

function renderCharacters(snapshot, playerId) {
  const characters = ownCharacters(snapshot, playerId);
  if (characters.length === 0) {
    return `
      ${renderEmpty("No character yet.")}
      <button type="button" data-action="create-character">Create Fighter</button>
    `;
  }

  return `<ul class="tm-list">${characters
    .map(
      (character) => `
        <li>
          <strong>${escapeHtml(character.name)}</strong>
          <span>${escapeHtml(character.className)} level ${escapeHtml(character.level)}</span>
          <span>AC ${escapeHtml(character.armorClass)}</span>
          <span>HP ${escapeHtml(character.hitPoints?.current)}/${escapeHtml(
            character.hitPoints?.max,
          )}</span>
        </li>
      `,
    )
    .join("")}</ul>`;
}

function renderMessageForm(snapshot) {
  if (!snapshot) {
    return "";
  }

  return `
    <form data-action="send-message" class="tm-inline-form">
      <label>
        Message
        <input name="message" required />
      </label>
      <button type="submit">Send</button>
    </form>
  `;
}

function renderAttackForm(snapshot) {
  if (!snapshot?.combat) {
    return "";
  }

  return `
    <form data-action="combat-attack" class="tm-inline-form">
      <label>
        Target
        <input name="targetCombatantId" required />
      </label>
      <button type="submit">Attack</button>
    </form>
  `;
}
