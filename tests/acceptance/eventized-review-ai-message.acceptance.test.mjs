import assert from "node:assert/strict";
import { test } from "node:test";
import { createRoomService } from "../../apps/server/src/room-service.mjs";
import { renderPlayerRoom } from "../../apps/web/src/render-player.mjs";
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

test("edited and rejected review payloads stay out of player snapshots, UI, and recaps", async () => {
  const adventure = await loadAdventureFixture(
    "packages/shared-test-fixtures/adventures/the-lantern-beneath-the-hill.md",
  );
  const service = createRoomService();
  const room = service.createRoom({
    hostDisplayName: "Host",
    rulesetId: adventure.rulesetId,
    adventureModuleId: adventure.id,
    startingSceneId: adventure.startingSceneId,
    now: "2026-06-02T13:00:00.000Z",
  });
  const player = service.joinRoom({
    roomId: room.roomId,
    displayName: "Ada",
    now: "2026-06-02T13:01:00.000Z",
  });
  const privateReviewText = "Only Ada should see the sealed shrine confession.";
  const rejectedSpoilerText = adventure.truth[0].text;
  const safeEditedMessage = "The lantern hums, but its secret remains hidden.";

  const rejected = service.addHostReviewItem({
    roomId: room.roomId,
    type: "ai_output",
    proposedPayload: {
      publicMessage: rejectedSpoilerText,
      privateMessages: [
        {
          playerId: player.playerId,
          message: privateReviewText,
        },
      ],
    },
    reason: "Spoiler guard blocked output.",
    riskLevel: "high",
    now: "2026-06-02T13:02:00.000Z",
  });
  service.updateHostReviewItem({
    roomId: room.roomId,
    hostPlayerId: room.hostPlayerId,
    itemId: rejected.id,
    action: "reject",
    reason: "Contains hidden truth.",
    now: "2026-06-02T13:03:00.000Z",
  });

  const edited = service.addHostReviewItem({
    roomId: room.roomId,
    type: "ai_output",
    proposedPayload: {
      publicMessage: "Draft mentions the sealed shrine.",
      privateMessages: [
        {
          playerId: player.playerId,
          message: privateReviewText,
        },
      ],
      statePatch: {
        op: "replace",
        path: "/phase",
        value: "ended",
      },
    },
    reason: "AI proposed a state patch.",
    riskLevel: "high",
    now: "2026-06-02T13:04:00.000Z",
  });
  service.updateHostReviewItem({
    roomId: room.roomId,
    hostPlayerId: room.hostPlayerId,
    itemId: edited.id,
    action: "edit",
    reason: "Removed hidden truth and state mutation.",
    proposedPayload: {
      publicMessage: safeEditedMessage,
    },
    now: "2026-06-02T13:05:00.000Z",
  });
  service.commitApprovedAiMessage({
    roomId: room.roomId,
    hostPlayerId: room.hostPlayerId,
    reviewItemId: edited.id,
    reviewStatus: "edited",
    message: safeEditedMessage,
    now: "2026-06-02T13:06:00.000Z",
  });

  const events = service.getCommittedEvents(room.roomId);
  const hostState = service.getSnapshot({
    roomId: room.roomId,
    viewerRole: "host",
  });
  const playerState = service.getSnapshot({
    roomId: room.roomId,
    viewerRole: "player",
    viewerPlayerId: player.playerId,
  });
  const playerRecap = generateSessionRecap({
    sessionState: hostState,
    events,
    adventure,
    viewerRole: "player",
  });
  const playerHtml = renderPlayerRoom({
    roomId: room.roomId,
    playerId: player.playerId,
    snapshot: playerState,
    recap: playerRecap,
  });

  assert.ok(playerHtml.includes(safeEditedMessage));
  assert.ok(playerRecap.markdown.includes(safeEditedMessage));
  for (const serialized of [
    JSON.stringify(playerState),
    playerHtml,
    playerRecap.markdown,
  ]) {
    assert.equal(serialized.includes(rejectedSpoilerText), false);
    assert.equal(serialized.includes(privateReviewText), false);
    assert.equal(serialized.includes("host.review"), false);
    assert.equal(serialized.includes("state.patch"), false);
    assert.equal(serialized.includes("proposedPayload"), false);
  }
});
