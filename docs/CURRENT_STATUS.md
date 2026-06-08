# TableMind Current Status

Updated: 2026-06-09

## MVP Status

The repository supports a local, mock-provider browser demo flow for the original demo adventure, "The Lantern Beneath the Hill" / "山丘下的灯火." The browser-oriented path can create a Host room, copy an invite link, join two players, create demo-ready characters, load the adventure, start the session, run a safe AI turn through the room boundary, resolve a deterministic skill check, reveal a clue, run combat, complete the session, and render player and Host recaps.

The current local demo UI is text-first and playtest-focused. It includes fixed UI labels in English and Simplified Chinese, preserves `?lang=` and localStorage locale behavior, and uses explicit Simplified Chinese authored adventure text for the built-in Lantern demo. Missing localized authored fields preserve canonical source text.

A supervised live-provider dry run has passed the required dry-run coverage. The evidence report is `docs/playtests/LIVE_PROVIDER_DRY_RUN_REPORT_2026-06-06_DEEPSEEK.md`; that report remains the source of truth for observed run details, and this status page must not copy, overwrite, or invent report fields.

Production readiness remains deferred. The DeepSeek run was validated through a temporary local structured-response bridge, not a permanent first-party DeepSeek integration. The default automated suite must still avoid live provider calls, and live-provider use remains an explicitly supervised internal playtest activity.

A second supervised live-provider run attempt is recorded in `docs/playtests/LIVE_PROVIDER_SECOND_RUN_REPORT_2026-06-07_DEEPSEEK.md`. That attempt passed pre-run automated verification, completed a narrow automated DeepSeek structured bridge smoke with two live provider calls, and later confirmed a manual browser UI combat path. It is not completion evidence for the second human run because structured Host/player feedback and recap evidence remain incomplete, and the manual browser pass exposed an unrevealed-clue spoiler incident.

## Implemented Items

- Eventized room lifecycle: `player.joined`, `character.created`, `adventure.loaded`, and `session.started`.
- Eventized Host review audit and public AI message commitment: `host.review.created`, `host.review.updated`, and `ai.message`.
- Replay and projection coverage for lifecycle, review audit, rejected AI output, and player-safe recap.
- First-party command dispatcher in `apps/server/src/room-actions.mjs` with typed success/error results and role checks.
- Local HTTP adapter in `apps/server/src/http-server.mjs` for room create, join, actions, snapshots, adventure snapshots, and SSE subscriptions.
- SSE event stream hub in `apps/server/src/room-event-stream.mjs`.
- Static zero-dependency Host/player UI under `apps/web`.
- Browser Host/player setup flow for one Host and two players with invite links,
  readiness hints, projected player views, friendly command errors, and bilingual
  fixed UI labels.
- Explicit `zh-CN` authored text on the built-in Lantern demo adventure, with
  locale-aware Host/player adventure snapshots and player no-leak coverage.
- Combat UI displays round, active combatant, turn order, HP, AC, conditions,
  attack and damage outcomes, and Host HP/condition patch controls derived from
  projected combat state.
- Host review UI summarizes type, risk, reason, public message, reveal proposals,
  and state patch proposals, with approve/reject/edit controls.
- Session recap generation supports English and Simplified Chinese fixed labels
  and can use explicit localized authored adventure text when provided.
- Room-aware mock/live-provider boundary through `buildAiContextForRoom`, `runAiTurnForRoom`, `loadAiProviderConfig`, and `createProviderAiAdapter`.
- Provider-disabled default behavior and mocked provider tests.
- Documented temporary DeepSeek structured-response bridge contract in `docs/providers/DEEPSEEK_STRUCTURED_RESPONSE_BRIDGE.md`.
- Mock-based provider bridge regression coverage for safe auto-commit, reveal review, timeout, request failure, preflight redaction, and invalid payload rejection.
- Spoiler guard, review-required AI output paths, unrevealed clue title/text/alias matching, fabricated dice rejection, unsupported AI attack rejection, and deterministic skill-check routing.
- Playtest checklist, report template, simulated MVP report, and demo acceptance
  evidence under `docs/playtests`.
- Player SSE no longer exposes Host review, `state.patch`, or `host.override` event type strings.
- `projectAdventureForPlayers` no longer exposes hidden raw IDs or encounter combatants.
- Resolved model-requested checks commit structured check data.
- HTTP bad input returns typed 4xx responses.

## Live-Provider Readiness Gates

- Context-size guard: `buildAiContextForRoom` bounds recent public history deterministically while retaining session basics, current localized scene, unrevealed clues, DM-only secrets for spoiler checks, hidden entities, and combat state.
- Provider setup: `docs/playtests/LIVE_PROVIDER_SETUP.md` documents local environment variables with placeholder-only commands and secret-handling rules.
- Temporary bridge contract: `docs/providers/DEEPSEEK_STRUCTURED_RESPONSE_BRIDGE.md` documents the request shape, structured response shape, timeout behavior, error behavior, no-secret logging rules, and Host review requirements for a local DeepSeek bridge.
- Player HTTP adventure snapshot: direct no-leak regression covers known demo fixture DM-only truth, hidden clue IDs, hidden encounter IDs, hidden NPC IDs, and hidden combatant data before reveal.
- Golden safety coverage: full runner/dispatcher tests cover hidden entity aliases, unrevealed clue title/text/alias review, localized clue alias review, and AI private payload exclusion from player SSE transport and public recap.
- Dry-run procedure: `docs/playtests/LIVE_PROVIDER_DRY_RUN.md` documents setup, Host plus two-player flow, required scene/check/combat/recap coverage, and evidence to record.
- Dry-run evidence: `docs/playtests/LIVE_PROVIDER_DRY_RUN_REPORT_2026-06-06_DEEPSEEK.md` records a supervised DeepSeek dry run that passed required dry-run coverage through the temporary bridge path.

## Current Decision

Status: local mock-provider browser demo is ready for internal demo use with the
documented limitations below. The second supervised live-provider human run is
still incomplete; automated DeepSeek bridge smoke passed; manual browser combat
completed with a spoiler incident found and addressed by the current code path.

The first supervised DeepSeek dry run passed for required dry-run coverage. The follow-up automated DeepSeek bridge smoke proved two live provider calls can pass through the structured bridge path, deterministic rule routing, Host review, rejection, combat, recap, and automated player no-leak checks. The later manual browser pass confirmed combat can be completed in the UI, but it also exposed unrevealed hatch-related clue content in public AI narration. The current automated suite protects unrevealed clue aliases and exact clue text, player projections, player SSE, player UI, and player recap paths. Do not claim production readiness, public launch readiness, permanent DeepSeek integration, or second-run completion. Existing evidence supports only supervised internal playtest attempts, not unsupervised public rooms, production auth, durable persistence, PDF import, full character building, or full VTT scope.

## Next Live Run Planning

- Schedule one Host and two players before attempting the second supervised run again.
- Export the documented local provider variables before starting the playtest server.
- Confirm the DeepSeek bridge or provider endpoint is reachable without recording secrets.
- Restart the playtest server after spoiler-guard or fixture changes before manual UI retesting.
- Collect Host and player feedback during the next live run.
- Intentionally exercise an unsupported AI action or rejection path if it can be done safely under Host supervision.
- Do not expand product scope before feedback from the next live run is collected and reviewed.

## Verification Note

The project requires Node 20 or newer. In this workspace, `/usr/local/bin/node` is Node 16.20.2 and cannot run the suite correctly because it lacks required runtime APIs. Use the bundled Node executable from the local workspace dependencies or another Node 20+ runtime for verification.

The local shell currently has no `npm` executable in `PATH`. Verification in
this workspace uses direct Node commands equivalent to the package scripts.
