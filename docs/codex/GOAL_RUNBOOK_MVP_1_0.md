# Codex `/goal` Runbook: TableMind MVP-1.0

This runbook is a practical checklist for advancing TableMind with repeated Codex `/goal` sessions.

## Golden rule

One `/goal` should complete one milestone slice, produce tests, and stop.

Do not ask Codex to "finish MVP-1.0" in one pass. Use the milestone prompts in `specs/CODEX_GOAL_PROMPT.md`.

## Before each `/goal`

1. Pull latest `main`.
2. Confirm CI is green or note known failures.
3. Pick the earliest incomplete slice from `docs/roadmaps/MVP_0_7_to_1_0.md`.
4. Paste the matching prompt from `specs/CODEX_GOAL_PROMPT.md`.
5. Reject scope creep in review if the changes include future slices.

## During review

Check these first:

- Did the agent read the active spec and gates?
- Did it keep UI/transport/AI out of lower milestone slices?
- Did it add tests that fail without the implementation?
- Did it run or report the required commands?
- Did it preserve no-DM-leak guarantees?
- Did it avoid committing secrets or live provider calls in default tests?

## Merge checklist

Before merging a `/goal` output:

```bash
npm run check
npm test
npm run acceptance
npm run build
```

Then inspect:

- new event types and reducers;
- player vs Host projections;
- player recap filters;
- command authorization boundaries;
- transport responses;
- UI data source boundaries;
- provider feature flags and mocked tests.

## Stop and split conditions

Stop the `/goal` and split the work if it tries to:

- implement two milestone slices at once;
- introduce a large framework without a thin adapter boundary;
- call a live AI provider in default tests;
- add production auth/payment/persistence before MVP-1.0;
- implement full VTT map/token/fog/lighting features;
- ingest commercial D&D content;
- bypass Host review for risky AI output;
- put game logic in HTTP handlers or UI components.

## Final MVP-1.0 evidence

MVP-1.0 should not be declared complete until the repo contains:

- passing CI;
- MVP-0.7 replay acceptance;
- MVP-0.8 command/transport tests;
- MVP-0.9 UI playtest acceptance;
- MVP-1.0 AI eval gates;
- a completed playtest report for a 2–4 player demo one-shot;
- player and Host recaps from that playtest;
- documented known limitations and explicit non-goals.
