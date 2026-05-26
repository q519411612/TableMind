# TableMind Spec Matrix

This matrix maps PRD capabilities to implementation specs.

## Foundation

| Spec | Priority | Depends on | Output |
|---|---:|---|---|
| 001 Content Boundary | P0 | PRD | Content rules, source metadata, upload/privacy boundaries |
| 002 Project Foundation | P0 | none | Repo scaffold, packages, test setup |
| 003 Domain Model and Event Log | P0 | 002 | Core types, SessionState, SessionEvent, projection model |
| 006 Rules Engine | P0 | 003 | Deterministic dice/check/attack/damage APIs |
| 007 SRD Compendium | P0 | 001,003 | SRD entry schema, attribution, search contract |
| 014 Demo Adventure | P0 | 001,008 | Original one-shot fixture requirements |

## Multiplayer and player loop

| Spec | Priority | Depends on | Output |
|---|---:|---|---|
| 004 Realtime Room | P1 | 003 | Room lifecycle, websocket/server events, projections |
| 005 Character Sheet | P1 | 003,006 | Minimal 5e character model and validation |
| 012 Combat MVP | P1 | 003,006,005 | CombatState, initiative, turn handling, attacks |

## Content and orchestration

| Spec | Priority | Depends on | Output |
|---|---:|---|---|
| 008 Adventure Importer | P1 | 001,003 | Structured Markdown parser, AdventureModule schema |
| 009 AI DM Orchestrator | P1 | 003,006,007,008 | Context builder, structured AI output, rule request routing |
| 010 Spoiler Guard | P1 | 001,003,008,009 | Output leak checks, projection safety checks |
| 011 Host Panel | P1 | 003,009,010,012 | Review queue, manual overrides, Host controls |

## Post-session

| Spec | Priority | Depends on | Output |
|---|---:|---|---|
| 013 Session Recap | P2 | 003,010,012 | Player-safe and Host recap from event log |

## Suggested implementation milestones

### Milestone 1: Foundation without AI

Implement:

- 002 Project Foundation
- 003 Domain Model and Event Log
- 006 Rules Engine
- 007 SRD Compendium fixtures
- 014 Demo Adventure fixture shell

Exit criteria:

- tests run;
- dice/check/attack/damage work with deterministic tests;
- demo fixture can load;
- event replay skeleton works;
- no production LLM integration.

### Milestone 2: Single-room local gameplay skeleton

Implement:

- 004 Realtime Room basic state sync
- 005 Character Sheet MVP
- simple message/event persistence

Exit criteria:

- Host can create room;
- players can join;
- player messages become events;
- state projections filter DM-only data.

### Milestone 3: Adventure execution

Implement:

- 008 Adventure Importer structured Markdown
- demo adventure parsed fixture
- scene/clue/NPC projection

Exit criteria:

- Host can load demo adventure;
- current scene is available;
- clues/secrets have visibility.

### Milestone 4: AI DM mock orchestration

Implement:

- 009 AI DM Orchestrator with mock adapter
- 010 Spoiler Guard deterministic checks
- Host review queue basics

Exit criteria:

- mock AI response validates;
- unsafe output goes to Host review;
- rule requests route to rules engine.

### Milestone 5: Combat and Host control

Implement:

- 011 Host Panel core actions
- 012 Combat MVP

Exit criteria:

- Host can start combat;
- initiative/turns work;
- attacks and damage update state;
- Host can override.

### Milestone 6: Playtest-ready one-shot

Implement:

- 013 Session Recap
- UI cleanup
- real AI provider adapter behind feature flag

Exit criteria:

- 2–4 players can complete the demo adventure;
- recap can be generated;
- Host can pause/edit/override AI.

## Codex planning instruction

When generating an implementation plan, Codex should start with Milestone 1 only and explicitly list what it will not implement yet.
