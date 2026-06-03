# 018 MVP-1.0 Live AI Playtest - Requirements

## Goal

Enable a monitored live AI DM playtest for the original 5e-compatible one-shot with 2–4 players, deterministic rules, spoiler checks, Host review, and session recap.

MVP-1.0 is an internal/playtest milestone, not an unsupervised public launch.

## User stories

### Story 1: Host can run live AI safely

As a Host, I want live AI narration to pass through validation, spoiler checks, and review gates, so that I can benefit from AI help without losing control.

#### Acceptance criteria

- WHEN live AI is disabled THEN the system refuses provider calls and tests still pass.
- WHEN live AI is enabled and configured THEN AI turns can be requested through a room-aware wrapper.
- WHEN AI output is low confidence THEN Host review is required.
- WHEN AI proposes a reveal or state patch THEN Host review is required.
- WHEN spoiler guard blocks output THEN Host review is required and output is not broadcast to players.
- WHEN AI output is safe public narration THEN it can be committed as public AI message event.

### Story 2: Rules remain deterministic

As a player, I want AI-requested checks to use the rules engine, so that the AI cannot invent dice results.

#### Acceptance criteria

- WHEN AI requests a skill check, ability check, or saving throw THEN rules engine resolves it.
- WHEN AI includes fabricated dice results THEN schema validation rejects the output.
- WHEN unsupported AI actions are proposed THEN they are rejected or sent to Host review, not executed directly.

### Story 3: Playtest can be evaluated

As the project owner, I want a documented playtest checklist and report, so that MVP-1.0 completion is based on evidence.

#### Acceptance criteria

- WHEN a live playtest finishes THEN a report records participants, adventure, duration, blockers, spoiler incidents, Host interventions, rules/combat outcomes, and recap status.
- WHEN playtest fails THEN blockers are documented and MVP-1.0 is not marked complete.
- WHEN player recap is generated THEN it excludes DM-only truths and rejected AI output.
- WHEN Host recap is generated THEN it includes Host-only unresolved threads.

## Functional requirements

1. Add a room-aware AI turn wrapper such as `runAiTurnForRoom`.
2. Build AI context from Host-safe room/adventure projections and hidden entities.
3. Route AI output through structured validation and spoiler guard.
4. Commit safe public AI output through room service/command boundaries.
5. Route check/save rule requests to deterministic rules engine and committed dice logs.
6. Require Host review for low confidence, reveal proposals, state patch proposals, and spoiler risk.
7. Add provider config gates using environment/config values without committing secrets.
8. Add golden AI-turn eval tests with mocked provider responses.
9. Add live playtest checklist and report template.
10. Keep live provider network calls disabled in default test suite.

## Non-goals

- Unsupervised public AI DM launch.
- Production auth/account system.
- Production billing.
- Full durable persistence.
- Full campaign memory.
- Full 5e rules automation.
- Arbitrary commercial PDF import.
- Public adventure marketplace.
- AI direct state mutation.
