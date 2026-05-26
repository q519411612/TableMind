# 005 Character Sheet - Design

## Character model

```ts
type AbilityKey = "str" | "dex" | "con" | "int" | "wis" | "cha";

type Dnd5eCharacter = {
  id: string;
  playerId: string;
  name: string;
  ancestry?: string;
  className: string;
  level: number;
  abilities: Record<AbilityKey, number>;
  proficiencyBonus: number;
  armorClass: number;
  hitPoints: {
    current: number;
    max: number;
    temporary: number;
  };
  speed: number;
  savingThrowProficiencies: AbilityKey[];
  skillProficiencies: SkillKey[];
  attacks: AttackDefinition[];
  spells: SpellRef[];
  inventory: ItemRef[];
  conditions: ConditionRef[];
};
```

## MVP creation mode

MVP supports manual entry plus optional templates.

Suggested templates:

- fighter
- rogue
- cleric
- wizard

Templates should be SRD-compatible or original simplified templates.

## Validation

- ability score should usually be 1–30;
- level should initially be 1;
- HP current cannot exceed max + temporary unless explicitly allowed;
- AC must be positive;
- attack formulas must be parseable by rules engine.

## Derived values

Derived values may be calculated on read:

- ability modifiers;
- passive skill values later;
- proficiency bonus by level.

## Persistence

Characters are stored as part of session state during MVP. Later, reusable account-level characters can be added.

## UI notes

The MVP UI should favor speed over completeness.

A valid first version can be a form with:

- name
- class
- ability scores
- AC
- HP
- skill proficiencies
- one weapon attack
