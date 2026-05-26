# 013 Session Recap - Requirements

## Goal

Generate a useful post-session summary from the event log and final state.

## User stories

### Story 1: Players receive a recap

As a player, I want a summary after the one-shot, so that I can remember what happened.

#### Acceptance criteria

- WHEN a session ends THEN a recap can be generated.
- WHEN recap is generated THEN it includes major scenes, discoveries, combat results, and ending.
- WHEN recap is shown to players THEN it excludes unrevealed DM-only information.

### Story 2: Host receives a richer recap

As a Host, I want a Host recap with unresolved secrets and notes, so that I can continue or debug the session.

#### Acceptance criteria

- WHEN Host requests recap THEN it may include hidden information and unresolved clues.
- WHEN player requests recap THEN hidden information is omitted.

## Functional requirements

1. Generate recap from committed events and final SessionState.
2. Support player-safe recap projection.
3. Support Host recap projection.
4. Include key dice rolls, clue reveals, combat outcomes, and rewards.
5. Export Markdown.

## Non-goals

- Long campaign journal.
- Editable wiki.
- Automatic social sharing.
- Audio/video transcript summarization.
