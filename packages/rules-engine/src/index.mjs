export const abilityKeys = [
  "strength",
  "dexterity",
  "constitution",
  "intelligence",
  "wisdom",
  "charisma",
];

export const skillAbilities = {
  athletics: "strength",
  acrobatics: "dexterity",
  sleight_of_hand: "dexterity",
  stealth: "dexterity",
  arcana: "intelligence",
  history: "intelligence",
  investigation: "intelligence",
  nature: "intelligence",
  religion: "intelligence",
  animal_handling: "wisdom",
  insight: "wisdom",
  medicine: "wisdom",
  perception: "wisdom",
  survival: "wisdom",
  deception: "charisma",
  intimidation: "charisma",
  performance: "charisma",
  persuasion: "charisma",
};

export function createSequenceRandomSource(values) {
  let index = 0;
  return () => {
    if (index >= values.length) {
      throw new Error("Random sequence exhausted");
    }
    const value = values[index];
    index += 1;
    validateRandomValue(value);
    return value;
  };
}

export function rollDice(formula, randomSource = Math.random) {
  const parsed = parseDiceFormula(formula);
  const rolls = [];

  for (let index = 0; index < parsed.count; index += 1) {
    rolls.push(rollDie(parsed.sides, randomSource));
  }

  const total = rolls.reduce((sum, value) => sum + value, 0) + parsed.modifier;

  return {
    formula: parsed.normalized,
    terms: [
      {
        count: parsed.count,
        sides: parsed.sides,
        rolls,
      },
    ],
    modifier: parsed.modifier,
    total,
  };
}

export function abilityModifier(score) {
  if (!Number.isInteger(score) || score < 1 || score > 30) {
    throw new Error(`Invalid ability score: ${score}`);
  }
  return Math.floor((score - 10) / 2);
}

export function proficiencyBonus(level) {
  if (!Number.isInteger(level) || level < 1 || level > 20) {
    throw new Error(`Invalid level: ${level}`);
  }
  return Math.ceil(level / 4) + 1;
}

export function resolveAbilityCheck(input) {
  return resolveD20Check({
    ...input,
    type: "ability_check",
    proficiencyApplies: false,
  });
}

export function resolveSkillCheck(input) {
  const ability = skillAbilities[input.skill];
  if (!ability) {
    throw new Error(`Unknown skill: ${input.skill}`);
  }

  return resolveD20Check({
    ...input,
    ability,
    type: "skill_check",
    proficiencyApplies: input.character.proficientSkills?.includes(input.skill) ?? false,
  });
}

export function resolveSavingThrow(input) {
  return resolveD20Check({
    ...input,
    type: "saving_throw",
    proficiencyApplies:
      input.character.proficientSaves?.includes(input.ability) ?? false,
  });
}

export function resolveInitiative(input) {
  const results = input.combatants.map((combatant) => {
    requireString(combatant, "id");
    const dexModifier = abilityModifier(combatant.dexterityScore);
    const roll = rollDice("1d20", input.randomSource);

    return {
      combatantId: combatant.id,
      roll,
      dexModifier,
      total: roll.total + dexModifier,
    };
  });

  return results.sort((left, right) => {
    if (right.total !== left.total) {
      return right.total - left.total;
    }
    if (right.dexModifier !== left.dexModifier) {
      return right.dexModifier - left.dexModifier;
    }
    return left.combatantId.localeCompare(right.combatantId);
  });
}

export function resolveAttack(input) {
  const attackBonus = resolveAttackBonus(input);
  const d20 = rollD20WithAdvantage(input.advantage, input.randomSource);
  const selectedD20 = d20.selected;
  const total = selectedD20 + attackBonus;
  const naturalOne = selectedD20 === 1;
  const naturalTwenty = selectedD20 === 20;
  const hit = naturalOne
    ? false
    : naturalTwenty || total >= input.target.armorClass;

  return {
    d20: d20.roll,
    selectedD20,
    attackBonus,
    total,
    targetArmorClass: input.target.armorClass,
    hit,
    critical: naturalTwenty,
    reason: input.reason,
  };
}

export function resolveDamage(input) {
  if (input.formula.includes("-")) {
    throw new Error("Damage formula cannot be negative");
  }

  const roll = rollDice(input.formula, input.randomSource);
  const criticalRoll = input.critical
    ? rollDice(diceOnlyFormula(input.formula), input.randomSource)
    : undefined;
  const amount = roll.total + (criticalRoll?.total ?? 0);
  const damaged = applyDamage(input.target, amount);

  return {
    roll,
    criticalRoll,
    amount,
    damageType: input.damageType,
    targetId: input.target.id,
    resultingHp: damaged.currentHp,
    resultingTemporaryHp: damaged.temporaryHp,
  };
}

export function applyDamage(target, amount) {
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error(`Invalid damage amount: ${amount}`);
  }

  const temporaryHp = targetTemporaryHitPoints(target);
  const absorbedByTemporaryHp = Math.min(temporaryHp, amount);
  const remainingDamage = amount - absorbedByTemporaryHp;
  const nextTemporaryHp = temporaryHp - absorbedByTemporaryHp;
  const currentHp = Math.max(0, target.currentHp - remainingDamage);
  return {
    ...target,
    currentHp,
    temporaryHp: nextTemporaryHp,
    defeated: currentHp === 0,
  };
}

function targetTemporaryHitPoints(target) {
  const value = target.temporaryHp ?? target.hitPoints?.temporary ?? 0;
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`Invalid temporary HP: ${value}`);
  }
  return value;
}

export function applyHealing(target, amount) {
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error(`Invalid healing amount: ${amount}`);
  }

  const currentHp = Math.min(target.maxHp, target.currentHp + amount);
  return {
    ...target,
    currentHp,
    defeated: currentHp === 0,
  };
}

export function applyCondition(target, condition) {
  requireString(condition, "conditionId");
  const conditions = target.conditions ?? [];
  if (conditions.some((entry) => entry.conditionId === condition.conditionId)) {
    return { ...target, conditions };
  }

  return {
    ...target,
    conditions: [...conditions, { ...condition }],
  };
}

export function removeCondition(target, conditionId) {
  requireNonEmptyString(conditionId, "conditionId");
  return {
    ...target,
    conditions: (target.conditions ?? []).filter(
      (condition) => condition.conditionId !== conditionId,
    ),
  };
}

function resolveD20Check(input) {
  validateAbility(input.ability);
  validateDc(input.dc);
  requireString(input, "reason");

  const abilityScore = input.character.abilities?.[input.ability];
  const abilityBonus = abilityModifier(abilityScore);
  const proficiency = input.proficiencyApplies
    ? proficiencyBonus(input.character.level)
    : 0;
  const d20 = rollD20WithAdvantage(input.advantage, input.randomSource);
  const total = d20.selected + abilityBonus + proficiency;

  return {
    type: input.type,
    ability: input.ability,
    skill: input.skill,
    d20: d20.roll,
    selectedD20: d20.selected,
    abilityModifier: abilityBonus,
    proficiencyBonus: proficiency,
    total,
    dc: input.dc,
    success: total >= input.dc,
    reason: input.reason,
  };
}

function rollD20WithAdvantage(advantage, randomSource) {
  if (!["normal", "advantage", "disadvantage"].includes(advantage)) {
    throw new Error(`Invalid advantage state: ${advantage}`);
  }

  const formula = advantage === "normal" ? "1d20" : "2d20";
  const roll = rollDice(formula, randomSource);
  const rolls = roll.terms[0].rolls;

  if (advantage === "advantage") {
    return { roll, selected: Math.max(...rolls) };
  }

  if (advantage === "disadvantage") {
    return { roll, selected: Math.min(...rolls) };
  }

  return { roll, selected: rolls[0] };
}

function resolveAttackBonus(input) {
  if (Number.isFinite(input.attack?.attackBonus)) {
    return input.attack.attackBonus;
  }

  if (Number.isFinite(input.attacker?.attackBonus)) {
    return input.attacker.attackBonus;
  }

  throw new Error("Attack bonus is required");
}

function parseDiceFormula(formula) {
  if (typeof formula !== "string") {
    throw new Error("Dice formula must be a string");
  }

  const normalized = formula.replace(/\s+/g, "");
  const match = /^(\d+)d(\d+)([+-]\d+)?$/.exec(normalized);
  if (!match) {
    throw new Error(`Invalid dice formula: ${formula}`);
  }

  const count = Number.parseInt(match[1], 10);
  const sides = Number.parseInt(match[2], 10);
  const modifier = match[3] ? Number.parseInt(match[3], 10) : 0;

  if (count < 1 || count > 100) {
    throw new Error(`Invalid dice count: ${count}`);
  }
  if (![4, 6, 8, 10, 12, 20, 100].includes(sides)) {
    throw new Error(`Unsupported dice sides: ${sides}`);
  }

  return {
    count,
    sides,
    modifier,
    normalized,
  };
}

function diceOnlyFormula(formula) {
  const parsed = parseDiceFormula(formula);
  return `${parsed.count}d${parsed.sides}`;
}

function rollDie(sides, randomSource) {
  const value = randomSource();
  validateRandomValue(value);
  return Math.floor(value * sides) + 1;
}

function validateRandomValue(value) {
  if (!Number.isFinite(value) || value < 0 || value >= 1) {
    throw new Error(`Random value must be in [0, 1): ${value}`);
  }
}

function validateAbility(ability) {
  if (!abilityKeys.includes(ability)) {
    throw new Error(`Unknown ability: ${ability}`);
  }
}

function validateDc(dc) {
  if (!Number.isInteger(dc) || dc < 0) {
    throw new Error(`Invalid DC: ${dc}`);
  }
}

function requireString(object, key) {
  requireNonEmptyString(object?.[key], key);
}

function requireNonEmptyString(value, label) {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${label} is required`);
  }
}
