# 003 Domain Model and Event Log - Tasks

## Types

- [ ] Define ID aliases or branded types.
- [ ] Define Visibility enum/type.
- [ ] Define PlayerState.
- [ ] Define CharacterState.
- [ ] Define NPCState.
- [ ] Define MonsterState.
- [ ] Define CombatState.
- [ ] Define SessionState.
- [ ] Define SessionEvent variants.

## Event handling

- [ ] Implement event validation.
- [ ] Implement event append contract.
- [ ] Implement replay skeleton.
- [ ] Implement state patch application.
- [ ] Implement event correlation IDs.

## Projection

- [ ] Implement Host projection.
- [ ] Implement player projection.
- [ ] Ensure dm_only data is stripped for player views.
- [ ] Add tests for player_specific visibility.

## Tests

- [ ] Test replay is deterministic.
- [ ] Test dice events are not rerolled during replay.
- [ ] Test clue reveal event updates discovered clues.
- [ ] Test scene change event updates current scene.
- [ ] Test invalid event rejection.
