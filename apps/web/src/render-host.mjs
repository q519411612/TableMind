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
  renderSessionPhaseBanner,
} from "./render-utils.mjs";

const demoConditionOptions = [
  { id: "condition_prone", labelKey: "conditionProne" },
  { id: "condition_grappled", labelKey: "conditionGrappled" },
  { id: "condition_restrained", labelKey: "conditionRestrained" },
  { id: "condition_poisoned", labelKey: "conditionPoisoned" },
  { id: "condition_unconscious", labelKey: "conditionUnconscious" },
];

export function renderHostRoom(input = {}) {
  const snapshot = input.snapshot;
  const scene = input.adventureSnapshot?.currentScene;
  const room = input.room;
  const labels = uiText(input.locale);

  return `
    <main class="tm-shell tm-host tm-product-shell" data-viewer-role="host">
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

      <section class="tm-status-strip">
        ${renderError(input.errorMessage, labels)}
        ${renderNotice(input.statusMessage, labels.system)}
        ${renderSessionPhaseBanner({
          room,
          snapshot,
          adventureSnapshot: input.adventureSnapshot,
          labels,
          role: "host",
          reviewQueue: input.reviewQueue ?? [],
        })}
        ${renderNotice(
          hostNextStep({
            room,
            snapshot,
            adventureSnapshot: input.adventureSnapshot,
            labels,
            reviewQueue: input.reviewQueue ?? [],
          }),
          labels.nextStep,
        )}
      </section>

      <section class="tm-console-layout" aria-label="${escapeHtml(labels.hostConsole)}">
        <section class="tm-console-main">
          <article class="tm-panel tm-panel-room" data-panel="room-invite">
            <h2>${escapeHtml(labels.roomInvite)}</h2>
            <form data-action="create-room">
              <label>
                ${escapeHtml(labels.hostName)}
                <input name="hostDisplayName" value="Host" required />
              </label>
              <button type="submit">${escapeHtml(labels.createRoom)}</button>
            </form>
            ${renderInvite(room, labels)}
          </article>

          <article class="tm-panel tm-panel-scene" data-panel="scene">
            <h2>${escapeHtml(labels.currentScene)}</h2>
            ${renderHostScene(snapshot, scene, input.adventureSnapshot?.truth ?? [], labels)}
            ${renderAdventureControls(scene, labels)}
          </article>

          <article class="tm-panel tm-panel-controls" data-panel="ai-controls">
            <h2>${escapeHtml(labels.aiDmControls)}</h2>
            ${renderAiStatus(snapshot, labels)}
            <div class="tm-command-row">
              <button type="button" data-command="ai.turn.run">${escapeHtml(labels.runAi)}</button>
              <button type="button" data-command="ai.pause" data-paused="true">${escapeHtml(labels.pauseAi)}</button>
              <button type="button" data-command="ai.pause" data-paused="false">${escapeHtml(labels.resumeAi)}</button>
            </div>
          </article>

          <article class="tm-panel tm-panel-review" data-panel="review" data-boundary="host-only">
            <h2>${escapeHtml(labels.reviewQueue)}</h2>
            ${renderReviewQueue(input.reviewQueue ?? [], labels)}
          </article>
        </section>

        <aside class="tm-console-sidebar">
          <article class="tm-panel" data-panel="players-readiness">
            <h2>${escapeHtml(labels.playersReadiness)}</h2>
            ${renderPlayers(snapshot, labels)}
          </article>

          <article class="tm-panel" data-panel="dice">
            <h2>${escapeHtml(labels.diceLog)}</h2>
            ${renderDiceLog(snapshot?.diceLog ?? [], labels, snapshot?.eventLog ?? [], snapshot?.combat)}
          </article>

          <article class="tm-panel" data-panel="combat">
            <h2>${escapeHtml(labels.combat)}</h2>
            ${renderCombat(snapshot?.combat, labels)}
            ${renderCombatControls(snapshot?.combat, labels)}
          </article>

          <article class="tm-panel" data-panel="feed">
            <h2>${escapeHtml(labels.auditFeed)}</h2>
            ${renderEventFeed(snapshot?.eventLog ?? [], labels, snapshot?.combat, input.adventureSnapshot, {
              viewerRole: "host",
            })}
          </article>

          <article class="tm-panel" data-panel="recap">
            <h2>${escapeHtml(labels.recap)}</h2>
            ${renderSessionComplete(labels)}
            ${renderMarkdown(input.recap?.markdown, labels)}
          </article>
        </aside>
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
    .map((player) => {
      const characterLabel =
        player.characterId && snapshot?.characters?.[player.characterId]?.name
          ? snapshot.characters[player.characterId].name
          : player.characterId ?? labels.noCharacter;
      return `
        <li>
          <strong>${escapeHtml(player.displayName)}</strong>
          <span>${escapeHtml(player.role)}</span>
          <span>${escapeHtml(characterLabel)}</span>
          <span>${escapeHtml(player.role === "host" ? labels.hostConsole : player.characterId ? labels.ready : labels.needsCharacter)}</span>
        </li>
      `;
    })
    .join("")}</ul>
  `;
}

function renderHostScene(snapshot, scene, truth, labels) {
  if (!snapshot) {
    return renderEmpty(labels.createRoomToLoadAdventure);
  }

  return `
    <h3>${escapeHtml(scene?.title ?? snapshot.currentSceneId)}</h3>
    <p class="tm-scene-readaloud">${escapeHtml(scene?.readAloud?.text ?? "")}</p>
    <div class="tm-host-only-stack" data-boundary="host-only">
      <section class="tm-dm-note">
        <span class="tm-boundary-label">${escapeHtml(labels.hostOnly)}</span>
        <strong>${escapeHtml(labels.dmOnlyNotes)}</strong>
        <p>${escapeHtml(scene?.dmNotes?.text ?? "")}</p>
      </section>
      <section class="tm-hidden-truth">
        <span class="tm-boundary-label">${escapeHtml(labels.hostOnly)}</span>
        <strong>${escapeHtml(labels.hiddenTruth)}</strong>
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
      </section>
    </div>
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
    return renderReviewEmptyState(labels);
  }

  return `<ul class="tm-list">${pendingItems
    .map((item) => renderReviewItem(item, labels))
    .join("")}</ul>`;
}

function renderReviewEmptyState(labels) {
  return `
    <div class="tm-review-empty">
      ${renderEmpty(labels.noPendingReviewItems)}
      <p>${escapeHtml(labels.reviewEmptySafePublicFlow)}</p>
      <p>${escapeHtml(labels.reviewEmptyRiskWait)}</p>
    </div>
  `;
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
  const risk = reviewRiskView(item.riskLevel, labels);
  return `
    <li class="tm-review-card" data-review-id="${escapeHtml(item.id)}" data-review-risk-level="${escapeHtml(
      risk.level,
    )}">
      <div class="tm-review-overview">
        ${renderReviewSection(
          "status",
          labels.reviewStatusType,
          `<dl class="tm-facts tm-review-summary">
            ${renderFact(labels.reviewStatus, item.status)}
            ${renderFact(labels.reviewType, item.type)}
          </dl>`,
        )}
        ${renderReviewSection(
          "risk",
          labels.reviewRiskLevel,
          `<span class="tm-risk-badge tm-risk-${escapeHtml(risk.level)}" data-review-risk-level="${escapeHtml(
            risk.level,
          )}" data-review-risk-original="${escapeHtml(item.riskLevel ?? "")}">${escapeHtml(risk.label)}</span>`,
        )}
        ${renderReviewSection(
          "reason",
          labels.reviewRequiredWhy,
          `<p class="tm-review-reason">${escapeHtml(item.reason ?? "")}</p>`,
        )}
      </div>
      ${renderReviewSection(
        "public-message",
        labels.reviewPublicMessagePreview,
        renderReviewPublicMessage(item.proposedPayload, labels),
      )}
      ${renderReviewSection(
        "reveal-proposals",
        labels.reviewRevealProposals,
        renderReviewRevealProposals(item.proposedPayload, labels),
      )}
      ${renderReviewSection(
        "state-patch-proposals",
        labels.reviewStatePatchProposals,
        renderReviewStatePatchProposal(item.proposedPayload, labels),
      )}
      ${renderReviewDecisionControls(item, labels)}
      ${renderReviewSection(
        "edit",
        labels.reviewEditSection,
        `<p class="tm-review-help">${escapeHtml(labels.reviewEditConsequence)}</p>${renderReviewEditForm(
          item,
          labels,
        )}`,
      )}
    </li>
  `;
}

function renderReviewSection(section, heading, bodyHtml) {
  return `
    <section class="tm-review-section tm-review-section-${escapeHtml(section)}" data-review-section="${escapeHtml(section)}">
      <h3>${escapeHtml(heading)}</h3>
      ${bodyHtml}
    </section>
  `;
}

function renderReviewPublicMessage(payload, labels) {
  if (typeof payload?.publicMessage === "string" && payload.publicMessage.length > 0) {
    return `<p class="tm-review-public-message">${escapeHtml(payload.publicMessage)}</p>`;
  }
  return renderEmpty(labels.noPublicMessageProposal);
}

function renderReviewRevealProposals(payload, labels) {
  const proposals = [];
  if (Array.isArray(payload?.revealProposals)) {
    proposals.push(
      ...payload.revealProposals.map((proposal) => ({
        summary: `${proposal.entityType}: ${proposal.entityId}`,
        reason: proposal.reason,
      })),
    );
  }
  if (typeof payload?.clueId === "string") {
    proposals.push({
      summary: `clue: ${payload.clueId}`,
      reason: undefined,
    });
  }

  if (proposals.length === 0) {
    return renderEmpty(labels.noRevealProposals);
  }

  return `
    <ul class="tm-review-proposal-list">
      ${proposals
        .map(
          (proposal) => `
            <li>
              <strong>${escapeHtml(proposal.summary)}</strong>
              ${proposal.reason ? `<span>${escapeHtml(proposal.reason)}</span>` : ""}
            </li>
          `,
        )
        .join("")}
    </ul>
  `;
}

function renderReviewStatePatchProposal(payload, labels) {
  const statePatchSummary = reviewStatePatchSummary(payload);
  if (!statePatchSummary) {
    return renderEmpty(labels.noStatePatchProposals);
  }
  return `<dl class="tm-facts tm-review-summary">${renderFact(labels.statePatch, statePatchSummary)}</dl>`;
}

function renderReviewDecisionControls(item, labels) {
  return renderReviewSection(
    "decision-controls",
    labels.reviewHostDecisionControls,
    `
      <ul class="tm-review-decision-copy">
        <li><strong>${escapeHtml(labels.approve)}</strong><span>${escapeHtml(labels.reviewApproveConsequence)}</span></li>
        <li><strong>${escapeHtml(labels.reject)}</strong><span>${escapeHtml(labels.reviewRejectConsequence)}</span></li>
        <li><strong>${escapeHtml(labels.edit)}</strong><span>${escapeHtml(labels.reviewEditConsequence)}</span></li>
      </ul>
      <p class="tm-review-scope">${escapeHtml(labels.reviewCommitScope)}</p>
      <div class="tm-command-row">
        <button type="button" data-command="host.review.update" data-action-value="approve" data-review-id="${escapeHtml(
          item.id,
        )}">${escapeHtml(labels.approve)}</button>
        <button type="button" data-command="host.review.update" data-action-value="reject" data-review-id="${escapeHtml(
          item.id,
        )}">${escapeHtml(labels.reject)}</button>
      </div>
    `,
  );
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

function reviewStatePatchSummary(payload) {
  const patch = payload?.statePatch;
  if (!patch || typeof patch !== "object") {
    return undefined;
  }
  return [patch.op, patch.path].filter(Boolean).join(" ");
}

function reviewRiskView(riskLevel, labels) {
  const normalized = typeof riskLevel === "string" ? riskLevel.toLowerCase() : "";
  if (normalized === "low") {
    return { level: "low", label: labels.riskLow };
  }
  if (normalized === "medium") {
    return { level: "medium", label: labels.riskMedium };
  }
  if (normalized === "high") {
    return { level: "high", label: labels.riskHigh };
  }
  return {
    level: "unknown",
    label: riskLevel ? `${labels.riskUnknown} (${riskLevel})` : labels.riskUnknown,
  };
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
        <select name="condition" required>
          ${demoConditionOptions
            .map(
              (condition) =>
                `<option value="${escapeHtml(condition.id)}">${escapeHtml(labels[condition.labelKey])}</option>`,
            )
            .join("")}
        </select>
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
  const pendingReviewCount = Object.values(input.reviewQueue ?? {}).filter(
    (item) => item.status === "pending",
  ).length;
  if (pendingReviewCount > 0) {
    return `${input.labels.hostReviewRequired}: ${pendingReviewCount} ${
      pendingReviewCount === 1
        ? input.labels.pendingReviewItem
        : input.labels.pendingReviewItems
    }.`;
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
