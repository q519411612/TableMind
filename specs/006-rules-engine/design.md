# 006 Rules Engine - Design

## Responsibility

The rules engine is deterministic game logic. It does not call AI providers, does not read prompts, and does not own persistence.

It accepts typed inputs and returns typed results suitable for event logging.

## Dice

```ts
export type DiceRoll = {
  formula: string;
  terms: DiceTerm[];
  total: number;
};

export type DiceTerm = {
  count: number;
  sides: number;
  rolls: number[];
  modifier?: number;
};
```

Dice should support injected randomness:

```ts
type RandomSource = () => number; // returns [0, 1)
```

## Third-party dice parser policy

The rules engine may use an approved third-party dice parser behind a TableMind-owned adapter.

The adapter must return TableMind-owned result types such as `DiceRoll`, `DiceTerm`, `CheckResult`, and `AttackResult`.

The rules engine must still own:

- RNG injection or equivalent deterministic test control;
- advantage/disadvantage selection;
- success/failure semantics;
- critical hit semantics;
- serialization into SessionEvents;
- validation and execution limits for dice formulas.

Third-party parser AST/result types must not leak into domain events or public APIs.

## Ability modifiers

```ts
function abilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}
```

## Checks

```ts
export type AdvantageState = "normal" | "advantage" | "disadvantage";

export type CheckInput = {
  character: CharacterState;
  ability: AbilityKey;
  skill?: SkillKey;
  dc: number;
  advantage: AdvantageState;
  reason: string;
};

export type CheckResult = {
  type: "ability_check" | "skill_check" | "saving_throw";
  d20: DiceRoll;
  selectedD20: number;
  abilityModifier: number;
  proficiencyBonus: number;
  total: number;
  dc: number;
  success: boolean;
  reason: string;
};
```

## Attacks

```ts
export type AttackInput = {
  attacker: CombatantState;
  target: CombatantState;
  attack: AttackDefinition;
  advantage: AdvantageState;
  reason: string;
};

export type AttackResult = {
  d20: DiceRoll;
  selectedD20: number;
  attackBonus: number;
  total: number;
  targetArmorClass: number;
  hit: boolean;
  critical: boolean;
  reason: string;
};
```

Critical hit handling can be simple in MVP: natural 20 sets `critical = true`; natural 1 misses.

## Damage

```ts
export type DamageInput = {
  target: CombatantState;
  formula: string;
  damageType?: string;
  critical?: boolean;
};

export type DamageResult = {
  roll: DiceRoll;
  amount: number;
  damageType?: string;
  targetId: string;
  resultingHp: number;
};
```

MVP may ignore resistance/vulnerability unless explicitly modeled.

## Conditions

Conditions should be represented as IDs matching compendium entries where possible.

```ts
export type ConditionApplication = {
  targetId: string;
  conditionId: string;
  duration?: string;
  source?: string;
};
```

## Initiative

```ts
export type InitiativeResult = {
  combatantId: string;
  roll: DiceRoll;
  dexModifier: number;
  total: number;
};
```

Initiative order sorts by total descending. Ties may be resolved by dex modifier, then stable ID order for determinism.

## Event integration

Rules engine results should be serializable into events:

- `dice.rolled`
- `check.resolved`
- `attack.resolved`
- `damage.applied`
- `condition.applied`
- `initiative.rolled`

The rules engine returns data; the session service decides how to persist it.

## Error handling

Rules functions should reject invalid inputs:

- unknown ability
- invalid DC
- invalid dice formula
- missing character stats
- negative damage unless explicitly healing
