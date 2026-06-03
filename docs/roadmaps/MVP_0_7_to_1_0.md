# TableMind Roadmap: MVP-0.7 to MVP-1.0

## Purpose

This roadmap turns the local MVP engine into a playtest-ready AI DM room.

The current engine already proves the core loop locally: deterministic state, event log, rules engine, adventure runtime, spoiler guard, Host controls, mock AI DM orchestration, combat, and recap. The next work should avoid scope creep and move through four verification-oriented releases:

1. **MVP-0.7 Eventized Room Core** — make room lifecycle and important state transitions replayable events.
2. **MVP-0.8 Transport Contract** — expose the room core through a command dispatcher and a thin local HTTP/SSE transport.
3. **MVP-0.9 Playtest UI** — build the smallest usable Host/player browser interface.
4. **MVP-1.0 Live AI Playtest** — add a room-aware live AI adapter behind feature flags and complete a monitored 2–4 player one-shot.

## Guiding constraints

- The LLM is not the source of truth.
- All dice and rule outcomes are produced by deterministic system tools.
- DM-only information must not leak into player snapshots, events, transport responses, UI, or recap.
- Host can pause, approve, edit, reject, override, and complete the session.
- Major state transitions are typed events, not untracked mutations.
- `state.patch` remains an emergency/Host override escape hatch, not the primary event model.
- MVP is a short 5e-compatible one-shot, not a full VTT.
- PDF import, full persistence, marketplace, full character builder, D&D Beyond sync, and full 5e automation remain out of MVP-1.0 unless explicitly re-scoped.

## MVP-0.7: Eventized Room Core

### Goal

Make committed events sufficient to reconstruct the session truth that matters for transport, audit, replay, and future persistence.

### Target specs

- `specs/015-mvp-07-eventized-room-core/requirements.md`
- `specs/015-mvp-07-eventized-room-core/design.md`
- `specs/015-mvp-07-eventized-room-core/tasks.md`

### Milestone slices

#### MVP-0.7A: lifecycle eventization

Implement typed events for:

- `player.joined`
- `character.created`
- `adventure.loaded`
- `session.started`

Acceptance gate:

- joining, character creation, adventure load, and session start are committed events;
- replay from an initial session state restores players, characters, `adventureModuleId`, `currentSceneId`, and `phase`;
- existing acceptance tests still pass.

#### MVP-0.7B: review and AI message eventization

Implement typed events for:

- `host.review.created`
- `host.review.updated`
- `ai.message.committed`

Acceptance gate:

- Host review queue changes are auditable;
- approved AI public messages can be committed as events;
- rejected/edited review payloads remain Host-only;
- player recap and player projections cannot leak rejected AI output.

### Exit criteria

- `committedEvents` can replay session state for all implemented gameplay-critical state.
- Direct state mutations remain only for runtime side state such as presence, room counters, or cached full adventure module content.
- `npm run check`, `npm test`, `npm run acceptance`, and `npm run build` pass.

## MVP-0.8: Transport Contract

### Goal

Wrap the room engine with a stable command/result contract, then add a thin local HTTP/SSE transport.

### Target specs

- `specs/016-mvp-08-transport-contract/requirements.md`
- `specs/016-mvp-08-transport-contract/design.md`
- `specs/016-mvp-08-transport-contract/tasks.md`

### Milestone slices

#### MVP-0.8A: command dispatcher

Implement `dispatchRoomCommand` or equivalent first-party command handler.

Acceptance gate:

- each supported command returns typed success/error results;
- command results include committed events and role-aware broadcast payloads where applicable;
- player commands cannot invoke Host-only actions.

#### MVP-0.8B: local HTTP API smoke

Implement a minimal local server adapter.

Acceptance gate:

- Host can create a room through HTTP;
- players can join through HTTP;
- player/Host snapshots are role-aware;
- no player response includes `dm_only` fields.

#### MVP-0.8C: event stream smoke

Implement a minimal event-stream adapter using SSE or a WebSocket adapter behind a first-party boundary.

Acceptance gate:

- connected viewers receive only their role-appropriate broadcasts;
- reconnect fetches current projected snapshot;
- disconnected runtime presence does not corrupt session replay.

### Exit criteria

- The transport layer is thin and contains no game rule logic.
- Command dispatcher remains testable without starting a network server.
- Local HTTP/event stream smoke tests pass.

## MVP-0.9: Playtest UI

### Goal

Build the smallest browser UI that lets one Host and 2–4 players complete the demo one-shot using the local/mock engine.

### Target specs

- `specs/017-mvp-09-playtest-ui/requirements.md`
- `specs/017-mvp-09-playtest-ui/design.md`
- `specs/017-mvp-09-playtest-ui/tasks.md`

### MVP UI scope

Player UI:

- room join flow;
- current scene/read-aloud display;
- public message feed;
- character summary;
- dice log;
- combat panel with active combatant, HP, target selection, and attack button.

Host UI:

- room creation and invite link;
- DM-only current scene view;
- clue reveal and scene change controls;
- AI pause/resume;
- review queue approve/edit/reject;
- combat controls;
- session complete and recap view.

### Exit criteria

- A simulated browser playtest can complete the demo adventure with mock AI.
- UI never uses Host snapshot data for player views.
- UI does not attempt full VTT features such as map grids, token movement, fog of war, or lighting.

## MVP-1.0: Live AI Playtest

### Goal

Run a monitored 2–4 player one-shot with a live AI provider, Host supervision, deterministic rules, spoiler checks, and session recap.

### Target specs

- `specs/018-mvp-1-0-live-ai-playtest/requirements.md`
- `specs/018-mvp-1-0-live-ai-playtest/design.md`
- `specs/018-mvp-1-0-live-ai-playtest/tasks.md`

### Required capabilities

- room-aware AI turn wrapper;
- provider config behind feature flag/env gate;
- Host review for low confidence, reveal proposals, state patches, or spoiler risk;
- structured output validation;
- golden AI-turn evals with spoiler guard and rules routing;
- playtest checklist and report template.

### Exit criteria

- 2–4 players can complete the original demo one-shot in 60–90 minutes.
- At least one skill/check flow and one combat flow are handled by deterministic code.
- Host can pause/edit/reject/approve AI output.
- No known DM-only truth leaks to player UI, player transport responses, player event streams, or player recap.
- Session recap is generated for player and Host audiences.

## Release gate summary

| Release | Must prove | Must not do |
|---|---|---|
| MVP-0.7 | Event replay integrity | Network server, UI, live AI |
| MVP-0.8 | Command/transport contract | Production auth, durable DB, full websocket infra if SSE is enough |
| MVP-0.9 | Browser playtest with mock/local AI | Full VTT, PDF import, marketplace |
| MVP-1.0 | Monitored live AI one-shot | Unsupervised public launch, full campaign memory, full 5e automation |

## Recommended `/goal` cadence

Use one `/goal` per milestone slice, not one `/goal` for all of MVP-1.0.

Recommended sequence:

1. MVP-0.7A lifecycle eventization.
2. MVP-0.7B review and AI message eventization.
3. MVP-0.8A command dispatcher.
4. MVP-0.8B local HTTP API smoke.
5. MVP-0.8C event stream smoke.
6. MVP-0.9A player UI skeleton.
7. MVP-0.9B Host UI controls.
8. MVP-0.9C UI playtest acceptance.
9. MVP-1.0A room-aware AI wrapper and provider config.
10. MVP-1.0B AI evals and safety gates.
11. MVP-1.0C live playtest checklist/report and final acceptance.
