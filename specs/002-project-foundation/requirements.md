# 002 Project Foundation - Requirements

## Goal

Establish the minimum repository foundation needed to implement TableMind MVP safely and incrementally.

The foundation must support:

- shared domain types
- deterministic unit tests
- future web app/API implementation
- fixture-driven development
- spec-driven coding agent workflows

## User stories

### Story 1: Developer can bootstrap the project

As a developer, I want a clear repository structure and install/test commands, so that I can start implementation without guessing architecture.

#### Acceptance criteria

- WHEN a developer opens the repo THEN they can find the project entry points from the README.
- WHEN a developer runs the documented install command THEN dependencies install without custom local steps.
- WHEN a developer runs the documented test command THEN the test suite runs.
- WHEN no application code exists yet THEN the repo still contains placeholder packages or clear scaffolding instructions.

### Story 2: Coding agent can plan before coding

As a coding agent, I want stable specs and a planning prompt, so that I can produce an implementation plan before writing code.

#### Acceptance criteria

- WHEN Codex is asked to work on the project THEN it can read `specs/CODEX_PLAN_PROMPT.md`.
- WHEN Codex reads the foundation docs THEN it can identify MVP scope and explicit non-goals.
- WHEN Codex proposes a plan THEN it must reference the specs it used.

### Story 3: Tests define deterministic behavior

As a maintainer, I want deterministic tests for non-AI modules, so that AI behavior can be built on reliable primitives.

#### Acceptance criteria

- WHEN rules engine code is added THEN dice randomness can be seeded or injected in tests.
- WHEN event replay is added THEN replay tests produce stable state.
- WHEN fixtures are added THEN they are versioned and loadable in tests.

## Functional requirements

1. The project SHOULD use a structure that separates domain logic from UI and infrastructure.
2. The project SHOULD include a shared package/module for types.
3. The project SHOULD include a test framework before complex feature work starts.
4. The project SHOULD include fixture directories for SRD entries and demo adventures.
5. The project SHOULD include commands for lint, typecheck, test, and build when implementation begins.
6. The project MUST keep production LLM provider integration out of the first foundation PR.

## Non-goals

- Full UI implementation.
- Full backend implementation.
- Database schema finalization.
- LLM provider integration.
- Deployment pipeline.
- Authentication.
- Payment or marketplace.

## Quality requirements

- The project should favor TypeScript or another strongly typed stack if compatible with repository direction.
- Domain logic should be testable without running a browser or server.
- Fixtures should be small, readable, and original/open content.
- No commercial D&D content should be committed.
