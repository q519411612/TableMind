# 018 MVP-1.0 Live AI Playtest - Design

## Responsibility

MVP-1.0 adds live AI provider use behind a room-aware safety wrapper.

Existing lower-level orchestrator functions can remain pure/mocked, but UI/transport should call a room-aware function that understands room state, Host review queue, committed events, rules engine routing, and broadcasts.

## Proposed module boundary

Suggested module:

```txt
apps/server/src/ai-room-runner.mjs
```

Suggested API:

```ts
type RunAiTurnForRoomInput = {
  roomId: string;
  triggerEventId?: string;
  adapter: AiAdapter;
  hostPlayerId: string;
  now: string;
  randomSource?: RandomSource;
};

type RunAiTurnForRoomResult = {
  status:
    | "broadcast_ready"
    | "host_review_required"
    | "provider_disabled"
    | "rejected";
  events?: SessionEvent[];
  broadcasts?: RoomBroadcast[];
  reviewItem?: HostReviewItem;
  ruleResults?: RuleResult[];
  spoilerCheck?: SpoilerCheckResult;
};
```

The wrapper should delegate to existing AI DM orchestration where possible, but only the room-aware wrapper should commit events or create review items.

## AI context builder

Suggested module:

```txt
apps/server/src/ai-context-builder.mjs
```

Context should include:

- Host session snapshot;
- current adventure scene with DM-only context;
- player-safe public history summary;
- recent public messages;
- known unrevealed clues;
- DM-only secrets for spoiler checking;
- relevant compendium entries;
- combat state if active;
- explicit instruction that AI must not include dice results or direct state mutations.

Context should avoid:

- unrelated full event logs if too large;
- provider API keys;
- raw private player messages not intended for AI;
- commercial/non-authorized content.

## Provider configuration

Suggested config shape:

```ts
type AiProviderConfig = {
  enabled: boolean;
  endpoint?: string;
  apiKey?: string;
  model?: string;
  timeoutMs?: number;
};
```

Rules:

- provider disabled by default;
- missing config returns controlled error;
- tests use mock adapters;
- no secrets in repository;
- provider errors are summarized without leaking raw secrets.

## AI output policy

Auto-commit only when all are true:

- structured validation passes;
- spoiler guard allowed;
- confidence is not `low`;
- no `statePatch`;
- no `revealProposals`;
- no unsupported rule/action requests;
- output visibility is public-safe.

Host review required when any are true:

- spoiler risk is medium/high or blocked;
- confidence is low;
- reveal proposal exists;
- state patch proposal exists;
- unsupported action proposal exists;
- provider result is ambiguous.

Rejected immediately when:

- output schema is invalid;
- output fabricates dice results;
- output cannot be parsed;
- provider disabled/misconfigured.

## Rule request routing

Allowed AI rule requests for MVP-1.0:

- `skill_check`;
- `ability_check`;
- `saving_throw`.

Disallowed without Host command:

- attacks;
- damage;
- HP changes;
- condition changes;
- scene changes;
- clue reveals;
- arbitrary state patches.

The AI may propose those actions, but execution must route through Host review or explicit Host/player commands.

## Event commitment

For safe public output:

1. commit `ai.message` event;
2. commit `dice.rolled` events for any resolved rule requests if applicable;
3. return role-aware broadcasts.

For review-required output:

1. commit/create Host review item if MVP-0.7B supports eventized review;
2. return Host-only review payload;
3. do not broadcast public AI message.

## Eval strategy

Add golden tests with mocked adapters:

- safe narration auto-commits;
- exact DM-only secret is blocked;
- hidden entity alias is blocked;
- low confidence requires review;
- reveal proposal requires review;
- state patch requires review;
- fabricated dice results are rejected;
- unsupported attack request is rejected or review-required;
- skill check routes through rules engine with deterministic RNG;
- provider disabled returns controlled error.

These evals should not call a live provider.

## Playtest checklist

Add a document such as:

```txt
docs/playtests/MVP_1_0_PLAYTEST_CHECKLIST.md
```

Checklist should include:

- setup;
- participants;
- adventure fixture;
- Host controls verified;
- AI enabled config check;
- spoiler watchlist;
- required scene/check/combat/recap events;
- post-session feedback questions.

## Playtest report template

Add a document such as:

```txt
docs/playtests/MVP_1_0_PLAYTEST_REPORT_TEMPLATE.md
```

Report fields:

- date/time;
- version/commit;
- participants;
- duration;
- adventure used;
- characters used;
- AI provider/model/config status;
- checks resolved;
- combat resolved;
- Host interventions;
- spoiler incidents;
- bugs/blockers;
- player feedback;
- Host feedback;
- recap generated;
- MVP-1.0 pass/fail decision.

## Completion policy

MVP-1.0 is complete only when:

- CI passes;
- golden AI evals pass;
- UI playtest acceptance passes;
- a live or live-simulated monitored playtest report is completed;
- no known critical DM-only leaks remain;
- blockers are either fixed or explicitly moved out of MVP-1.0.
