# TableMind Spec Matrix: MVP-0.7 to MVP-1.0

This supplemental matrix extends the existing spec matrix after the local engine MVP hardening pass.

## Releases

| Release | Spec | Priority | Depends on | Output |
|---|---|---:|---|---|
| MVP-0.7 | `015-mvp-07-eventized-room-core` | P0 | 003,004,005,008,009,010,011,012,013 | Typed room lifecycle/review/AI events and replay acceptance |
| MVP-0.8 | `016-mvp-08-transport-contract` | P0 | 015 | Command dispatcher, local HTTP API, event stream smoke |
| MVP-0.9 | `017-mvp-09-playtest-ui` | P1 | 016 | Minimal Host/player browser UI for local/mock playtest |
| MVP-1.0 | `018-mvp-1-0-live-ai-playtest` | P1 | 015,016,017 | Live AI provider playtest behind Host review and safety gates |

## Dependency graph

```txt
003-domain-model-event-log
  -> 015-mvp-07-eventized-room-core
      -> 016-mvp-08-transport-contract
          -> 017-mvp-09-playtest-ui
              -> 018-mvp-1-0-live-ai-playtest
```

## Suggested implementation order

### 1. MVP-0.7A lifecycle eventization

Implement:

- `player.joined`
- `character.created`
- `adventure.loaded`
- `session.started`
- replay acceptance coverage

Do not implement:

- HTTP server;
- browser UI;
- live provider calls;
- persistent database.

### 2. MVP-0.7B review and AI message eventization

Implement:

- `host.review.created`
- `host.review.updated`
- `ai.message.committed`
- player-safe event projection tests

Do not implement:

- automatic AI state mutation;
- unsupervised AI broadcast for risky output.

### 3. MVP-0.8A command dispatcher

Implement:

- first-party command schema;
- command dispatcher over `createRoomService`;
- typed success/error results;
- role authorization tests.

Do not implement:

- complex production auth;
- durable storage;
- framework-specific business logic.

### 4. MVP-0.8B HTTP API smoke

Implement:

- local HTTP server entry point;
- create room, join room, send action, get snapshot endpoints;
- request/response validation;
- no player DM-only leak tests.

Do not implement:

- account registration;
- payments;
- external content ingestion.

### 5. MVP-0.8C event stream smoke

Implement:

- SSE or WebSocket adapter behind first-party event stream boundary;
- role-aware broadcast delivery;
- reconnect/snapshot behavior.

Do not implement:

- distributed rooms;
- multi-process scaling;
- production subscription infrastructure.

### 6. MVP-0.9A player UI skeleton

Implement:

- join flow;
- public feed;
- current scene;
- character summary;
- dice/combat display.

Do not implement:

- full map/grid/tokens;
- complex character builder.

### 7. MVP-0.9B Host UI controls

Implement:

- room creation;
- invite link;
- DM-only panel;
- clue/scene/combat/session controls;
- review queue controls.

Do not implement:

- public adventure marketplace;
- production user roles outside room Host/player.

### 8. MVP-0.9C UI playtest acceptance

Implement:

- simulated UI playtest using mock AI;
- player-safe DOM/content assertions;
- recap display smoke.

Do not implement:

- live provider calls.

### 9. MVP-1.0A room-aware live AI wrapper

Implement:

- `runAiTurnForRoom` or equivalent;
- provider adapter config gates;
- Host review integration;
- rule request routing to deterministic tools.

Do not implement:

- AI direct state mutation;
- unsafe automatic reveal/state patch.

### 10. MVP-1.0B AI eval gates

Implement:

- golden AI-turn evals;
- spoiler regression scenarios;
- schema rejection tests;
- provider-disabled behavior.

Do not implement:

- benchmark theater without product acceptance.

### 11. MVP-1.0C live playtest finalization

Implement:

- playtest checklist;
- playtest report template;
- final MVP-1.0 acceptance test/report.

Do not implement:

- public launch automation;
- monetization;
- full campaign memory.
