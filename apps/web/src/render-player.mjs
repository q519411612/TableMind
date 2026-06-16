import { renderLanguageSwitcher, uiText } from "./i18n.mjs";
import { renderCombat } from "./render-combat.mjs";
import { renderEventFeed } from "./render-feed.mjs";
import { renderDiceLog } from "./render-rules-log.mjs";
import {
  escapeHtml,
  ownCharacters,
  renderEmpty,
  renderError,
  renderMarkdown,
  renderNotice,
  renderSessionPhaseBanner,
} from "./render-utils.mjs";

export function renderPlayerRoom(input = {}) {
  const snapshot = input.snapshot;
  const scene = input.adventureSnapshot?.currentScene;
  const labels = uiText(input.locale);
  const joined = hasJoinedPlayer(input);

  return `
    <main class="tm-shell tm-player tm-product-shell" data-viewer-role="player">
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
      <section class="tm-status-strip">
        ${renderError(input.errorMessage, labels)}
        ${renderSessionPhaseBanner({
          snapshot,
          labels,
          role: "player",
          joined,
          playerId: input.playerId,
        })}
        ${renderNotice(playerNextStep({ snapshot, playerId: input.playerId, joined, labels }), labels.nextStep)}
      </section>

      <section class="tm-session-layout" aria-label="${escapeHtml(labels.playerRoom)}">
        <section class="tm-session-main">
          <article class="tm-panel tm-panel-scene" data-panel="scene">
            <h2>${escapeHtml(labels.currentScene)}</h2>
            ${renderPlayerScene(snapshot, scene, labels)}
          </article>

          <article class="tm-panel tm-panel-composer" data-panel="action-composer">
            <h2>${escapeHtml(labels.actionComposer)}</h2>
            ${renderMessageForm(snapshot, input.playerId, labels)}
          </article>

          <article class="tm-panel" data-panel="feed">
            <h2>${escapeHtml(labels.narrativeFeed)}</h2>
            ${renderEventFeed(snapshot?.eventLog ?? [], labels, snapshot?.combat, input.adventureSnapshot, {
              viewerRole: "player",
            })}
          </article>
        </section>

        <aside class="tm-session-sidebar">
          <article class="tm-panel" data-panel="character-status">
            <h2>${escapeHtml(labels.characterStatus)}</h2>
            ${renderCharacters(snapshot, input.playerId, labels, joined)}
          </article>

          <article class="tm-panel" data-panel="dice">
            <h2>${escapeHtml(labels.diceLog)}</h2>
            ${renderDiceLog(snapshot?.diceLog ?? [], labels, snapshot?.eventLog ?? [], snapshot?.combat)}
          </article>

          <article class="tm-panel" data-panel="combat">
            <h2>${escapeHtml(labels.combat)}</h2>
            ${renderCombat(snapshot?.combat, labels)}
            ${renderAttackForm(snapshot, input.playerId, labels)}
          </article>

          <article class="tm-panel" data-panel="recap">
            <h2>${escapeHtml(labels.recap)}</h2>
            ${renderMarkdown(input.recap?.markdown, labels)}
          </article>
        </aside>
      </section>
    </main>
  `;
}

function renderJoinPanel(input, labels, joined) {
  if (joined) {
    return "";
  }

  return `
    <section class="tm-panel tm-join" data-panel="join">
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

function renderMessageForm(snapshot, playerId, labels) {
  if (!snapshot) {
    return "";
  }

  return `
    <div class="tm-action-composer">
      <p class="tm-action-availability">${escapeHtml(playerActionAvailability(snapshot, playerId, labels))}</p>
      <form data-action="send-message" class="tm-inline-form tm-action-form">
        <label>
          ${escapeHtml(labels.describeYourAction)}
          <input name="message" placeholder="${escapeHtml(labels.inspectArea)}" required />
        </label>
        <button type="submit">${escapeHtml(labels.sendAction)}</button>
      </form>
      <div class="tm-suggested-actions" aria-label="${escapeHtml(labels.suggestedActions)}">
        <strong>${escapeHtml(labels.suggestedActions)}</strong>
        <ul>
          ${[labels.inspectArea, labels.askNpc, labels.examineObject, labels.prepareForDanger]
            .map((suggestion) => `<li>${escapeHtml(suggestion)}</li>`)
            .join("")}
        </ul>
      </div>
    </div>
  `;
}

function renderAttackForm(snapshot, playerId, labels) {
  if (!snapshot?.combat) {
    return "";
  }

  const availability = combatAvailability(snapshot.combat, playerId, labels);

  if (!availability.canAct || !availability.attack || availability.targets.length === 0) {
    return `
      <div class="tm-combat-action-hint">
        <p>${escapeHtml(availability.hint)}</p>
        ${renderEmpty(labels.noAvailableAttack)}
      </div>
    `;
  }

  return `
    <div class="tm-combat-action-hint">
      <p>${escapeHtml(availability.hint)}</p>
      <form data-action="combat-attack" class="tm-inline-form tm-combat-attack-form">
        <input type="hidden" name="attackerCombatantId" value="${escapeHtml(availability.attacker.id)}" />
        <input type="hidden" name="attackId" value="${escapeHtml(availability.attack.id)}" />
        <label>
          ${escapeHtml(labels.target)}
          <select name="targetCombatantId" required>
            ${availability.targets
              .map(
                (target) =>
                  `<option value="${escapeHtml(target.id)}">${escapeHtml(target.displayName ?? target.id)}</option>`,
              )
              .join("")}
          </select>
        </label>
        <button type="submit">${escapeHtml(labels.attack)} ${escapeHtml(
          availability.attack.name ?? availability.attack.id,
        )}</button>
      </form>
    </div>
  `;
}

function playerActionAvailability(snapshot, playerId, labels) {
  if (ownCharacters(snapshot, playerId).length === 0) {
    return labels.nextCreateDemoCharacter;
  }
  if (snapshot.phase === "lobby") {
    return labels.nextWaitingHostStart;
  }
  if (snapshot.phase === "combat") {
    return combatAvailability(snapshot.combat, playerId, labels).hint;
  }
  if (snapshot.phase === "ended") {
    return labels.nextReadRecap;
  }
  return `${labels.describeYourAction}. ${labels.waitingForAiDm}.`;
}

function combatAvailability(combat, playerId, labels) {
  const active = (combat?.combatants ?? []).find(
    (combatant) => combatant.id === combat.activeCombatantId,
  );
  const attacker = active?.playerId === playerId ? active : undefined;
  const attack = attacker?.attacks?.[0];
  const targets = (combat?.combatants ?? []).filter(
    (combatant) =>
      combatant.id !== attacker?.id &&
      !["defeated", "dead", "fled", "inactive"].includes(combatant.status),
  );

  if (!attacker) {
    return {
      canAct: false,
      hint: `${labels.waitingForAnotherCombatant}: ${active?.displayName ?? active?.id ?? "?"}.`,
      targets: [],
    };
  }

  if (["defeated", "dead", "fled", "inactive"].includes(attacker.status)) {
    return {
      canAct: false,
      hint: labels.inactiveCombatantCannotAct,
      attacker,
      attack,
      targets,
    };
  }

  const attackName = attack?.name ?? attack?.id ?? "?";
  return {
    canAct: true,
    hint: `${labels.itIsYourTurn}. ${labels.availableAttack}: ${attackName}.`,
    attacker,
    attack,
    targets,
  };
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
    return combatAvailability(input.snapshot.combat, input.playerId, input.labels).hint;
  }
  if (input.snapshot?.phase === "ended") {
    return input.labels.nextReadRecap;
  }
  return undefined;
}
