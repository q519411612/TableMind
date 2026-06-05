# Live Provider Dry Run Report - DeepSeek - 2026-06-06

> Status: Completed supervised live-provider dry run. Do not include API keys,
> session tokens, private provider payloads, or other secrets in this report.

## Session

- Date/time: 2026-06-06 04:58:03 CST
- Version/commit: `main` at `867ad92`
- Duration: Under 15 minutes for the final successful run.
- Pass/fail decision: Pass for the required dry-run coverage. This is
  live-provider dry-run evidence, not a broader production-readiness claim.

## Participants

- Host: `player_0001`
- Player 1: `player_0002` as Ada Thorne
- Player 2: `player_0003` as Bran Vale
- Optional Player 3: Not used.
- Optional Player 4: Not used.

## Adventure

- Adventure: The Lantern Beneath the Hill
- Source: TableMind Demo Fixture
- Characters used: Ada Thorne, Bran Vale
- Scenes reached: Village Square, Lantern Tower
- Ending: Repair the Lantern

## AI Provider

- AI provider enabled: Yes, with `TABLEMIND_AI_PROVIDER_ENABLED=true`.
- Provider/model: DeepSeek via local structured-response bridge,
  `deepseek-v4-flash`.
- Config source: Local environment variables. The provider endpoint was a
  temporary local bridge that translated TableMind structured requests to
  DeepSeek chat completions and returned TableMind structured JSON.
- Live provider calls made: 2 in the final successful room.
- Provider errors: None in the final successful room.
- Startup preflight: Passed. The server logged provider mode enabled, model,
  timeout, and API key configured without printing the key.
- Bridge status: Both final bridge calls returned successfully.

## Spoiler And Review

- Spoiler incidents: No player-facing DM-only leak observed.
- Low-confidence review items: None observed.
- Reveal proposal review items: 1. The second DeepSeek call intentionally
  proposed revealing `clue_broken_lens`; TableMind returned
  `host_review_required`.
- State patch proposal review items: None observed.
- Host interventions:
  - Host revealed `clue_broken_lens`.
  - Host changed scene to `scene_lantern_tower`.
  - Host rejected the risky AI review item.
  - Host started Hill Scavengers combat.
  - Host ended combat.
  - Host completed the session.
- Approved AI messages: 1 safe AI message was auto-approved and broadcast
  after validation.
- Edited AI messages: None.
- Rejected AI messages: 1 risky review item was rejected by Host.
- Additional provider observation: During an earlier bridge calibration room,
  DeepSeek unexpectedly proposed a reveal on the first AI turn. TableMind sent
  that output to Host review before player broadcast. No private payload was
  recorded.

## Rules And Combat

- Rules checks resolved:
  - `skill_check` for `char_ada`, skill `investigation`, DC 15.
- Dice outcomes:
  - Selected d20: 15.
  - Total: 20.
  - Result: success.
  - Reason: Inspect the lantern soot.
- Unsupported AI actions rejected: Not observed in this run.
- Combat encounter: Hill Scavengers.
- Combat rounds: Round 1 reached.
- Player attacks resolved:
  - Ada attacked `combatant_monster_hill_scavenger_1`.
  - Attack total: 20.
  - Hit: true.
  - Damage: 8.
  - Resulting target HP: 0.
- Host combat overrides:
  - Host ended combat with the remaining scavenger fleeing into the rain.

## Recap

- Player recap generated: Yes, 1122 characters.
- Host recap generated: Yes, 1635 characters.
- Player recap DM-only leak check: Passed. Player recap did not include Host
  Notes or `Secret: Broken Seal`.
- Host recap unresolved threads: Present. Host recap included Host Notes and
  `Secret: Broken Seal`.

## Blockers And Feedback

- Blockers: None in the final successful room.
- Bugs: None confirmed in the final successful room.
- Player feedback: Not collected.
- Host feedback: Not collected.
- Follow-up work:
  - Replace the temporary local bridge with a first-party provider adapter or
    documented bridge if DeepSeek remains a supported provider path.
  - Add a manual checklist note that DeepSeek may propose reveals even when
    prompted for a safe rules check, and Host review must remain visible.
  - Continue keeping provider keys out of reports, logs, shell snippets, and
    committed files.

## Decision Notes

The dry run passed the requested operational coverage: Host and two players,
Village Square to Lantern Tower, a deterministic skill check from live provider
output, reveal-proposal review, Hill Scavengers combat with one player attack,
session completion, and both player and Host recap generation. The run does not
claim production readiness or permanent DeepSeek integration because the final
provider path used a temporary local bridge rather than a committed first-party
adapter.
