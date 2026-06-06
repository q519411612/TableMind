# Live Provider Dry Run

This runbook is for the first supervised live-provider session. It documents how to execute the run and what evidence to collect. It is not a completed playtest report.

## Setup Checklist

- Confirm the branch, commit, and verification commands under test.
- Confirm `TABLEMIND_AI_PROVIDER_ENABLED` is `false` for normal automated tests.
- Configure provider variables locally using `LIVE_PROVIDER_SETUP.md`.
- Confirm no secrets are present in git status, docs, fixtures, shell snippets, or captured logs.
- Start the local server and browser UI in the normal playtest environment.
- Assign one Host and two players.
- Use `The Lantern Beneath the Hill` original fixture.
- Keep Host review visible for spoiler, low-confidence, reveal, and state-patch review items.
- When using DeepSeek through a local bridge, expect that reveal proposals can appear even during an otherwise safe rules/check flow. Treat those proposals as Host-review-required output, not safe narration.

## Host And Two-Player Flow

- Host creates a room and shares the invite link.
- Player 1 joins and creates or uses a level 1 character.
- Player 2 joins and creates or uses a level 1 character.
- Host loads the demo adventure and starts the session.
- Host confirms DM-only scene notes are visible only to Host.
- Players send public actions through the player UI.
- Host runs live AI turns only while supervising output and review state.
- Host approves, edits, or rejects review items before any risky output reaches players.
- Host confirms rejected risky review items do not appear in player HTTP responses, player SSE events, player UI, or player recap output.
- Host completes the session and generates both player and Host recaps.

## Required Coverage

- Scene: start in Village Square and reach Lantern Tower.
- Check: resolve at least one skill check, ability check, or saving throw through deterministic rules code.
- Spoiler guard: observe whether hidden truth, hidden aliases, unrevealed clues, or reveal proposals require Host review.
- Combat: start Hill Scavengers, resolve at least one player attack, and end combat.
- Recap: generate player recap and Host recap.

## Second Run Unsupported Action Checklist

Use this addendum for the second supervised live-provider run. The goal is to
validate the rejection path without expanding product scope.

- Safely attempt or simulate an unsupported AI action path under Host supervision.
- Prefer an action the MVP already treats as unsupported, such as AI-requested direct attack resolution, damage, HP changes, scene changes, clue reveals, or arbitrary state patches without the matching Host/player command.
- Verify the unsupported action is rejected or moved to Host review.
- Verify no unsupported action mutates authoritative room state directly.
- Verify no player-facing HTTP response, SSE event, UI surface, or recap leaks DM-only information, private AI payloads, rejected output, or unsupported action details.
- Record the attempted action, observed rejection or review result, state mutation check, player-facing leak check, and follow-up decision in `LIVE_PROVIDER_SECOND_RUN_REPORT_DRAFT.md`.

## Record During The Run

- Provider enabled status, endpoint reachability, model label, timeout setting, and provider errors.
- Spoiler incidents, blocked phrases or entities, and whether players saw any leaked DM-only content.
- Host interventions: pause, approve, edit, reject, reveal clue, change scene, combat control, complete session.
- Rules outcomes: request type, character, DC, roll formula, total, pass/fail.
- Combat outcomes: initiative order, attacks, damage, defeated or fleeing combatants, Host overrides.
- Recap status: player recap generated, Host recap generated, player recap no-leak result.
- Blockers: crashes, invalid AI output, stuck review flow, transport issues, UI issues, provider failures.
- Pass/fail decision with evidence.
- Do not record raw provider requests, raw provider responses, private provider payloads, authorization headers, API keys, session tokens, or private uploaded content.

## Completion Rule

The project is ready to attempt a supervised live-provider dry run when automated verification passes and this runbook is followed. The dry run is complete only after a report based on `MVP_1_0_PLAYTEST_REPORT_TEMPLATE.md` records the evidence above. Do not mark a real live-provider playtest as completed until that report exists.
