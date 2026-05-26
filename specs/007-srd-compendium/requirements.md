# 007 SRD Compendium - Requirements

## Goal

Provide a structured SRD/open-content compendium for rule lookup, citations, and lightweight structured data used by the rules engine and AI DM.

## User stories

### Story 1: AI DM can retrieve rule references

As AI DM, I need access to relevant SRD rule entries, so that I can explain rules and cite sources instead of inventing them.

#### Acceptance criteria

- WHEN a rule lookup is requested THEN matching compendium entries are returned.
- WHEN an entry is returned THEN it includes source and license metadata.
- WHEN AI DM cites a rule THEN citation data can be attached to output.

### Story 2: Rules engine can use structured data

As rules engine, I need structured entries for conditions, common actions, monsters, items, and spells, so that MVP rules can resolve from stable data.

#### Acceptance criteria

- WHEN a condition is applied THEN the condition can map to a compendium entry.
- WHEN a monster is loaded THEN its AC, HP, attacks, and ability data are available if present.
- WHEN an item/attack is referenced THEN parseable attack/damage fields are available if present.

## Functional requirements

1. Define `CompendiumEntry` with source/license/attribution metadata.
2. Support entry types: rule, condition, action, spell, monster, item, class.
3. Support keyword search in MVP.
4. Support future vector/full-text search without changing domain model.
5. Include only SRD/open/original fixture content.
6. Provide small fixtures for tests and demo.

## Non-goals

- Complete SRD ingestion in first implementation PR.
- Full vector search.
- Commercial D&D book ingestion.
- D&D Beyond sync.
- Perfect natural-language rules QA.
