import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createCharacter,
  deriveCharacterStats,
  validateCharacter,
} from "../src/index.mjs";

const validCharacterInput = {
  id: "char_ada",
  playerId: "player_ada",
  name: "Ada Thorne",
  className: "Fighter",
  level: 1,
  abilities: {
    strength: 14,
    dexterity: 12,
    constitution: 14,
    intelligence: 10,
    wisdom: 11,
    charisma: 8,
  },
  armorClass: 16,
  hitPoints: {
    current: 12,
    max: 12,
    temporary: 0,
  },
  speed: 30,
  savingThrowProficiencies: ["strength", "constitution"],
  skillProficiencies: ["athletics", "perception"],
  attacks: [
    {
      id: "attack_longsword",
      name: "Longsword",
      attackBonus: 5,
      damage: "1d8+3",
      damageType: "slashing",
    },
  ],
  spells: [],
  inventory: [{ id: "item_rope", name: "Rope" }],
  conditions: [],
};

test("creates a serializable level 1 character with derived stats", () => {
  const character = createCharacter(validCharacterInput);

  assert.equal(character.id, "char_ada");
  assert.equal(character.visibility, "public");
  assert.equal(character.proficiencyBonus, 2);
  assert.deepEqual(character.abilityModifiers, {
    strength: 2,
    dexterity: 1,
    constitution: 2,
    intelligence: 0,
    wisdom: 0,
    charisma: -1,
  });
  assert.deepEqual(JSON.parse(JSON.stringify(character)), character);
});

test("derives modifiers and proficiency without mutating input", () => {
  const input = structuredClone(validCharacterInput);
  const derived = deriveCharacterStats(input);

  assert.equal(derived.proficiencyBonus, 2);
  assert.equal(derived.abilityModifiers.strength, 2);
  assert.equal(input.proficiencyBonus, undefined);
  assert.equal(input.abilityModifiers, undefined);
});

test("validation rejects missing ability scores", () => {
  const input = structuredClone(validCharacterInput);
  delete input.abilities.charisma;

  assert.throws(() => validateCharacter(input), /charisma/);
});

test("validation rejects invalid level, hit points, armor class, and attack formula", () => {
  assert.throws(
    () => validateCharacter({ ...validCharacterInput, level: 2 }),
    /level/,
  );

  assert.throws(
    () =>
      validateCharacter({
        ...validCharacterInput,
        hitPoints: { current: 20, max: 12, temporary: 0 },
      }),
    /current HP/,
  );

  assert.throws(
    () => validateCharacter({ ...validCharacterInput, armorClass: 0 }),
    /armorClass/,
  );

  assert.throws(
    () =>
      validateCharacter({
        ...validCharacterInput,
        attacks: [
          {
            id: "attack_bad",
            name: "Bad Attack",
            attackBonus: 4,
            damage: "many dice",
            damageType: "force",
          },
        ],
      }),
    /damage/,
  );
});
