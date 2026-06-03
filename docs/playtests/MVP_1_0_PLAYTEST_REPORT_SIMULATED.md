# MVP-1.0 Simulated Playtest Report

## Session

- Date/time: 2026-06-03
- Version/commit: local working tree
- Duration: Automated local simulation
- Pass/fail decision: Pass

## Participants

- Host: Simulated Host
- Player 1: Ada
- Player 2: Bran
- Optional Player 3: Not used
- Optional Player 4: Not used

## Adventure

- Adventure: The Lantern Beneath the Hill
- Source: Original TableMind fixture
- Characters used: Ada Thorne, Bran Vale
- Scenes reached: Village Square, Lantern Tower
- Ending: Repair the Lantern

## AI Provider

- AI provider enabled: false
- Provider/model: Mock AI adapter
- Config source: Default disabled config
- Live provider calls made: No
- Provider errors: None

## Spoiler And Review

- Spoiler incidents: None
- Low-confidence review items: Covered by golden eval
- Reveal proposal review items: Covered by golden eval
- State patch proposal review items: Covered by golden eval
- Host interventions: AI pause, clue reveal, combat end, session complete
- Approved AI messages: Safe mock narration auto-approved
- Edited AI messages: Not used in simulated playtest
- Rejected AI messages: Covered by golden eval

## Rules And Combat

- Rules checks resolved: Investigation skill check for inspecting lantern soot
- Dice outcomes: Deterministic d20 check committed to dice log
- Unsupported AI actions rejected: Covered by golden eval
- Combat encounter: Hill Scavengers
- Combat rounds: One player attack resolved
- Player attacks resolved: Ada Thorne attacks hill scavenger
- Host combat overrides: Combat ended by Host

## Recap

- Player recap generated: Yes
- Host recap generated: Yes
- Player recap DM-only leak check: Passed
- Host recap unresolved threads: Present

## Blockers And Feedback

- Blockers: None for MVP-1.0 simulated acceptance
- Bugs: None observed in automated verification
- Player feedback: Not collected in simulated run
- Host feedback: Not collected in simulated run
- Follow-up work: Run an actual live-provider monitored session when credentials and participants are available

## Decision Notes

The simulated playtest passes because the local UI flow completes, deterministic rules and combat paths are exercised, safe AI narration is committed through room events, risky AI outputs are covered by golden review gates, and player-facing render/transport/recap checks show no known DM-only leak.
