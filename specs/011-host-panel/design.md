# 011 Host Panel - Design

## Panel sections

MVP Host panel should include:

1. Current scene
2. Hidden context
3. Clues and reveal controls
4. NPC/monster state
5. Combat state
6. AI review queue
7. Manual override controls

## Review item model

```ts
type HostReviewItem = {
  id: string;
  sessionId: string;
  type: "ai_output" | "state_patch" | "reveal" | "rule_request";
  proposedPayload: unknown;
  reason: string;
  riskLevel?: "low" | "medium" | "high";
  status: "pending" | "approved" | "rejected" | "edited";
  createdAt: string;
};
```

## Host actions

```ts
type HostAction =
  | { type: "review.approve"; itemId: string }
  | { type: "review.reject"; itemId: string; reason?: string }
  | { type: "review.edit"; itemId: string; payload: unknown }
  | { type: "scene.change"; sceneId: string; reason: string }
  | { type: "clue.reveal"; clueId: string; reason: string }
  | { type: "state.patch"; patch: JsonPatchOperation[]; reason: string }
  | { type: "ai.pause" }
  | { type: "ai.resume" };
```

## Event logging

Every Host action that changes gameplay must create a `HostOverrideEvent` or specific typed event.

## UI constraints

The first UI can be simple and utilitarian. Correctness matters more than aesthetics.

## Safety constraints

Host panel may display DM-only data. It must only be accessible to the Host role.
