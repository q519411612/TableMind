# Web Play UI Feedback Template

Use this template immediately after an internal Web Play UI playtest. Do not
record provider keys, session tokens, authorization headers, raw provider
prompts, raw provider responses, private provider payloads, or private player
contact details.

Completed feedback is input for the next internal UI iteration, not production
readiness evidence.

## Session Metadata

- Playtest date:
- Start time / end time:
- Branch or commit:
- Local server URL:
- AI provider mode:
- Adventure path:
- Locale:
- Completion status:
- Observer / note-taker:

## Participants / Roles

- Host:
- Player 1:
- Player 2:
- Optional Player 3:
- Optional Player 4:

## Browser / Device

- Host browser and OS:
- Player 1 browser and device:
- Player 2 browser and device:
- Optional mobile/narrow viewport:
- Any browser extensions or accessibility settings that affected the run:

## Run Coverage

- Host opened launchpad:
- Host created room:
- Host loaded demo adventure:
- Invite link copied/opened:
- Players joined:
- Demo-ready characters created:
- Session started:
- AI DM turn run:
- Host review approve/reject/edit covered:
- Player actions submitted:
- Deterministic check resolved:
- Clue revealed:
- Combat started:
- Player attack resolved:
- Host HP/condition patch used:
- Turn advanced:
- Combat ended:
- Session completed:
- Player recap viewed:
- Host recap viewed:

## Host Feedback

- Did the Host know what to do next?
- Did AI DM output reduce or increase Host workload?
- Was the Host Review Queue understandable while players waited?
- Were approve, reject, and edit decisions clear?
- Were manual reveal, HP patch, condition patch, and combat controls clear?
- What required Host correction or intervention?
- What felt slow, risky, or annoying?
- What should be improved first?

## Player Feedback

- Did players know what to do next?
- Was joining from the invite link clear?
- Was demo-ready character creation clear?
- Did the AI feel like a DM or a generic chatbot?
- Was the public feed readable?
- Was the dice/rules log understandable?
- Did combat turns, attacks, damage, HP, and outcomes make sense?
- Was recap useful?
- Would players want to play another TableMind session?
- What should be improved first?

## Confusing Moments

For each confusing moment, capture the visible UI label, screen, action, and
participant quote or paraphrase.

- Moment 1:
- Moment 2:
- Moment 3:

## Host Review Issues

- Pending review item appeared:
- Reason/risk wording was clear:
- Public message preview was clear:
- Reveal proposal was clear:
- State patch proposal was clear:
- Approve behavior was clear:
- Reject behavior was clear:
- Edit behavior was clear:
- Any rejected/private payload reached Player UI or recap:
- Notes:

## Combat Issues

- Encounter:
- Round/active combatant clarity:
- Player attack clarity:
- Target selector clarity:
- Attack/damage/rules log clarity:
- Host HP patch clarity:
- Host condition patch clarity:
- Turn advancement clarity:
- Combat end clarity:
- Notes:

## Mobile Issues

- View tested:
- Width or device:
- Horizontal overflow:
- Tappable controls:
- Readability:
- Forms and textareas:
- Feed/rules log/combat panel:
- Notes:

## Safety/No-Leak Observations

- Player UI showed DM-only notes:
- Player UI showed hidden truth:
- Player UI showed unrevealed clue text or aliases:
- Player UI showed Host review payloads:
- Player UI showed rejected AI output:
- Player UI showed raw state patch paths:
- Player UI showed `host.review`, `state.patch`, or `host.override`:
- Player recap showed Host-only or private material:
- Provider secrets or private payloads were exposed:
- Notes:

## Bugs

Use one row per bug.

| Summary | Repro action | Expected | Actual | Severity | Priority | Owner |
|---|---|---|---|---|---|---|
|  |  |  |  |  |  |  |

Severity guide:

- Critical: player-facing leak, rules authority failure, data exposure, or run
  cannot continue.
- High: major Host/player workflow blocked or misleading.
- Medium: confusing or slow but recoverable during the run.
- Low: polish issue or minor copy/layout issue.

Priority guide:

- P0: must fix before the next human playtest.
- P1: should fix in the next small UI PR.
- P2: useful follow-up after higher-risk issues.
- P3: backlog or documentation-only improvement.

## Suggested Follow-Up PRs

- PR idea 1:
- PR idea 2:
- PR idea 3:

## Decision Notes

- Is another internal Web Play UI feedback run recommended before wider use?
- Which risks should block the next run?
- Which findings are documentation-only?
- Which findings require tests or no-leak regression coverage?
