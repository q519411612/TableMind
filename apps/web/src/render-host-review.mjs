import { escapeHtml, renderEmpty } from "./render-utils.mjs";

export function renderReviewQueue(reviewQueue, labels) {
  const pendingItems = reviewQueue.filter((item) => item.status === "pending");
  if (pendingItems.length === 0) {
    return renderReviewEmptyState(labels);
  }

  return `<ul class="tm-list tm-review-list">${pendingItems
    .map((item) => renderReviewItem(item, labels))
    .join("")}</ul>`;
}

export function renderReviewEmptyState(labels) {
  return `
    <div class="tm-review-empty">
      ${renderEmpty(labels.noPendingReviewItems)}
      <p>${escapeHtml(labels.reviewEmptySafePublicFlow)}</p>
      <p>${escapeHtml(labels.reviewEmptyRiskWait)}</p>
    </div>
  `;
}

export function renderReviewItem(item, labels) {
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
          `<div class="tm-review-risk-row"><span class="tm-risk-badge tm-risk-${escapeHtml(
            risk.level,
          )}" data-review-risk-level="${escapeHtml(risk.level)}" data-review-risk-original="${escapeHtml(
            item.riskLevel ?? "",
          )}">${escapeHtml(risk.label)}</span></div>`,
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

export function renderReviewSection(section, heading, bodyHtml) {
  return `
    <section class="tm-review-section tm-review-section-${escapeHtml(section)}" data-review-section="${escapeHtml(section)}">
      <h3>${escapeHtml(heading)}</h3>
      ${bodyHtml}
    </section>
  `;
}

export function renderReviewPublicMessage(payload, labels) {
  if (typeof payload?.publicMessage === "string" && payload.publicMessage.length > 0) {
    return `<p class="tm-review-public-message">${escapeHtml(payload.publicMessage)}</p>`;
  }
  return renderEmpty(labels.noPublicMessageProposal);
}

export function renderReviewRevealProposals(payload, labels) {
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

export function renderReviewStatePatchProposal(payload, labels) {
  const statePatchSummary = reviewStatePatchSummary(payload);
  if (!statePatchSummary) {
    return renderEmpty(labels.noStatePatchProposals);
  }
  return `<dl class="tm-facts tm-review-summary">${renderFact(labels.statePatch, statePatchSummary)}</dl>`;
}

export function renderReviewDecisionControls(item, labels) {
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
      <div class="tm-command-row tm-review-decision-actions">
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

export function renderReviewEditForm(item, labels) {
  const payloadJson = JSON.stringify(item.proposedPayload ?? {}, null, 2);
  const publicMessage = item.proposedPayload?.publicMessage ?? "";
  return `
    <form data-command="host.review.update" data-review-action="edit" class="tm-review-edit tm-review-edit-form">
      <input type="hidden" name="itemId" value="${escapeHtml(item.id)}" />
      <input type="hidden" name="action" value="edit" />
      <label>
        ${escapeHtml(labels.publicMessage)}
        <textarea name="publicMessage" rows="3" class="tm-review-textarea tm-review-public-textarea">${escapeHtml(publicMessage)}</textarea>
      </label>
      <label>
        ${escapeHtml(labels.proposedPayloadJson)}
        <textarea name="proposedPayload" rows="7" class="tm-review-textarea tm-review-payload-textarea">${escapeHtml(payloadJson)}</textarea>
      </label>
      <label>
        ${escapeHtml(labels.reviewEditReason)}
        <input name="reason" value="${escapeHtml(labels.defaultReviewEditReason)}" required />
      </label>
      <button type="submit">${escapeHtml(labels.saveEdit)}</button>
    </form>
  `;
}

export function reviewStatePatchSummary(payload) {
  const patch = payload?.statePatch;
  if (!patch || typeof patch !== "object") {
    return undefined;
  }
  return [patch.op, patch.path].filter(Boolean).join(" ");
}

export function reviewRiskView(riskLevel, labels) {
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
