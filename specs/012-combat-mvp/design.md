# 012 Combat MVP - Design

## CombatState

```ts
type CombatState = {
  id: string;
  encounterId?: string;
  status: "active" | "ended";
  round: number;
  turnIndex: number;
  combatants: CombatantState[];
};

type CombatantState = {
  id: string;
  kind: "character" | "npc" | "monster";
  displayName: string;
  armorClass: number;
  hitPoints: {
    current: number;
    max: number;
    temporary: number;
  };
  abilities: Record<AbilityKey, number>;
  attacks: AttackDefinition[];
  conditions: ConditionRef[];
  initiative?: number;
  status: "active" | "defeated" | "unconscious" | "dead" | "fled";
};
```

## Combat lifecycle

```txt
encounter selected
  -> create combatants
  -> roll initiative
  -> commit combat.started
  -> current turn active
  -> resolve actions
  -> advance turn
  -> end combat
```

## Turn advancement

Turn advancement increments `turnIndex`.

If turnIndex exceeds combatants length, reset to 0 and increment round.

Defeated/fled combatants may be skipped.

## Actions

MVP combat actions:

- attack
- end turn
- apply condition
- use simple item/heal manually

## AI DM role

AI DM may narrate combat and suggest monster actions.

Rules engine resolves attacks/damage.

Host can override any monster action.

## Event integration

Combat events:

- `combat.started`
- `initiative.rolled`
- `attack.resolved`
- `damage.applied`
- `combat.turn_advanced`
- `combat.ended`
