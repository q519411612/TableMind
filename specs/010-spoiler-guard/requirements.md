# 010 Spoiler Guard - Requirements

## Goal

Prevent DM-only, hidden, unrevealed, or player-specific information from leaking into player-facing output.

## User stories

### Story 1: Player output is checked

As a Host, I want public AI messages checked before broadcast, so that the AI does not accidentally reveal hidden truths.

#### Acceptance criteria

- WHEN AI DM produces publicMessage THEN spoiler guard checks it before broadcast.
- WHEN the message contains unrevealed secret text or names THEN it is blocked or flagged for Host review.
- WHEN the message is safe THEN it may be broadcast.

### Story 2: Player APIs filter hidden state

As a player, I should only see public, revealed, and my own player-specific information.

#### Acceptance criteria

- WHEN player requests session state THEN dm_only entities are excluded.
- WHEN a clue is hidden THEN it is not present in player projection.
- WHEN a clue is revealed THEN it becomes visible.

## Functional requirements

1. Define spoiler risk levels.
2. Check public AI output against hidden adventure entities.
3. Check state projections for visibility violations.
4. Produce actionable warnings for Host review.
5. Provide deterministic tests using known hidden strings.

## Non-goals

- Perfect semantic leak detection.
- Legal/copyright filtering.
- Moderation of player content.
- Full prompt-injection defense.
