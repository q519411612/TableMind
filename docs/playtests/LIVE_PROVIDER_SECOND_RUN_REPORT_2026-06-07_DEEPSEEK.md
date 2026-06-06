# Live Provider Second Run Report - DeepSeek - 2026-06-07

> Status: Partial live-provider evidence. Automated DeepSeek bridge smoke
> completed, and a later manual browser UI combat path was completed. This is
> not a passing second human-run supervised session report because structured
> Host/player feedback and recap evidence are still incomplete, and the manual
> UI pass exposed a player-facing unrevealed-clue leak. Do not include API keys,
> session tokens, private provider payloads, raw provider requests, raw provider
> responses, or other secrets in this report.

## Session Metadata And Commit

- Date/time: 2026-06-07 00:07 CST pre-run verification; 2026-06-07 follow-up
  automated live-provider bridge smoke.
- Branch: `codex/live-run-feedback-prep`.
- Version/commit tested: `1d782ee63526a22998b842c9c925b958d206662d`.
- Duration: Under 10 minutes for the follow-up automated live-provider bridge
  smoke; additional manual browser UI combat observation later in the same
  local playtest environment.
- Verification note reviewed: Yes. The previous QA follow-up and Phase 1.5
  verification notes were reviewed before this attempt.
- Operator notes: The workspace has a Node 20+ runtime through the bundled
  workspace runtime. `npm` is unavailable in this workspace, so package scripts
  were executed through their equivalent direct Node commands.

## Host And Player Participants

- Host: Simulated HTTP operator for the automated bridge smoke; manual browser
  Host operator for the later UI combat observation.
- Player 1: Simulated player Ada Thorne for the automated bridge smoke; manual
  browser player entry `chen` observed in room `room_0006`.
- Player 2: Simulated player Bran Vale for the automated bridge smoke; manual
  browser player entry `ming` observed in room `room_0006`.
- Optional Player 3: Not used.
- Optional Player 4: Not used.
- Observer or note-taker: Pre-run operator only.

No structured human Host/player feedback form was collected. The manual browser
UI observation records objective UI state only.

## Provider Model And Bridge Path

- AI provider enabled: Yes for the follow-up automated bridge smoke.
- Provider/model: DeepSeek `deepseek-v4-flash`.
- Bridge path used: Temporary in-memory structured-response bridge that called
  DeepSeek chat completions and returned `tablemind.ai_dm_response.v1` JSON to
  the existing TableMind provider adapter.
- Config source: Local environment variables and runtime-only process state.
- Live provider calls made: 2.
- Provider errors: None during the successful bridge smoke. Both upstream
  DeepSeek calls returned HTTP 200.
- Provider model probe: The supplied key could list `deepseek-v4-flash` and
  `deepseek-v4-pro`.

## Language Mode Used

- Language mode used: English.
- UI language observed: Chinese in the later manual browser Host page.
- Player language preference: Not collected.
- Host language preference: Not collected.
- Language-switching issues: Not observed in the automated bridge smoke.

## Pre-Run Verification

- Runtime: bundled Node `v24.14.0`.
- `node scripts/check-js.mjs`: Passed. Checked 59 JavaScript files.
- `node scripts/run-tests.mjs packages apps tests`: Passed. 129 tests, 0
  failures.
- `node scripts/run-tests.mjs tests/acceptance`: Passed. 12 tests, 0 failures.
- `npm run smoke:playtest`: Not runnable because `npm` is unavailable in this
  workspace.
- `node scripts/smoke-playtest-flow.mjs`: Passed as the equivalent direct Node
  command. The provider-disabled smoke ended `room_0001` at
  `scene_lantern_tower`.
- `git diff --check`: Passed with no whitespace errors.

## Scenario Coverage Completed

- Host creates a room and shares the player link: Completed through automated
  HTTP room creation; no human invite sharing.
- Two players join and create/use level 1 characters: Completed with simulated
  Ada Thorne and Bran Vale.
- Host loads demo adventure and starts the session: Completed.
- Players reach Village Square and Lantern Tower: Completed.
- Resolve at least one deterministic check: Completed. DeepSeek returned a
  structured `skill_check`; TableMind resolved it through deterministic rules.
- Reveal or review at least one clue/reveal-related path: Completed. DeepSeek
  returned a reveal proposal for `clue_broken_lens`; TableMind created Host
  review instead of broadcasting it.
- Start Hill Scavengers combat: Completed.
- Resolve at least one player attack: Completed. Ada attacked
  `combatant_monster_hill_scavenger_1`.
- Host ends combat and completes the session: Completed.
- Generate player recap and Host recap: Completed in the automated path.

This coverage is automated smoke evidence, not second human-run completion
evidence, because no real Host/player feedback was collected.

Manual browser UI addendum: In room `room_0006`, the Host page showed player
entries `chen` and `ming`, the Lantern Tower scene, a completed Hill
Scavengers combat flow, and a final `combat.ended` event. The combat panel
returned to "no active combat." Recap completion was not observed in that manual
browser state.

## DeepSeek Call Results

- Call 1 scenario: Safe narration plus deterministic skill check.
- Call 1 TableMind result: `broadcast_ready`.
- Call 1 committed event types: `dice.rolled`, `ai.message`.
- Call 1 check result: `char_ada` `skill_check`, total 20, success true.
- Call 2 scenario: Reveal proposal.
- Call 2 TableMind result: `host_review_required`.
- Call 2 Host review reason: AI proposed a reveal.
- Call 2 Host decision: Rejected.
- Raw provider prompt/response: Not recorded.

## Unsupported AI Action / Rejection Path Result

- Unsupported action attempted or simulated: DeepSeek proposed a clue reveal.
- Expected rejection or Host review result: Host review required; no direct
  state mutation; no player-facing leak.
- Actual result: TableMind created `host.review.created` and did not broadcast a
  public AI message for the reveal proposal.
- State mutation check: The reveal proposal did not directly mutate
  authoritative room state. The clue was revealed later only through an
  explicit Host command after the rejection-path check.
- Player-facing leak check: Player snapshot before rejection, player snapshot
  after rejection, player adventure snapshot, and player recap did not include
  the rejected review payload or known DM-only strings checked by the smoke.
- Follow-up needed: Repeat this path with real Host and player participants to
  collect feedback and observe manual UX friction.

## Player No-Leak Check

- Player HTTP no-leak check: Passed in the automated bridge smoke.
- Player SSE no-leak check: Not opened in this follow-up smoke; existing
  automated SSE no-leak tests passed in pre-run verification.
- Player UI no-leak check: The later manual browser run exposed a public AI
  message containing unrevealed hatch-related clue content before Host review.
  This must be treated as a spoiler incident, not a pass.
- Player recap no-leak check: Passed in the automated bridge smoke.

## Player Feedback

- Player 1: Not collected from a human participant.
- Player 2: Not collected from a human participant.
- Optional Player 3: Not collected.
- Optional Player 4: Not collected.
- Did players know what to do next: Not collected from human participants.
- Was joining/character creation clear: Not collected from human participants.
- Did the AI feel like a DM: Not collected from human participants.
- Did combat make sense: Not collected from human participants.
- Did anything feel spoiled or confusing: Structured feedback not collected.
  Objective observation found an unrevealed-clue spoiler incident in public AI
  narration.
- Would players play another session: Not collected from human participants.

## Host Feedback

- Did AI reduce Host workload: Not collected from a human Host.
- Was review manageable: Not collected from a human Host.
- Which interventions were required: Automated Host rejected the reveal review
  item, manually revealed `clue_broken_lens` afterward, started combat, ended
  combat, and completed the session. In the later browser UI pass, the Host
  manually completed combat; no pending review item was visible afterward.
- What was most annoying: Not collected from a human Host.
- What should be improved first: Not collected from a human Host.
- Did bilingual UI help or distract: Not collected from a human Host.

## Combat UX Notes

- Combat encounter: Hill Scavengers.
- Did players understand whose turn it was: Structured feedback not collected.
  The Host page did show combat turn advancement and then no active combat after
  the manual browser combat ended.
- Did attack and damage flow make sense: Automated combat command completed and
  produced `attack.resolved` plus `damage.applied`.
- Host combat interventions: Automated Host ended combat with the remaining
  scavenger fleeing into the rain. Later manual browser observation confirmed a
  combat path ending with `combat.ended` in room `room_0006`.
- Confusing labels, actions, or states: Not observed in a manual UI session.

## Recap Usefulness

- Player recap generated: Yes in the automated bridge smoke.
- Host recap generated: Yes in the automated bridge smoke.
- Player recap usefulness: Not collected from human participants.
- Host recap usefulness: Not collected from a human Host.
- Player recap no-leak result: Passed for the automated forbidden-string checks.

## Bugs / Blockers / Warnings

- Bugs:
  - Manual browser UI observation confirmed a spoiler-guard gap: public AI
    narration could mention unrevealed hatch-related clue content without
    entering Host review. Root cause: unrevealed clues protected titles but did
    not protect clue text or structured clue aliases.
  - Working-tree fix added clue `aliases` parsing, protected unrevealed clue
    aliases and exact clue text in the spoiler guard, and added regression
    coverage for the AI room runner, spoiler guard, and demo adventure fixture.
    The currently running local server must be restarted before this fix affects
    further manual browser testing.
  - Earlier UI friction in this same manual pass led to fixes for stale player
    identity on the player page and completed review items remaining visible in
    the Host pending queue.
- Blockers:
  - No human Host plus two-player participant group was available in this
    session.
  - Host/player feedback remains uncollected.
- Provider or transport issues:
  - An earlier local harness attempt failed before provider calls because the
    one-off test script used the wrong local character field shape. The script
    was corrected to match the existing smoke harness before live provider
    execution. No provider payload was recorded from that failed local attempt.
- UI issues: Manual browser combat could be completed, but the run also exposed
  the spoiler incident above. Host reload still loses the current browser-held
  room/session state.
- Test or verification gaps found: The live DeepSeek bridge path now has
  manual smoke evidence, but there is still no committed reusable live-provider
  smoke script, and default automated tests must continue to avoid live provider
  calls.
- Warning: This report must not be used as pass evidence for the second
  supervised human live-provider run.

## Post-Observation Fix Verification

- `node scripts/check-js.mjs`: Passed. Checked 59 JavaScript files.
- `node scripts/run-tests.mjs packages apps tests`: Passed. 133 tests, 0
  failures.
- `node scripts/run-tests.mjs tests/acceptance`: Passed. 12 tests, 0 failures.
- `node scripts/smoke-playtest-flow.mjs`: Passed with provider disabled; the
  smoke flow ended `room_0001` at `scene_lantern_tower`.
- `git diff --check`: Passed with no whitespace errors.
- Secret scan for the supplied provider key prefix and bearer-key patterns:
  Passed with no matches.
- `npm run build`: Not runnable because `npm` is unavailable in this workspace.
  The direct Node equivalent of the build script was covered by the check,
  full-suite, and acceptance commands above.

## Pass / Fail Decision

- Decision: Fail for second human-run completion; pass only for the narrow
  automated DeepSeek structured bridge smoke and for manual confirmation that a
  browser UI combat path can be completed.
- Pass/fail rationale: The repository passed pre-run automated verification and
  the supplied DeepSeek key successfully exercised two live provider calls
  through the structured bridge path. The later manual browser run completed
  combat, but it also exposed a player-facing unrevealed-clue leak and still did
  not collect structured Host/player feedback or recap usefulness feedback.
- Required fixes before next run: Restart the playtest server with the
  spoiler-guard fix, schedule one Host plus two players, keep the DeepSeek
  bridge configuration local, start the playtest server only after verification,
  and use `SECOND_RUN_FEEDBACK_QUESTIONS.md` immediately after the session.
- Deferred non-blocking follow-up: Consider promoting the one-off bridge smoke
  into a documented operator-only runbook script that still requires explicit
  local provider credentials and remains disabled by default.

## Follow-Up Recommendations

- Attempt the second supervised human run again with the same no-secrets rules.
- Keep Host review visible and intentionally test one unsupported action or
  risky reveal proposal.
- Collect player and Host feedback before updating the pass/fail decision for
  the human run.
- Stop immediately if any DM-only truth, rejected AI output, private provider
  payload, or unsupported action detail reaches player HTTP, SSE, UI, or recap
  output.
- Do not claim production readiness, public launch readiness, unsupervised-room
  readiness, or permanent DeepSeek integration from this partial automated
  smoke.
