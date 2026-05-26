# 005 Character Sheet - Requirements

## Goal

Provide a minimal D&D 5e-compatible character sheet sufficient for a low-level one-shot.

## User stories

### Story 1: Player creates a playable character

As a player, I want to create a simple level 1 character, so that I can join the session quickly.

#### Acceptance criteria

- WHEN a player creates a character THEN name, class, level, ability scores, HP, AC, speed, proficiencies, attacks, and inventory can be saved.
- WHEN ability scores are entered THEN modifiers are derived.
- WHEN level is set THEN proficiency bonus is derived or validated.

### Story 2: Rules engine can use character data

As the rules engine, I need stable character stats, so that checks, saves, attacks, and damage can resolve correctly.

#### Acceptance criteria

- WHEN a check is resolved THEN character ability scores and proficiencies are available.
- WHEN an attack is resolved THEN attack bonus and damage formula are available.
- WHEN damage is applied THEN current HP updates in session state.

## Functional requirements

1. Support manual character creation/editing for MVP.
2. Support six ability scores.
3. Support proficiency bonus.
4. Support AC, HP, speed, skills, saves, attacks, inventory, spells references, and conditions.
5. Support serialization to session state.

## Non-goals

- Full character builder.
- Level-up flow.
- Multiclassing.
- Feats.
- Full spell preparation.
- D&D Beyond import.
