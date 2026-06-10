const demoPresets = new Map([
  [
    "player_0002",
    {
      name: "Ada Thorne",
      className: "Fighter",
      abilities: {
        strength: 14,
        dexterity: 12,
        constitution: 14,
        intelligence: 10,
        wisdom: 11,
        charisma: 8,
      },
      armorClass: 16,
      maxHp: 12,
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
    },
  ],
  [
    "player_0003",
    {
      name: "Bran Vale",
      className: "Rogue",
      abilities: {
        strength: 10,
        dexterity: 16,
        constitution: 12,
        intelligence: 12,
        wisdom: 10,
        charisma: 12,
      },
      armorClass: 14,
      maxHp: 9,
      savingThrowProficiencies: ["dexterity"],
      skillProficiencies: ["stealth", "perception"],
      attacks: [
        {
          id: "attack_dagger",
          name: "Dagger",
          attackBonus: 5,
          damage: "1d4+3",
          damageType: "piercing",
        },
      ],
    },
  ],
]);

const genericPreset = {
  name: "Cora Reed",
  className: "Cleric",
  abilities: {
    strength: 12,
    dexterity: 10,
    constitution: 14,
    intelligence: 10,
    wisdom: 16,
    charisma: 12,
  },
  armorClass: 15,
  maxHp: 10,
  savingThrowProficiencies: ["wisdom", "charisma"],
  skillProficiencies: ["medicine", "insight"],
  attacks: [
    {
      id: "attack_mace",
      name: "Mace",
      attackBonus: 4,
      damage: "1d6+2",
      damageType: "bludgeoning",
    },
  ],
};

export function demoCharacterForPlayer(playerId) {
  const resolvedPlayerId =
    typeof playerId === "string" && playerId.length > 0 ? playerId : "player_demo";
  const preset = demoPresets.get(resolvedPlayerId) ?? genericPreset;

  return {
    id: `char_${resolvedPlayerId}`,
    playerId: resolvedPlayerId,
    name: preset.name,
    className: preset.className,
    level: 1,
    abilities: structuredClone(preset.abilities),
    armorClass: preset.armorClass,
    hitPoints: {
      current: preset.maxHp,
      max: preset.maxHp,
      temporary: 0,
    },
    speed: 30,
    savingThrowProficiencies: [...preset.savingThrowProficiencies],
    skillProficiencies: [...preset.skillProficiencies],
    attacks: structuredClone(preset.attacks),
    spells: [],
    inventory: [],
    conditions: [],
  };
}
