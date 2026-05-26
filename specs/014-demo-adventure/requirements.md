# 014 Demo Adventure - Requirements

## Goal

Provide an original, SRD-compatible demo adventure fixture that exercises the MVP end-to-end without embedding commercial D&D adventure content.

## Demo adventure name

Working title:

> The Lantern Beneath the Hill

Chinese working title:

> 山丘下的灯火

## User stories

### Story 1: Host can select a demo adventure

As a Host, I want to start with a built-in original one-shot, so that I can test TableMind without importing external content.

#### Acceptance criteria

- WHEN Host creates a room THEN the demo adventure can be selected.
- WHEN selected THEN the adventure provides starting scene, scenes, NPCs, clues, encounter, secrets, and ending options.
- WHEN started THEN AI DM has enough public and DM-only context to run the opening.

### Story 2: Demo covers core MVP flows

As a developer, I want the demo adventure to exercise core systems, so that tests and manual play cover the MVP.

#### Acceptance criteria

- WHEN the demo is played THEN it includes at least one investigation check.
- WHEN the demo is played THEN it includes at least one social interaction.
- WHEN the demo is played THEN it includes at least one simple combat encounter.
- WHEN the demo is played THEN it includes at least one hidden clue reveal.
- WHEN the demo ends THEN recap generation has meaningful events to summarize.

## Functional requirements

1. The demo adventure must be original content.
2. The demo should target level 1 characters.
3. The demo should support 2–4 players.
4. The demo should run in 60–90 minutes.
5. The demo should include 4–6 scenes.
6. The demo should include 2–4 NPCs.
7. The demo should include 6–10 clues.
8. The demo should include 1 simple combat encounter.
9. The demo should include public and DM-only content.
10. The demo should be available as a structured Markdown fixture and later as a parsed JSON fixture.

## Non-goals

- Large campaign.
- Official setting.
- Non-SRD monsters or IP.
- Complex dungeon crawl.
- Complex tactical map.
