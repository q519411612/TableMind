# TableMind Current Status

Updated: 2026-06-06

## Simulated MVP Status

The repository supports a local, mock-provider MVP flow for the original demo adventure, "The Lantern Beneath the Hill." The simulated path can create a room, join two players, create MVP characters, load the adventure, start the session, run a safe AI turn through a mock adapter, resolve a deterministic skill check, reveal a clue, run combat, complete the session, and generate player and Host recaps.

This status does not mean a real live-provider playtest has been completed. The default automated suite must still avoid live provider calls, and live-provider use remains an explicitly supervised internal playtest activity.

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
- Player SSE no longer exposes Host review, `state.patch`, or `host.override` event type strings.
- `projectAdventureForPlayers` no longer exposes hidden raw IDs or encounter combatants.
- Resolved model-requested checks commit structured check data.
- HTTP bad input returns typed 4xx responses.

## Live-Provider Readiness Gates

- Context-size guard: `buildAiContextForRoom` bounds recent public history deterministically while retaining session basics, current scene, unrevealed clues, DM-only secrets for spoiler checks, hidden entities, and combat state.
- Provider setup: `docs/playtests/LIVE_PROVIDER_SETUP.md` documents local environment variables with placeholder-only commands and secret-handling rules.
- Player HTTP adventure snapshot: direct no-leak regression covers known demo fixture DM-only truth, hidden clue IDs, hidden encounter IDs, hidden NPC IDs, and hidden combatant data before reveal.
- Golden safety coverage: full runner/dispatcher tests cover hidden entity aliases and AI private payload exclusion from player SSE transport and public recap.
- Dry-run procedure: `docs/playtests/LIVE_PROVIDER_DRY_RUN.md` documents setup, Host plus two-player flow, required scene/check/combat/recap coverage, and evidence to record.

## Current Decision

Status: ready to attempt a supervised live-provider dry run, pending a human-run session and completed report.

Do not claim MVP-1.0 live-provider completion until a real report records provider status, spoiler incidents, Host interventions, rules outcomes, combat outcomes, recap status, blockers, and a pass/fail decision.

## Verification Note

The project requires Node 20 or newer. In this workspace, `/usr/local/bin/node` is Node 16.20.2 and cannot run the suite correctly because it lacks required runtime APIs. Use the bundled Node executable from the local workspace dependencies or another Node 20+ runtime for verification.
