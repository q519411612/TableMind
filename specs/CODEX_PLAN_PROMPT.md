# Codex Planning Prompt for TableMind

You are working on TableMind, an AI DM system for D&D 5e-compatible one-shot adventures.

Before producing any implementation plan:

1. Inspect the repository structure.
2. Read:
   - `docs/PRD.md`
   - `specs/README.md`
   - `specs/000-constitution.md`
   - `specs/000-prd-analysis.md`
3. Read all foundational specs:
   - `specs/002-project-foundation/**`
   - `specs/003-domain-model-event-log/**`
   - `specs/006-rules-engine/**`
   - `specs/007-srd-compendium/**`
   - `specs/014-demo-adventure/**`

Then:

- produce an implementation plan only
- do not generate production code yet
- identify dependencies and milestones
- identify architectural risks
- identify unknowns requiring clarification
- propose repo structure
- propose package/module boundaries
- propose testing strategy
- propose event model and persistence boundaries

Important constraints:

- the LLM is not the source of truth
- all dice must be deterministic system operations
- Host override is mandatory
- DM-only information must not leak
- all major state transitions become events
- the MVP target is a playable 60–90 minute one-shot
- do not attempt a full VTT
- do not attempt full 5e automation
- do not implement D&D Beyond sync
- do not implement marketplace/public adventure sharing

Preferred implementation order:

1. foundation scaffold
2. domain types and event log
3. rules engine
4. SRD compendium fixtures
5. demo adventure fixture
6. realtime room
7. character sheet MVP
8. AI DM orchestration
9. spoiler guard
10. host panel
11. combat MVP
12. session recap

Your first implementation PR should be intentionally small.

Recommended first PR scope:

- monorepo/app scaffold
- shared types package
- event log skeleton
- deterministic dice utility
- rules engine tests
- SRD fixture loader
- demo adventure JSON fixture

Avoid speculative abstractions and premature optimization.
