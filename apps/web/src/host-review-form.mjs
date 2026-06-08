const reviewActions = ["approve", "reject", "edit"];

export function buildHostReviewUpdateFromForm(formData) {
  const itemId = requireFormText(formData, "itemId");
  const action = requireFormText(formData, "action");
  const reason = requireFormText(formData, "reason");
  if (!reviewActions.includes(action)) {
    throw new Error(`Unsupported review action: ${action}`);
  }

  return {
    itemId,
    action,
    reason,
    proposedPayload:
      action === "edit" ? buildEditedProposedPayload(formData) : undefined,
  };
}

function buildEditedProposedPayload(formData) {
  const publicMessage = optionalFormText(formData, "publicMessage");
  const payloadText = optionalFormText(formData, "proposedPayload");
  if (!publicMessage && !payloadText) {
    throw new Error("Review edit requires publicMessage or proposedPayload.");
  }

  const proposedPayload = payloadText ? parsePayloadJson(payloadText) : {};
  if (publicMessage) {
    proposedPayload.publicMessage = publicMessage;
  }
  return proposedPayload;
}

function parsePayloadJson(value) {
  let parsed;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error("Invalid review payload JSON.");
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Review payload JSON must be an object.");
  }
  return parsed;
}

function requireFormText(formData, key) {
  const value = optionalFormText(formData, key);
  if (!value) {
    throw new Error(`${key} is required.`);
  }
  return value;
}

function optionalFormText(formData, key) {
  const value = formData.get(key);
  if (value === null || value === undefined) {
    return "";
  }
  if (typeof value !== "string") {
    throw new Error(`${key} must be text.`);
  }
  return value.trim();
}
