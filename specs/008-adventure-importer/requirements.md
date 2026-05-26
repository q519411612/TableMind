# 008 Adventure Importer - Requirements

## Goal

Convert a structured 5e-compatible adventure into a validated AdventureModule that AI DM, Host panel, spoiler guard, and session state can use.

## User stories

### Story 1: Host imports a structured adventure

As a Host, I want to import a structured Markdown adventure, so that I can run it in a TableMind room.

#### Acceptance criteria

- WHEN Host uploads a supported Markdown file THEN the importer returns an AdventureModule draft.
- WHEN the draft is generated THEN it contains metadata, scenes, NPCs, clues, encounters, secrets, and endings where present.
- WHEN required fields are missing THEN validation errors identify the missing fields.

### Story 2: Hidden information is preserved

As a Host, I want DM-only information separated from public text, so that AI DM can use it without leaking it to players.

#### Acceptance criteria

- WHEN a section is marked DM-only THEN its visibility is `dm_only`.
- WHEN a section is read-aloud/public THEN its visibility is `public`.
- WHEN clues start hidden THEN they are not visible in player projections until revealed.

### Story 3: Import is reviewable

As a Host, I want to review imported modules before play, so that parser mistakes do not break the session.

#### Acceptance criteria

- WHEN import completes THEN the module is marked as draft.
- WHEN validation has warnings THEN Host can still inspect them.
- WHEN Host approves THEN module can be used by a room.

## Functional requirements

1. Support a structured Markdown adventure format in MVP.
2. Produce typed AdventureModule output.
3. Validate required metadata.
4. Preserve visibility information.
5. Support source references for imported entities.
6. Treat PDF import as experimental/deferred.

## Non-goals

- Perfect PDF parsing.
- Official adventure ingestion.
- Public module publishing.
- Rich map/token import.
- Automatic balancing.
