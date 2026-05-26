# 012 Combat MVP - Requirements

## Goal

Provide enough combat functionality to run one simple low-level 5e-compatible encounter during the MVP one-shot.

## User stories

### Story 1: Combat starts from an encounter

As a Host, I want to start combat from an adventure encounter, so that the table can resolve a simple fight.

#### Acceptance criteria

- WHEN Host or AI DM starts an encounter THEN combat state is created.
- WHEN combat starts THEN all combatants receive initiative results.
- WHEN combat state is created THEN it is committed as an event.

### Story 2: Players act on their turns

As a player, I want to know when it is my turn and make an attack, so that combat is understandable.

#### Acceptance criteria

- WHEN combat is active THEN current turn is visible.
- WHEN a player attacks THEN rules engine resolves attack roll and damage.
- WHEN turn ends THEN combat advances to the next combatant.

### Story 3: Combat state remains consistent

As a Host, I want monster and character HP/status to update correctly, so that the AI cannot lose track of the fight.

#### Acceptance criteria

- WHEN damage is applied THEN target HP updates.
- WHEN target HP reaches 0 THEN target status changes appropriately.
- WHEN combat ends THEN combat state is closed and an event is logged.

## Functional requirements

1. Support starting combat from Encounter data.
2. Support initiative order.
3. Support turn advancement.
4. Support attack and damage through rules engine.
5. Support monster HP and status.
6. Support ending combat manually or automatically when one side is defeated.

## Non-goals

- Grid movement.
- Opportunity attacks.
- Complex reactions.
- Full spell automation.
- Area effects.
- Cover/flanking.
- Advanced monster AI tactics.
