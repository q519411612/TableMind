# Manual UI Combat Test Report - 2026-06-07

> Status: Manual browser UI combat path completed. This report combines the
> observed Host page state from the user's manual test with the surrounding
> DeepSeek bridge evidence and post-observation verification. It is not a
> passing second supervised human-run report because structured Host/player
> feedback and manual recap evidence remain incomplete, and the run exposed a
> player-facing unrevealed-clue spoiler incident.
>
> Do not include API keys, session tokens, raw provider requests, raw provider
> responses, private provider payloads, authorization headers, or private player
> contact data in this report.

## Session

- Date/time: 2026-06-07 03:48 CST report capture.
- Branch: `codex/live-run-feedback-prep`.
- Version/commit tested at run start: `1d782ee63526a22998b842c9c925b958d206662d`.
- Local URL observed: `http://127.0.0.1:3000/host.html`.
- Room observed: `room_0006`.
- UI language observed: Chinese Host UI.
- Pass/fail decision: Fail for second supervised human-run completion; pass for
  the narrow claim that a manual Host browser UI combat path reached
  `combat.ended`.

## Participants

- Host: Manual browser Host operator.
- Player 1: Browser room entry `chen`, player role, character
  `char_player_0002`.
- Player 2: Browser room entry `ming`, player role, character
  `char_player_0003`.
- Optional Player 3: Not used.
- Optional Player 4: Not used.
- Structured feedback form: Not collected.

## Adventure And Scene State

- Adventure: `The Lantern Beneath the Hill`.
- Scene reached: Lantern Tower.
- Host scene panel showed the Lantern Tower read-aloud text plus DM-only scene
  and truth material. This is expected on the Host page only.
- Host audit feed included multiple AI narration entries before combat.
- Recap panel state: no recap was observed; Host page still showed no battle
  report.

## AI Provider Context

- The surrounding second-run evidence used DeepSeek `deepseek-v4-flash` through
  the temporary structured-response bridge.
- The automated bridge smoke made 2 live provider calls and returned HTTP 200
  upstream responses.
- The manual browser page does not expose a reliable live-provider call count,
  raw prompt, or raw response, and none were recorded.
- Provider secrets were not written into this report.

## Manual UI Flow Observed

- Host page showed room `room_0006`.
- Players were present: Host, `chen`, and `ming`.
- AI status showed `已暂停: false`.
- Review queue showed `暂无待审核项目。`
- Combat panel showed `暂无进行中的战斗。` after the user manually completed the
  fight.
- Audit feed showed:
  - `combat.started`
  - multiple `combat.turn_advanced` events
  - multiple `attack.resolved` events
  - final `combat.ended`
- Objective result: the manual browser combat path completed and returned to no
  active combat.

## Spoiler And Review

- Spoiler incident: Yes.
- Observed issue: a public AI narration mentioned hatch-related unrevealed clue
  content before Host review.
- Why this matters: `hatch` / `hidden hatch` / `tower hatch` / `hatch below the
  tower` map to unrevealed Lantern Tower clue material in the demo adventure.
  Because the content was committed as public AI narration, it must be treated
  as player-facing spoiler risk.
- Review queue result at observation time: no pending review item was visible.
- Root cause found: unrevealed clue protection covered clue titles but did not
  cover exact clue text or structured clue aliases.
- Working-tree fix:
  - Added clue alias parsing in the adventure loader.
  - Added aliases for `clue_broken_lens` in the demo fixture.
  - Updated spoiler guard to match unrevealed clue titles, exact clue text, and
    clue aliases.
  - Added regression tests in the spoiler guard, adventure loader, and AI room
    runner.
- Retest requirement: restart the local playtest server before retesting this
  fix in the browser. The currently running `127.0.0.1:3000` server was started
  before the fix and will not use it until restarted.

## UI Issues Observed During This Manual Pass

- Player page stale identity issue: fixed in the working tree. Incomplete
  persisted player identity no longer hides the join form or shows player
  actions without a valid snapshot.
- Host review queue looked unchanged after approve/reject: fixed in the working
  tree. Host pending queue now renders only `status === "pending"` items.
- Host reload loses the active room/session because the Host page keeps this
  state in memory. This remains a known limitation and was not changed in this
  report.

## Verification After Fixes

- `node scripts/check-js.mjs`: Passed. Checked 59 JavaScript files.
- `node scripts/run-tests.mjs packages apps tests`: Passed. 133 tests, 0
  failures.
- `node scripts/run-tests.mjs tests/acceptance`: Passed. 12 tests, 0 failures.
- `node scripts/smoke-playtest-flow.mjs`: Passed with provider disabled;
  smoke flow ended `room_0001` at `scene_lantern_tower`.
- `git diff --check`: Passed with no whitespace errors.
- Secret scan for supplied provider key prefix and bearer-key patterns: Passed
  with no matches.
- `npm run build`: Not runnable because `npm` is unavailable in this workspace.
  The direct Node equivalent of the build script was covered by the check,
  full-suite, and acceptance commands above.

## Remaining Gaps

- Structured player feedback was not collected.
- Structured Host feedback was not collected.
- Player browser UI state after the spoiler incident was not separately
  captured.
- Player recap and Host recap were not manually generated in the observed
  browser state.
- The spoiler-guard fix needs a fresh browser retest after restarting the local
  playtest server.
- The live-provider path remains temporary and supervised; this is not evidence
  for production readiness or unsupervised public rooms.

## Follow-Up

- Restart the playtest server so the spoiler-guard and fixture changes are
  active.
- Repeat the Lantern Tower AI narration path and verify hatch-related wording
  enters Host review instead of public broadcast.
- Collect answers from `SECOND_RUN_FEEDBACK_QUESTIONS.md` immediately after the
  next run.
- Generate player and Host recaps during the manual UI run and verify player
  recap no-leak behavior.
- Rotate the provider key after live testing.
