# Live Provider Second Run Rerun Report - DeepSeek - 2026-06-07

> Status: Failed / blocked rerun attempt. This document records the rerun
> attempt made after PR #18 was present on `main`. It is not a passing second
> supervised human-run report because live-provider environment variables were
> unavailable in this execution, one Host plus two player participants were not
> present, structured feedback was not collected, and player/Host recaps were
> not generated and reviewed in a human run. Do not include API keys, bearer
> tokens, raw provider prompts/responses, session tokens, private provider
> payloads, or private player details in this report.

## Session Metadata And Commit

- Attempt date/time: 2026-06-08 15:43 CST.
- Requested report path date: 2026-06-07 rerun.
- Branch: `main`.
- Commit tested: `d1d6a607de3b59368f803c0b31ec0de8e2f9a40e`.
- PR #18 present on `main`: Yes. `git pull --ff-only origin main` reported
  already up to date, and `origin/main` pointed at the PR #18 merge commit.
- Runtime: bundled Node `v24.14.0`.
- Duration: Pre-run verification and server restart only. No valid live
  provider human session was completed.
- Pass/fail decision: Failed / blocked. Do not count this as the second
  supervised live-provider completion.

## Provider Model And Bridge Path

- AI provider enabled for the restarted server: No.
- Provider/model: Intended DeepSeek bridge path, but no model was exercised.
- Bridge path used: Not reached.
- Config source: Local environment variables only.
- Local provider environment status at attempt time:
  - `TABLEMIND_AI_PROVIDER_ENABLED`: unset.
  - `TABLEMIND_AI_PROVIDER_ENDPOINT`: unset.
  - `TABLEMIND_AI_PROVIDER_API_KEY`: unset.
  - `TABLEMIND_AI_PROVIDER_MODEL`: unset.
  - `TABLEMIND_AI_PROVIDER_TIMEOUT_MS`: unset.
- Live provider calls made: 0.
- Provider errors: None from provider calls because no provider call was made.
- Secret handling: No API keys, bearer tokens, raw provider prompts/responses,
  session tokens, or private provider payloads were recorded.

## Host And Player Participants

- Host: Not present for a live supervised run.
- Player 1: Not present for a live supervised run.
- Player 2: Not present for a live supervised run.
- Observer or note-taker: Automation operator only.
- Human-run validity: Not valid. The run did not include one Host and two
  players.

## Language Mode

- Requested language mode: English playtest content with the existing local UI
  language behavior.
- Actual language mode exercised: Not applicable. No live session was run.

## Pre-Run Verification

All required pre-run commands completed before the server restart:

- `node scripts/check-js.mjs`: Passed. Checked 59 JavaScript files.
- `node scripts/run-tests.mjs packages apps tests`: Passed. 133 tests, 0
  failures.
- `node scripts/run-tests.mjs tests/acceptance`: Passed. 12 tests, 0 failures.
- `node scripts/smoke-playtest-flow.mjs`: Passed with provider disabled. The
  scripted smoke ended `room_0001` at `scene_lantern_tower`.
- `git diff --check`: Passed with no whitespace errors.

## Server Restart

- Existing server before restart: A `node` process was listening on
  `127.0.0.1:3000`.
- Restart action: The existing process was stopped, then
  `scripts/start-playtest.mjs` was started from commit
  `d1d6a607de3b59368f803c0b31ec0de8e2f9a40e`.
- Restarted server URLs:
  - Host URL: `http://127.0.0.1:3000/host.html`.
  - Player URL: `http://127.0.0.1:3000/player.html`.
  - API base URL: `http://127.0.0.1:3000`.
- Restarted server provider mode: mock/disabled provider mode.
- Spoiler-fix restart requirement: The stale pre-fix server was removed, but
  the unrevealed-clue spoiler fix was not verified through a live DeepSeek
  browser run because provider configuration and participants were unavailable.

## Scenario Coverage

- Use The Lantern Beneath the Hill: Not completed in a live human run.
- Reach Village Square and Lantern Tower: Not completed in a live human run.
- Resolve at least one deterministic skill/ability/save check from live
  provider output: Not completed.
- Exercise at least one risky reveal or unsupported action path: Not completed
  in a live rerun.
- Verify risky output goes to Host review or controlled rejection: Not completed
  in a live rerun.
- Verify no direct state mutation from unsupported AI action: Not completed in
  a live rerun.
- Verify no player HTTP/SSE/UI/recap leak: Not completed in a live rerun.
- Start Hill Scavengers combat: Not completed in a live human run.
- Resolve at least one player attack: Not completed in a live human run.
- End combat and complete session: Not completed in a live human run.
- Generate player recap and Host recap: Not completed in a live human run.

## Rejection Path Result

- Unsupported or risky action attempted: None during a live rerun.
- Expected result: Host review or controlled rejection, no direct state
  mutation, and no player-facing leak.
- Actual result: Not observed in this attempt.
- Decision: Still pending a supervised live-provider rerun.

## Player No-Leak Result

- Automated provider-disabled smoke no-leak checks: Passed before restart.
- Live provider player HTTP no-leak check: Not run.
- Live provider player SSE no-leak check: Not run.
- Live provider player UI no-leak check: Not run.
- Live provider player recap no-leak check: Not run.
- Decision: Cannot claim the spoiler fix passed the required live rerun.

## Player Feedback

Feedback questions from `docs/playtests/SECOND_RUN_FEEDBACK_QUESTIONS.md` were
not collected because the human run did not occur.

- Player task clarity: Not collected.
- Join/character creation clarity: Not collected.
- AI felt like DM or generic chatbot: Not collected.
- Combat clarity: Not collected.
- Spoiler/confusion concerns: Not collected.
- Would play again: Not collected.
- First thing to improve: Not collected.

## Host Feedback

Feedback questions from `docs/playtests/SECOND_RUN_FEEDBACK_QUESTIONS.md` were
not collected because the human run did not occur.

- Host workload: Not collected.
- Review queue manageability: Not collected.
- Manual interventions: Not collected.
- Most annoying friction: Not collected.
- First thing to improve: Not collected.

## Combat UX Notes

- Combat encounter: Hill Scavengers was not reached in a live human rerun.
- Turn clarity: Not collected.
- Attack and damage clarity: Not collected.
- Host combat interventions: Not observed.
- Combat UX issues: Not observed in this attempt.

## Recap Usefulness

- Player recap generated: No.
- Host recap generated: No.
- Player recap usefulness: Not collected.
- Host recap usefulness: Not collected.
- Player recap no-leak result: Not run in the live rerun.

## Bugs / Blockers / Warnings

- Blocker: Required live provider environment variables were unavailable in the
  execution environment.
- Blocker: One Host plus two player participants were not available.
- Blocker: Structured Host/player feedback was not collected.
- Blocker: Player and Host recaps were not generated or reviewed in a human run.
- Warning: The restarted server is running with provider disabled, so it cannot
  satisfy the DeepSeek live-provider requirement.
- Warning: The spoiler fix remains covered by automated regression tests and
  the provider-disabled smoke, but still needs live-browser verification against
  the DeepSeek bridge path.
- Product-scope note: No durable DB, production auth, PDF import, full
  character builder, or VTT map work was added.

## Follow-Up Recommendations

- Export the documented `TABLEMIND_AI_PROVIDER_*` variables locally before
  starting the playtest server.
- Start or connect the temporary DeepSeek structured-response bridge without
  recording secrets.
- Restart the playtest server after the provider variables are present.
- Schedule one Host and two players before starting the run.
- Keep Host review visible and intentionally test one unrevealed clue or
  unsupported action path before continuing.
- Stop immediately and mark failed if any player-facing HTTP, SSE, UI, or recap
  surface leaks DM-only truth, rejected AI output, private provider payloads, or
  unsupported action details.
- Use `docs/playtests/SECOND_RUN_FEEDBACK_QUESTIONS.md` immediately after the
  run, then update this report or create a new dated report with the collected
  feedback and recap usefulness notes.

## Decision

This rerun attempt failed / was blocked before a valid live-provider session.
The second supervised human-run acceptance criteria remain open. Do not claim
MVP-1.0 completion, production readiness, public launch readiness, or permanent
DeepSeek integration from this attempt.
