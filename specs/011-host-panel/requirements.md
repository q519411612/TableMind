# 011 Host Panel - Requirements

## Goal

Provide the human Host with oversight and override tools so the MVP remains controllable even when AI DM behavior is imperfect.

## User stories

### Story 1: Host can inspect hidden game context

As a Host, I want to see current scene DM notes, unrevealed clues, NPC motivations, encounters, and secrets, so that I can supervise the AI DM.

#### Acceptance criteria

- WHEN Host opens the panel THEN current scene public and DM-only context is visible.
- WHEN clues are hidden THEN Host can see them and their reveal status.
- WHEN NPCs are present THEN Host can see public and DM-only data.

### Story 2: Host can approve risky AI actions

As a Host, I want to review risky AI outputs, so that spoilers and bad state changes do not automatically reach players.

#### Acceptance criteria

- WHEN spoiler guard flags output THEN it appears in Host review queue.
- WHEN AI proposes clue reveal THEN Host can approve/reject/edit it.
- WHEN AI proposes a major state patch THEN Host can approve/reject/edit it.

### Story 3: Host can manually override state

As a Host, I want to correct or override the session, so that gameplay can continue when AI or automation fails.

#### Acceptance criteria

- WHEN Host changes scene THEN currentSceneId updates through an event.
- WHEN Host reveals a clue THEN reveal event is committed.
- WHEN Host edits HP/conditions THEN state patch event is committed.
- WHEN Host pauses AI THEN AI DM stops auto-responding.

## Functional requirements

1. Display current scene, clues, NPCs, encounters, combat state, and review queue.
2. Provide approve/reject/edit actions for AI outputs and state patches.
3. Provide manual scene change, clue reveal, HP/condition update, and AI pause controls.
4. Ensure Host actions are event logged.
5. Ensure Host-only data is never shown to player views.

## Non-goals

- Full adventure editor.
- Rich map editor.
- Full campaign management UI.
- Multi-host permission matrix.
