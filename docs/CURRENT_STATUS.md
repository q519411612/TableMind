# TableMind Current Status

Updated: 2026-06-06

## Simulated MVP Status

The repository supports a local, mock-provider MVP flow for the original demo adventure, "The Lantern Beneath the Hill." The simulated path can create a room, join two players, create MVP characters, load the adventure, start the session, run a safe AI turn through a mock adapter, resolve a deterministic skill check, reveal a clue, run combat, complete the session, and generate player and Host recaps.

This status does not mean live-provider playtest readiness is complete. The default automated suite must still avoid live provider calls, and live-provider use remains an explicitly supervised internal playtest activity.

## Implemented Items

- Eventized room lifecycle: `player.joined`, `character.created`, `adventure.loaded`, and `session.started`.
- Eventized Host review audit and public AI message commitment: `host.review.created`, `host.review.updated`, and `ai.message`.
- Replay and projection coverage for lifecycle, review audit, rejected AI output, and player-safe recap.
- First-party command dispatcher in `apps/server/src/room-actions.mjs` with typed success/error results and role checks.
- Local HTTP adapter in `apps/server/src/http-server.mjs` for room create, join, actions, snapshots, adventure snapshots, and SSE subscriptions.
- SSE event stream hub in `apps/server/src/room-event-stream.mjs`.
- Static zero-dependency Host/player UI under `apps/web`.
- Room-aware mock/live-provider boundary through `buildAiContextForRoom`, `runAiTurnForRoom`, `loadAiProviderConfig`, and `createProviderAiAdapter`.
- Provider-disabled default behavior and mocked provider tests.
- Spoiler guard, review-required AI output paths, fabricated dice rejection, unsupported AI attack rejection, and deterministic skill-check routing.
- Playtest checklist, report template, and simulated MVP report under `docs/playtests`.
- Phase 1.1 hardening: player SSE no longer exposes Host review, `state.patch`, or `host.override` event type strings; `projectAdventureForPlayers` no longer exposes hidden raw IDs or encounter combatants; resolved AI checks commit structured check data; HTTP bad input returns typed 4xx responses.

## Partially Implemented Items

- `projectAdventureForPlayers` is now safe for direct player transport, but runtime adventure snapshots use a separate room-service projection path. Both paths have player-safety tests.
- HTTP role projection is covered, but there is still no direct HTTP test proving the adventure-snapshot endpoint excludes known demo fixture DM-only text.
- Hidden entity aliases are covered at the spoiler-guard unit level, but not yet as a full AI-turn golden test.
- Context building includes current Host room/adventure context and recent public history, but it does not yet enforce a context-size guard or summary strategy.
- Provider configuration is implemented in code, but the exact local environment variable names are not documented in an operator-facing setup guide.
- Player recap excludes rejected AI output. Player transport/SSE now hides Host review and patch event type metadata, but there is not yet a focused regression for AI `privateMessages` payloads.
- A simulated playtest report exists. A live-provider monitored playtest report is still deferred.

## Deferred Blockers Before Live-Provider Playtest

- Add a context-size guard or summary strategy before large sessions or larger adventures.
- Document live-provider environment variables and setup commands without recording secrets.
- Add direct HTTP adventure-snapshot leak regression using known demo fixture DM-only IDs/text.
- Add AI-turn hidden entity alias golden coverage, not only spoiler-guard unit coverage.
- Add a player transport/SSE regression for AI private payloads.
- Run and record an actual supervised live-provider playtest with participants, provider status, spoiler incidents, Host interventions, rules outcomes, combat outcomes, recap status, blockers, and a pass/fail decision.

## Verification Note

The project requires Node 20 or newer. In this workspace, `/usr/local/bin/node` is Node 16.20.2 and cannot run the suite correctly because it lacks required runtime APIs. Use the bundled Node executable from the local workspace dependencies or another Node 20+ runtime for verification.
