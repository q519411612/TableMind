import { renderLanguageSwitcher, uiText } from "./i18n.mjs";
import {
  escapeHtml,
  ownCharacters,
  renderCombat,
  renderDiceLog,
  renderEmpty,
  renderError,
  renderEventFeed,
  renderMarkdown,
  renderNotice,
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
      ${renderError(input.errorMessage, labels)}
      ${renderNotice(playerNextStep({ snapshot, playerId: input.playerId, joined, labels }), labels.nextStep)}

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
          ${renderEventFeed(snapshot?.eventLog ?? [], labels, snapshot?.combat)}
          ${renderMessageForm(snapshot, labels)}
        </article>

        <article class="tm-panel" data-panel="dice">
          <h2>${escapeHtml(labels.diceLog)}</h2>
          ${renderDiceLog(snapshot?.diceLog ?? [], labels, snapshot?.eventLog ?? [], snapshot?.combat)}
        </article>

        <article class="tm-panel tm-panel-wide" data-panel="combat">
          <h2>${escapeHtml(labels.combat)}</h2>
          ${renderCombat(snapshot?.combat, labels)}
          ${renderAttackForm(snapshot, input.playerId, labels)}
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

function renderAttackForm(snapshot, playerId, labels) {
  if (!snapshot?.combat) {
    return "";
  }

  const attacker = activePlayerCombatant(snapshot.combat, playerId);
  const attack = attacker?.attacks?.[0];
  const targets = (snapshot.combat.combatants ?? []).filter(
    (combatant) =>
      combatant.id !== attacker?.id &&
      !["defeated", "dead", "fled"].includes(combatant.status),
  );

  if (!attacker || !attack || targets.length === 0) {
    return renderEmpty(labels.noAvailableAttack);
  }

  return `
    <form data-action="combat-attack" class="tm-inline-form">
      <input type="hidden" name="attackerCombatantId" value="${escapeHtml(attacker.id)}" />
      <input type="hidden" name="attackId" value="${escapeHtml(attack.id)}" />
      <label>
        ${escapeHtml(labels.target)}
        <select name="targetCombatantId" required>
          ${targets
            .map(
              (target) =>
                `<option value="${escapeHtml(target.id)}">${escapeHtml(target.displayName ?? target.id)}</option>`,
            )
            .join("")}
        </select>
      </label>
      <button type="submit">${escapeHtml(labels.attack)} ${escapeHtml(attack.name ?? attack.id)}</button>
    </form>
  `;
}

function activePlayerCombatant(combat, playerId) {
  return (combat.combatants ?? []).find(
    (combatant) =>
      combatant.id === combat.activeCombatantId &&
      combatant.playerId === playerId &&
      !["defeated", "dead", "fled"].includes(combatant.status),
  );
}

function playerNextStep(input) {
  if (!input.joined) {
    return input.labels.nextJoinInvite;
  }
  if (ownCharacters(input.snapshot, input.playerId).length === 0) {
    return input.labels.nextCreateDemoCharacter;
  }
  if (input.snapshot?.phase === "lobby") {
    return input.labels.nextWaitingHostStart;
  }
  if (input.snapshot?.phase === "playing") {
    return input.labels.nextDescribeAction;
  }
  if (input.snapshot?.phase === "combat") {
    return input.labels.nextResolveCombat;
  }
  if (input.snapshot?.phase === "ended") {
    return input.labels.nextReadRecap;
  }
  return undefined;
}
