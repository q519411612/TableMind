import assert from "node:assert/strict";
import { test } from "node:test";
import {
  abilityModifier,
  applyCondition,
  applyDamage,
  applyHealing,
  createSequenceRandomSource,
  proficiencyBonus,
  removeCondition,
  resolveAbilityCheck,
  resolveAttack,
  resolveDamage,
  resolveInitiative,
  resolveSavingThrow,
  resolveSkillCheck,
  rollDice,
} from "../src/index.mjs";

const character = {
  id: "char_ada",
  level: 1,
  abilities: {
    strength: 10,
    dexterity: 14,
    constitution: 12,
    intelligence: 16,
    wisdom: 11,
    charisma: 8,
  },
  proficientSkills: ["investigation"],
  proficientSaves: ["dexterity"],
};

test("rollDice parses common formulas with deterministic random source", () => {
  const random = createSequenceRandomSource([0, 0.5, 0.999]);

  assert.deepEqual(rollDice("1d20", random), {
    formula: "1d20",
    terms: [{ count: 1, sides: 20, rolls: [1] }],
    modifier: 0,
    total: 1,
  });

  assert.deepEqual(rollDice("2d6+3", random), {
    formula: "2d6+3",
    terms: [{ count: 2, sides: 6, rolls: [4, 6] }],
    modifier: 3,
    total: 13,
  });

  assert.deepEqual(rollDice(" 1d8 + 4 ", createSequenceRandomSource([0.25])), {
    formula: "1d8+4",
    terms: [{ count: 1, sides: 8, rolls: [3] }],
    modifier: 4,
    total: 7,
  });
});

test("ability modifiers and proficiency bonus follow MVP level range", () => {
  assert.equal(abilityModifier(8), -1);
  assert.equal(abilityModifier(10), 0);
  assert.equal(abilityModifier(15), 2);
  assert.equal(proficiencyBonus(1), 2);
  assert.equal(proficiencyBonus(5), 3);
});

test("checks and saves apply modifiers, proficiency, advantage, and DC boundary", () => {
  const skillCheck = resolveSkillCheck({
    character,
    skill: "investigation",
    dc: 15,
    advantage: "advantage",
    reason: "Search the broken lens.",
    randomSource: createSequenceRandomSource([0.2, 0.8]),
  });

  assert.equal(skillCheck.selectedD20, 17);
  assert.equal(skillCheck.abilityModifier, 3);
  assert.equal(skillCheck.proficiencyBonus, 2);
  assert.equal(skillCheck.total, 22);
  assert.equal(skillCheck.success, true);

  const abilityCheck = resolveAbilityCheck({
    character,
    ability: "charisma",
    dc: 10,
    advantage: "normal",
    reason: "Calm Mira.",
    randomSource: createSequenceRandomSource([0.5]),
  });

  assert.equal(abilityCheck.total, 10);
  assert.equal(abilityCheck.success, true);

  const savingThrow = resolveSavingThrow({
    character,
    ability: "dexterity",
    dc: 18,
    advantage: "disadvantage",
    reason: "Dodge falling stone.",
    randomSource: createSequenceRandomSource([0.95, 0.1]),
  });

  assert.equal(savingThrow.selectedD20, 3);
  assert.equal(savingThrow.total, 7);
  assert.equal(savingThrow.success, false);
});

test("initiative sorts by total, dexterity modifier, then stable id", () => {
  const order = resolveInitiative({
    combatants: [
      { id: "monster_b", dexterityScore: 14 },
      { id: "char_a", dexterityScore: 16 },
      { id: "monster_a", dexterityScore: 14 },
    ],
    randomSource: createSequenceRandomSource([0.4, 0.35, 0.4]),
  });

  assert.deepEqual(
    order.map((entry) => [entry.combatantId, entry.total]),
    [
      ["char_a", 11],
      ["monster_a", 11],
      ["monster_b", 11],
    ],
  );
});

test("attacks resolve natural 20, natural 1, armor class, and damage", () => {
  const attacker = {
    id: "char_ada",
    attackBonus: 5,
  };
  const target = {
    id: "monster_scavenger",
    armorClass: 14,
    currentHp: 9,
    maxHp: 9,
    conditions: [],
  };

  const critical = resolveAttack({
    attacker,
    target,
    attack: { name: "Shortsword", attackBonus: 5, damage: "1d6+3" },
    advantage: "normal",
    reason: "Strike the scavenger.",
    randomSource: createSequenceRandomSource([0.999]),
  });

  assert.equal(critical.selectedD20, 20);
  assert.equal(critical.hit, true);
  assert.equal(critical.critical, true);

  const miss = resolveAttack({
    attacker,
    target,
    attack: { name: "Shortsword", attackBonus: 5, damage: "1d6+3" },
    advantage: "normal",
    reason: "Strike the scavenger.",
    randomSource: createSequenceRandomSource([0]),
  });

  assert.equal(miss.selectedD20, 1);
  assert.equal(miss.hit, false);

  const damage = resolveDamage({
    target,
    formula: "1d6+3",
    damageType: "piercing",
    randomSource: createSequenceRandomSource([0.5]),
  });

  assert.equal(damage.amount, 7);
  assert.equal(damage.resultingHp, 2);
});

test("damage, healing, and conditions update combatant copies", () => {
  const target = {
    id: "char_ada",
    currentHp: 4,
    maxHp: 10,
    conditions: [],
  };

  const damaged = applyDamage(target, 5);
  assert.equal(damaged.currentHp, 0);
  assert.equal(damaged.defeated, true);

  const healed = applyHealing(damaged, 6);
  assert.equal(healed.currentHp, 6);
  assert.equal(healed.defeated, false);

  const grappled = applyCondition(healed, {
    conditionId: "condition_grappled",
    source: "monster_scavenger",
  });
  const released = removeCondition(grappled, "condition_grappled");

  assert.deepEqual(grappled.conditions, [
    { conditionId: "condition_grappled", source: "monster_scavenger" },
  ]);
  assert.deepEqual(released.conditions, []);
});

test("rules results are serializable for event logging", () => {
  const result = resolveSkillCheck({
    character,
    skill: "investigation",
    dc: 12,
    advantage: "normal",
    reason: "Inspect soot.",
    randomSource: createSequenceRandomSource([0.7]),
  });

  assert.deepEqual(JSON.parse(JSON.stringify(result)), result);
});
