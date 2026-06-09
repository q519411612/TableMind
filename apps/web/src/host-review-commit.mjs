export async function commitReviewedPublicMessageIfNeeded(client, reviewItem, action) {
  if (!["approve", "edit"].includes(action)) {
    return undefined;
  }

  const message = reviewItem?.proposedPayload?.publicMessage;
  if (typeof message !== "string" || message.trim().length === 0) {
    return undefined;
  }

  return client.commitAiMessage(
    message.trim(),
    reviewItem.id,
    action === "edit" ? "edited" : "approved",
  );
}
