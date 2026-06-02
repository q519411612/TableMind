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

  assert.equal(
    service.updateHostReviewItem({
      roomId: room.roomId,
      hostPlayerId: room.hostPlayerId,
      itemId: first.id,
      action: "approve",
    }).status,
    "approved",
  );
  assert.equal(
    service.updateHostReviewItem({
      roomId: room.roomId,
      hostPlayerId: room.hostPlayerId,
      itemId: second.id,
      action: "edit",
      proposedPayload: { clueId: "clue_broken_lens" },
    }).status,
    "edited",
  );
  assert.equal(
    service.updateHostReviewItem({
      roomId: room.roomId,
      hostPlayerId: room.hostPlayerId,
      itemId: second.id,
      action: "reject",
      reason: "Too early.",
    }).status,
    "rejected",
  );
});
