import assert from "node:assert/strict";
import { test } from "node:test";
import { createRoomService } from "../src/room-service.mjs";

function createRoom() {
  const service = createRoomService();
  const room = service.createRoom({
    hostDisplayName: "Host",
    rulesetId: "5e-srd-5.2.1",
    adventureModuleId: "adventure_lantern_beneath_hill",
    startingSceneId: "scene_village_square",
    now: "2026-06-02T05:00:00.000Z",
  });
  const player = service.joinRoom({
    roomId: room.roomId,
    displayName: "Ada",
    now: "2026-06-02T05:01:00.000Z",
  });
  return { service, room, player };
}

test("Host review queue stores pending AI output and is Host-only", () => {
  const { service, room } = createRoom();
  const item = service.addHostReviewItem({
    roomId: room.roomId,
    type: "ai_output",
    proposedPayload: { publicMessage: "Unsafe output." },
    reason: "Spoiler guard blocked output.",
    riskLevel: "high",
    now: "2026-06-02T05:02:00.000Z",
  });

  assert.equal(item.id, "review_0001");
  assert.equal(item.status, "pending");
  assert.equal(service.getCommittedEvents(room.roomId).at(-1).type, "host.review.created");
  assert.equal(
    service.getCommittedEvents(room.roomId).at(-1).reviewItem.reason,
    "Spoiler guard blocked output.",
  );
  assert.equal(
    service.getHostReviewQueue({
      roomId: room.roomId,
      viewerRole: "host",
    })[0].reason,
    "Spoiler guard blocked output.",
  );
  assert.throws(
    () =>
      service.getHostReviewQueue({
        roomId: room.roomId,
        viewerRole: "player",
      }),
    /forbidden/,
  );
});

test("Host can approve, reject, and edit review items", () => {
  const { service, room } = createRoom();
  const first = service.addHostReviewItem({
    roomId: room.roomId,
    type: "ai_output",
    proposedPayload: { publicMessage: "First." },
    reason: "Needs approval.",
    riskLevel: "medium",
    now: "2026-06-02T05:02:00.000Z",
  });
  const second = service.addHostReviewItem({
    roomId: room.roomId,
    type: "reveal",
    proposedPayload: { clueId: "clue_old_record" },
    reason: "Reveal proposed.",
    riskLevel: "low",
    now: "2026-06-02T05:03:00.000Z",
  });

  const approved = service.updateHostReviewItem({
    roomId: room.roomId,
    hostPlayerId: room.hostPlayerId,
    itemId: first.id,
    action: "approve",
    reason: "Safe to send.",
    now: "2026-06-02T05:04:00.000Z",
  });
  const edited = service.updateHostReviewItem({
    roomId: room.roomId,
    hostPlayerId: room.hostPlayerId,
    itemId: second.id,
    action: "edit",
    proposedPayload: { clueId: "clue_broken_lens" },
    now: "2026-06-02T05:05:00.000Z",
  });
  const rejected = service.updateHostReviewItem({
    roomId: room.roomId,
    hostPlayerId: room.hostPlayerId,
    itemId: second.id,
    action: "reject",
    reason: "Too early.",
    now: "2026-06-02T05:06:00.000Z",
  });

  assert.equal(approved.status, "approved");
  assert.equal(edited.status, "edited");
  assert.equal(rejected.status, "rejected");
  assert.deepEqual(
    service.getCommittedEvents(room.roomId).slice(-3).map((event) => [
      event.type,
      event.action,
      event.itemId,
    ]),
    [
      ["host.review.updated", "approve", first.id],
      ["host.review.updated", "edit", second.id],
      ["host.review.updated", "reject", second.id],
    ],
  );
});

test("approved public AI messages are committed and broadcast as player-safe events", () => {
  const { service, room, player } = createRoom();
  const review = service.addHostReviewItem({
    roomId: room.roomId,
    type: "ai_output",
    proposedPayload: { publicMessage: "The lantern flickers back to life." },
    reason: "Needs approval.",
    riskLevel: "low",
    now: "2026-06-02T05:02:00.000Z",
  });
  service.updateHostReviewItem({
    roomId: room.roomId,
    hostPlayerId: room.hostPlayerId,
    itemId: review.id,
    action: "approve",
    reason: "Safe narration.",
    now: "2026-06-02T05:03:00.000Z",
  });

  const committed = service.commitApprovedAiMessage({
    roomId: room.roomId,
    hostPlayerId: room.hostPlayerId,
    reviewItemId: review.id,
    message: "The lantern flickers back to life.",
    now: "2026-06-02T05:04:00.000Z",
  });

  assert.equal(committed.event.type, "ai.message");
  assert.equal(committed.event.visibility, "public");
  assert.equal(committed.event.reviewItemId, review.id);
  assert.equal(committed.event.reviewStatus, "approved");
  assert.deepEqual(
    committed.broadcasts.map((broadcast) => [
      broadcast.playerId,
      broadcast.event.type,
      broadcast.event.proposedPayload,
    ]),
    [
      [room.hostPlayerId, "ai.message", undefined],
      [player.playerId, "ai.message", undefined],
    ],
  );
});
