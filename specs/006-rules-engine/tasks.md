# 006 Rules Engine - Tasks

## Dice

- [ ] Implement dice formula parser.
- [ ] Implement deterministic RNG injection.
- [ ] Evaluate whether selected dice parser supports deterministic test control or can be wrapped safely.
- [ ] Implement dice parser adapter behind TableMind-owned result types.
- [ ] Implement d20 advantage/disadvantage selection.
- [ ] Test `1d20`, `2d6+3`, and whitespace variants.

## Core 5e helpers

- [ ] Implement ability modifier calculation.
- [ ] Implement proficiency bonus helper for MVP levels.
- [ ] Define ability keys.
- [ ] Define skill keys and related abilities.

## Checks and saves

- [ ] Implement ability check.
- [ ] Implement skill check.
- [ ] Implement saving throw.
- [ ] Test DC success boundary.
- [ ] Test proficiency application.
- [ ] Test advantage and disadvantage.

## Combat basics

- [ ] Implement initiative roll.
- [ ] Implement deterministic initiative sorting.
- [ ] Implement attack roll vs AC.
- [ ] Implement natural 20 and natural 1 handling.
- [ ] Implement damage roll.
- [ ] Implement apply damage.
- [ ] Implement healing.
- [ ] Implement apply/remove condition.

## Event compatibility

- [ ] Define result payloads for event logging.
- [ ] Add tests that results are serializable.
- [ ] Add examples for event conversion.

## Deferrals

- [ ] Do NOT implement full spell automation.
- [ ] Do NOT implement full class features.
- [ ] Do NOT implement grid movement.
- [ ] Do NOT implement complex reactions.
