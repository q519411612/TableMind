# 002 Project Foundation - Design

## Intent

The repository foundation should optimize for:

- incremental delivery;
- strong domain modeling;
- deterministic testing;
- coding-agent readability;
- low coupling between AI orchestration and core game logic.

## Recommended repository structure

```txt
/apps
  /web
  /server
/packages
  /domain
  /rules-engine
  /compendium
  /adventure-loader
  /shared-test-fixtures
/specs
/docs
```

This structure is a recommendation, not a hard requirement.

## Package responsibilities

### packages/domain

Contains:

- core types
- session state
- event definitions
- visibility enums
- shared utility contracts

Must have no UI dependencies.

### packages/rules-engine

Contains deterministic game logic.

Examples:

- dice utilities
- ability modifier calculation
- attack resolution
- damage resolution
- conditions

Must not depend on AI provider code.

### packages/compendium

Contains:

- SRD entry types
- compendium search interfaces
- fixture loaders
- indexing utilities

### packages/adventure-loader

Contains:

- structured markdown parser
- adventure validation
- visibility tagging
- fixture loading

### apps/server

Responsible for:

- websocket room orchestration
- session state persistence
- AI DM orchestration
- authorization
- spoiler filtering

### apps/web

Responsible for:

- player room UI
- host panel UI
- dice log display
- combat display

## Testing strategy

### Unit tests

Must cover:

- dice
- ability modifiers
- attacks
- damage
- state replay
- visibility filtering
- markdown parsing

### Fixture tests

Must load:

- demo adventure fixture
- small SRD compendium fixture

### Integration tests

Should eventually validate:

- websocket event propagation
- event replay
- state patch application
- host approval flow

## Fixture strategy

Fixtures should live in:

```txt
/packages/shared-test-fixtures
```

Recommended fixture categories:

```txt
/adventures
/compendium
/characters
/events
/sessions
```

## Dependency direction

Recommended dependency graph:

```txt
apps/web -> packages/domain
apps/server -> packages/domain
apps/server -> packages/rules-engine
apps/server -> packages/compendium
apps/server -> packages/adventure-loader
```

Avoid cyclic dependencies.

## Out of scope

This spec intentionally does not decide:

- exact frontend framework;
- exact backend framework;
- database engine;
- hosting provider;
- authentication provider.

Those should be selected during implementation planning.
