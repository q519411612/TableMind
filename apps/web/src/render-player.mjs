import { renderLanguageSwitcher, uiText } from "./i18n.mjs";
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
  const labels = uiText(input.locale);
  const joined = hasJoinedPlayer(input);

  return `
    <main class="tm-shell tm-player" data-viewer-role="player">
      <header class="tm-topbar">
        <div>
          <p class="tm-kicker">${escapeHtml(labels.playerRoom)}</p>
          <h1>${escapeHtml(input.roomId ?? labels.joinARoom)}</h1>
        </div>
        <div class="tm-topbar-actions">
          ${renderLanguageSwitcher(input.locale)}
          <button type="button" data-action="refresh-snapshot">${escapeHtml(labels.refresh)}</button>
        </div>
      </header>

      ${renderJoinPanel(input, labels, joined)}

      <section class="tm-grid">
        <article class="tm-panel tm-panel-wide" data-panel="scene">
          <h2>${escapeHtml(labels.currentScene)}</h2>
          ${renderPlayerScene(snapshot, scene, labels)}
        </article>

        <article class="tm-panel" data-panel="character">
          <h2>${escapeHtml(labels.character)}</h2>
          ${renderCharacters(snapshot, input.playerId, labels, joined)}
        </article>

        <article class="tm-panel tm-panel-wide" data-panel="feed">
          <h2>${escapeHtml(labels.publicFeed)}</h2>
          ${renderEventFeed(snapshot?.eventLog ?? [], labels)}
          ${renderMessageForm(snapshot, labels)}
        </article>

        <article class="tm-panel" data-panel="dice">
          <h2>${escapeHtml(labels.diceLog)}</h2>
          ${renderDiceLog(snapshot?.diceLog ?? [], labels)}
        </article>

        <article class="tm-panel tm-panel-wide" data-panel="combat">
          <h2>${escapeHtml(labels.combat)}</h2>
          ${renderCombat(snapshot?.combat, labels)}
          ${renderAttackForm(snapshot, labels)}
        </article>

        <article class="tm-panel tm-panel-wide" data-panel="recap">
          <h2>${escapeHtml(labels.recap)}</h2>
          ${renderMarkdown(input.recap?.markdown, labels)}
        </article>
      </section>
    </main>
  `;
}

function renderJoinPanel(input, labels, joined) {
  if (joined) {
    return "";
  }

  return `
    <section class="tm-panel tm-join">
      <form data-action="join-room">
        <label>
          ${escapeHtml(labels.roomId)}
          <input name="roomId" value="${escapeHtml(input.roomId ?? "")}" required />
        </label>
        <label>
          ${escapeHtml(labels.displayName)}
          <input name="displayName" required />
        </label>
        <button type="submit">${escapeHtml(labels.joinRoom)}</button>
      </form>
    </section>
  `;
}

function renderPlayerScene(snapshot, scene, labels) {
  if (!snapshot) {
    return renderEmpty(labels.joinRoomToSeeScene);
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

function renderCharacters(snapshot, playerId, labels, joined) {
  const characters = ownCharacters(snapshot, playerId);
  if (characters.length === 0) {
    if (!joined) {
      return renderEmpty(labels.joinRoomToSeeScene);
    }
    return `
      ${renderEmpty(labels.noCharacterYet)}
      <button type="button" data-action="create-character">${escapeHtml(labels.createFighter)}</button>
    `;
  }

  return `<ul class="tm-list">${characters
    .map(
      (character) => `
        <li>
          <strong>${escapeHtml(character.name)}</strong>
          <span>${escapeHtml(character.className)} ${escapeHtml(labels.level)} ${escapeHtml(character.level)}</span>
          <span>AC ${escapeHtml(character.armorClass)}</span>
          <span>${escapeHtml(labels.hp)} ${escapeHtml(character.hitPoints?.current)}/${escapeHtml(
            character.hitPoints?.max,
          )}</span>
        </li>
      `,
    )
    .join("")}</ul>`;
}

function hasJoinedPlayer(input) {
  return Boolean(
    input.roomId &&
      input.playerId &&
      input.playerSessionToken &&
      input.snapshot,
  );
}

function renderMessageForm(snapshot, labels) {
  if (!snapshot) {
    return "";
  }

  return `
    <form data-action="send-message" class="tm-inline-form">
      <label>
        ${escapeHtml(labels.message)}
        <input name="message" required />
      </label>
      <button type="submit">${escapeHtml(labels.send)}</button>
    </form>
  `;
}

function renderAttackForm(snapshot, labels) {
  if (!snapshot?.combat) {
    return "";
  }

  return `
    <form data-action="combat-attack" class="tm-inline-form">
      <label>
        ${escapeHtml(labels.target)}
        <input name="targetCombatantId" required />
      </label>
      <button type="submit">${escapeHtml(labels.attack)}</button>
    </form>
  `;
}
