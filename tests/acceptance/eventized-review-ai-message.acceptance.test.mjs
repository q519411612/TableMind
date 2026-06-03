import assert from "node:assert/strict";
import { test } from "node:test";
import { createRoomService } from "../../apps/server/src/room-service.mjs";
import { loadAdventureFixture } from "../../packages/adventure-loader/src/index.mjs";
import { generateSessionRecap } from "../../packages/session-recap/src/index.mjs";

test("MVP-0.7B review audit and approved AI messages stay player-safe", async () => {
  const adventure = await loadAdventureFixture(
    "packages/shared-test-fixtures/adventures/the-lantern-beneath-the-hill.md",
  );
  const service = createRoomService();
  const room = service.createRoom({
    hostDisplayName: "Host",
    rulesetId: adventure.rulesetId,
    adventureModuleId: adventure.id,
    startingSceneId: adventure.startingSceneId,
    now: "2026-06-02T12:00:00.000Z",
  });
  service.joinRoom({
    roomId: room.roomId,
    displayName: "Ada",
    now: "2026-06-02T12:01:00.000Z",
  });

  const rejected = service.addHostReviewItem({
    roomId: room.roomId,
    type: "ai_output",
    proposedPayload: {
      publicMessage: adventure.truth[0].text,
    },
    reason: "Spoiler guard blocked output.",
    riskLevel: "high",
    now: "2026-06-02T12:02:00.000Z",
  });
  service.updateHostReviewItem({
    roomId: room.roomId,
    hostPlayerId: room.hostPlayerId,
    itemId: rejected.id,
    action: "reject",
    reason: "Contains hidden truth.",
    now: "2026-06-02T12:03:00.000Z",
  });

  const approved = service.addHostReviewItem({
    roomId: room.roomId,
    type: "ai_output",
    proposedPayload: {
      publicMessage: "The lantern flickers back to life.",
    },
    reason: "Needs approval.",
    riskLevel: "low",
    now: "2026-06-02T12:04:00.000Z",
  });
  service.updateHostReviewItem({
    roomId: room.roomId,
    hostPlayerId: room.hostPlayerId,
    itemId: approved.id,
    action: "approve",
    reason: "Safe narration.",
    now: "2026-06-02T12:05:00.000Z",
  });
  const committed = service.commitApprovedAiMessage({
    roomId: room.roomId,
    hostPlayerId: room.hostPlayerId,
    reviewItemId: approved.id,
    message: "The lantern flickers back to life.",
    now: "2026-06-02T12:06:00.000Z",
  });

  const events = service.getCommittedEvents(room.roomId);
  const hostState = service.getSnapshot({
    roomId: room.roomId,
    viewerRole: "host",
  });
  const playerRecap = generateSessionRecap({
    sessionState: hostState,
    events,
    adventure,
    viewerRole: "player",
  });
  const hostRecap = generateSessionRecap({
    sessionState: hostState,
    events,
    adventure,
    viewerRole: "host",
  });

  assert.deepEqual(
    events.slice(-5).map((event) => event.type),
    [
      "host.review.created",
      "host.review.updated",
      "host.review.created",
      "host.review.updated",
      "ai.message",
    ],
  );
  assert.equal(committed.event.visibility, "public");
  assert.equal(playerRecap.markdown.includes(adventure.truth[0].text), false);
  assert.ok(playerRecap.markdown.includes("The lantern flickers back to life."));
  assert.ok(hostRecap.markdown.includes("Review created: Spoiler guard blocked output."));
  assert.ok(hostRecap.markdown.includes("Review approve: Safe narration."));
});
