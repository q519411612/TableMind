# TableMind Engineering Constitution

This document defines the non-negotiable engineering principles for TableMind.

These constraints override convenience, shortcuts, and speculative features.

---

# 1. Source of Truth

The LLM is never the source of truth for game state.

The authoritative source of truth is:

- persisted session state
- append-only event log
- deterministic rules engine outputs
- approved Host overrides

The AI DM may propose state changes but cannot directly mutate authoritative state.

---

# 2. Deterministic Rules

Dice rolls and core rules resolution must be deterministic system operations.

The AI DM:

- may suggest checks
- may suggest DCs
- may narrate outcomes

The AI DM must NOT:

- fabricate dice rolls
- directly calculate hidden/random results
- silently mutate HP/conditions/resources
- bypass the rules engine

All dice rolls must be logged.

---

# 3. Visibility and Spoiler Safety

DM-only information must never leak through player-facing APIs.

Every content entity must carry visibility metadata.

Minimum visibility levels:

```txt
public
dm_only
revealed
player_specific
```

Spoiler checks must run before public AI output is broadcast.

---

# 4. Host Authority

Host override is a required system capability.

The Host must be able to:

- approve/reject AI actions
- edit AI narration
- reveal clues manually
- change scenes manually
- modify session state
- pause AI automation
- resolve deadlocks

The Host is the final authority during MVP.

---

# 5. Event-Sourced Mental Model

All important gameplay changes must become events.

Examples:

- player message
- AI narration
- dice roll
- attack result
- clue reveal
- scene transition
- combat start/end
- HP change
- condition application

State reconstruction must be possible from events.

---

# 6. Scope Discipline

The MVP goal is:

> A playable 60–90 minute 5e-compatible one-shot.

The MVP is NOT:

- a full VTT
- a Roll20 replacement
- a Foundry replacement
- a full D&D Beyond replacement
- a general AI storytelling platform

Engineering decisions must optimize for MVP validation speed.

---

# 7. Content Boundaries

Only SRD/open/original content may be embedded into public product assets.

Commercial/non-SRD content:

- must not be redistributed
- must not become shared public compendium data
- must remain user-private if uploaded

The system should support private imports without acting as a piracy platform.

---

# 8. Structured Before Magical

Prefer explicit structure over implicit prompting.

Prefer:

- typed models
- schemas
- events
- fixtures
- parsers
- validators
- replayable state

Avoid relying on:

- prompt-only memory
- hidden chain assumptions
- freeform AI state tracking

---

# 9. AI as Orchestrator

The AI DM is primarily an orchestrator.

It coordinates:

- narrative
- pacing
- NPC dialogue
- suggested checks
- reveal timing
- combat narration

It does not own:

- truth
- randomness
- authorization
- persistence

---

# 10. Small PRs, Stable Interfaces

Implementation should proceed through:

- small milestones
- reviewable PRs
- stable contracts
- fixture-driven tests

Avoid giant rewrites and speculative abstractions.

The first successful playable demo is more important than architectural perfection.
