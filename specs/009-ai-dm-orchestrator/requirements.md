# 009 AI DM Orchestrator - Requirements

## Goal

Coordinate AI DM behavior while keeping state, dice, rules, and visibility controlled by system components.

## User stories

### Story 1: AI DM responds to player actions

As a player, I want AI DM to narrate outcomes and ask for checks when needed, so that the game feels responsive.

#### Acceptance criteria

- WHEN a player sends an action THEN AI DM can propose a public response.
- WHEN a rule check is needed THEN AI DM emits a structured rule request, not a fabricated dice result.
- WHEN narration is generated THEN it references current scene and known state.

### Story 2: AI DM proposes state changes

As a Host, I want AI DM to propose state patches, so that I can review important changes.

#### Acceptance criteria

- WHEN AI DM output changes game state THEN it includes a structured statePatch proposal.
- WHEN statePatch is risky THEN Host approval is required.
- WHEN approved THEN the state change becomes an event.

### Story 3: AI DM output is structured

As a developer, I want AI DM output to follow a schema, so that it can be validated and safely processed.

#### Acceptance criteria

- WHEN AI DM returns output THEN it conforms to AiDmResponse schema.
- WHEN output is invalid THEN it is rejected or sent to Host review.
- WHEN output includes publicMessage THEN spoiler guard checks it before broadcast.

## Functional requirements

1. Build model context from projected state, scene data, relevant compendium entries, recent events, and Host settings.
2. Require structured AI response schema.
3. Separate public messages, private messages, rule requests, state patches, reveal proposals, and warnings.
4. Never allow AI DM to directly roll dice.
5. Never broadcast AI output before validation and spoiler checks.

## Non-goals

- Production prompt optimization.
- Multi-agent architecture.
- Autonomous full campaign management.
- Fine-tuning.
- Voice/TTS.
