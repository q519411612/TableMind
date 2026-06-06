# Live Provider Dry Run Attempt Report - 2026-06-06

> Status: Failed at provider startup preflight. This is a real execution
> attempt report, not a completed supervised live-provider session report.
> No API key, session token, private provider payload, or secret value is
> recorded here.

## Session

- Date/time: 2026-06-06 04:40:15 CST
- Version/commit: `main` at `867ad92`
- Duration: Under 5 minutes; stopped at provider preflight.
- Pass/fail decision: Fail. The supervised live-provider dry run could not
  start because mandatory provider environment variables were not present in
  the local process environment.

## Participants

- Host: Not assigned; room was not created in live-provider mode.
- Player 1: Not assigned; room was not created in live-provider mode.
- Player 2: Not assigned; room was not created in live-provider mode.
- Optional Player 3: Not used.
- Optional Player 4: Not used.

## Adventure

- Adventure: The Lantern Beneath the Hill.
- Source: Original TableMind fixture intended for the run.
- Characters used: Not created in live-provider mode.
- Scenes reached: Not reached in live-provider mode.
- Ending: Not reached in live-provider mode.

## AI Provider

- AI provider enabled: Requested with `TABLEMIND_AI_PROVIDER_ENABLED=true`.
- Provider/model: Not recorded. Provider endpoint and model were not available
  in the current process environment.
- Config source: Local environment variables.
- Live provider calls made: No. The server failed before listening, so no
  provider network request was made.
- Provider errors: Startup preflight error:
  `TABLEMIND_AI_PROVIDER_ENDPOINT is required when AI provider is enabled`.

## Spoiler And Review

- Spoiler incidents: Not observed; live-provider room did not start.
- Low-confidence review items: Not observed.
- Reveal proposal review items: Not observed.
- State patch proposal review items: Not observed.
- Host interventions: Not executed.
- Approved AI messages: None.
- Edited AI messages: None.
- Rejected AI messages: None.

## Rules And Combat

- Rules checks resolved: None in live-provider mode.
- Dice outcomes: None in live-provider mode.
- Unsupported AI actions rejected: Not observed.
- Combat encounter: Hill Scavengers was not started in live-provider mode.
- Combat rounds: None.
- Player attacks resolved: None in live-provider mode.
- Host combat overrides: None.

## Recap

- Player recap generated: No; live-provider session did not start.
- Host recap generated: No; live-provider session did not start.
- Player recap DM-only leak check: Not executed.
- Host recap unresolved threads: Not generated.

## Blockers And Feedback

- Blockers: Required live-provider environment variables were absent from the
  local process environment. Presence check showed
  `TABLEMIND_AI_PROVIDER_ENABLED`, `TABLEMIND_AI_PROVIDER_ENDPOINT`,
  `TABLEMIND_AI_PROVIDER_API_KEY`, and `TABLEMIND_AI_PROVIDER_MODEL` were not
  configured. Optional `TABLEMIND_AI_PROVIDER_TIMEOUT_MS` was also not
  configured.
- Bugs: No application bug confirmed. The startup gate correctly failed early
  instead of running an unconfigured provider.
- Player feedback: Not collected.
- Host feedback: Not collected.
- Follow-up work: Export the documented provider variables in the local shell,
  keep secrets out of git and reports, then rerun the supervised Host plus
  two-player dry run.

## Decision Notes

This attempt does not satisfy MVP-1.0 live-provider completion evidence. It
does provide evidence that the provider startup gate fails early when the live
provider is explicitly enabled but mandatory configuration is missing. A
completed live-provider report still needs to record provider status, spoiler
events, Host interventions, rules outcomes, combat outcomes, recap status,
blockers, and pass/fail after an actual supervised session.
