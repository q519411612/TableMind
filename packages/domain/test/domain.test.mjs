import assert from "node:assert/strict";
import { test } from "node:test";
import {
  appendSessionEvent,
  createCharacter,
  createInitialSessionState,
  projectSessionState,
  replaySessionEvents,
  validateSessionEvent,
} from "../src/index.mjs";

function baseEvent(overrides) {
  return {
    id: "event_base",
    sessionId: "session_test",
    actorRole: "system",
    createdAt: "2026-06-02T00:00:00.000Z",
    ...overrides,
  };
}

test("replay applies scene changes, clue reveals, and stored dice without rerolling", () => {
  const initial = createInitialSessionState({
    id: "session_test",
    roomId: "room_test",
    rulesetId: "5e-srd-5.2.1",
    adventureModuleId: "adventure_lantern",
    currentSceneId: "scene_village_square",
    now: "2026-06-02T00:00:00.000Z",
  });

  const events = [
    baseEvent({
      id: "event_scene",
      type: "scene.changed",
      actorRole: "host",
      sceneId: "scene_lantern_tower",
      reason: "Players reach the hill.",
    }),
    baseEvent({
      id: "event_clue",
      type: "clue.revealed",
      actorRole: "host",
      clueId: "clue_broken_lens",
      visibility: "revealed",
    }),
    baseEvent({
      id: "event_dice",
      type: "dice.rolled",
      actorRole: "system",
      roll: {
        formula: "1d20+2",
        terms: [{ count: 1, sides: 20, rolls: [16], modifier: 2 }],
        total: 18,
      },
      reason: "Investigation check.",
    }),
  ];

  const firstReplay = replaySessionEvents(events, initial);
  const secondReplay = replaySessionEvents(events, initial);

  assert.equal(firstReplay.currentSceneId, "scene_lantern_tower");
  assert.deepEqual(firstReplay.discoveredClueIds, ["clue_broken_lens"]);
  assert.deepEqual(firstReplay.diceLog, [
    {
      eventId: "event_dice",
      formula: "1d20+2",
      total: 18,
      reason: "Investigation check.",
    },
  ]);
  assert.deepEqual(secondReplay, firstReplay);
  assert.equal(firstReplay.version, 3);
});

test("append rejects invalid events before mutating state", () => {
  const initial = createInitialSessionState({
    id: "session_test",
    roomId: "room_test",
    rulesetId: "5e-srd-5.2.1",
    adventureModuleId: "adventure_lantern",
    currentSceneId: "scene_village_square",
    now: "2026-06-02T00:00:00.000Z",
  });

  assert.throws(
    () =>
      appendSessionEvent(initial, {
        id: "event_bad",
        sessionId: "session_test",
        type: "clue.revealed",
        actorRole: "host",
        createdAt: "2026-06-02T00:00:00.000Z",
      }),
    /clueId/,
  );

  assert.equal(initial.version, 0);
  assert.deepEqual(initial.discoveredClueIds, []);
});

test("lifecycle events validate and replay persistent room truth", () => {
  const initial = createInitialSessionState({
    id: "session_test",
    roomId: "room_test",
    rulesetId: "5e-srd-5.2.1",
    adventureModuleId: "adventure_placeholder",
    currentSceneId: "scene_placeholder",
    now: "2026-06-02T00:00:00.000Z",
  });
  const character = createCharacter({
    id: "char_ada",
    playerId: "player_2",
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
    skillProficiencies: ["athletics"],
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
    inventory: [],
    conditions: [],
  });
  const events = [
    baseEvent({
      id: "event_host",
      type: "player.joined",
      actorRole: "system",
      player: {
        id: "player_1",
        displayName: "Host",
        role: "host",
        visibility: "public",
      },
    }),
    baseEvent({
      id: "event_player",
      type: "player.joined",
      actorRole: "system",
      player: {
        id: "player_2",
        displayName: "Ada",
        role: "player",
        visibility: "public",
      },
    }),
    baseEvent({
      id: "event_character",
      type: "character.created",
      actorRole: "system",
      playerId: "player_2",
      character,
    }),
    baseEvent({
      id: "event_adventure",
      type: "adventure.loaded",
      actorRole: "host",
      adventureModuleId: "adventure_lantern_beneath_hill",
      startingSceneId: "scene_village_square",
    }),
    baseEvent({
      id: "event_started",
      type: "session.started",
      actorRole: "host",
      reason: "Host started the session.",
    }),
  ];

  const replayed = replaySessionEvents(events, initial);

  assert.equal(replayed.players.player_1.role, "host");
  assert.equal(replayed.players.player_2.displayName, "Ada");
  assert.equal(replayed.players.player_2.characterId, "char_ada");
  assert.equal(replayed.characters.char_ada.proficiencyBonus, 2);
  assert.equal(replayed.adventureModuleId, "adventure_lantern_beneath_hill");
  assert.equal(replayed.currentSceneId, "scene_village_square");
  assert.equal(replayed.phase, "playing");
  assert.deepEqual(
    replayed.eventLog.map((event) => event.type),
    [
      "player.joined",
      "player.joined",
      "character.created",
      "adventure.loaded",
      "session.started",
    ],
  );
});

test("character creation event requires an existing player", () => {
  const initial = createInitialSessionState({
    id: "session_test",
    roomId: "room_test",
    rulesetId: "5e-srd-5.2.1",
    adventureModuleId: "adventure_placeholder",
    currentSceneId: "scene_placeholder",
    now: "2026-06-02T00:00:00.000Z",
  });
  const character = createCharacter({
    id: "char_ada",
    playerId: "player_missing",
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
    skillProficiencies: ["athletics"],
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
    inventory: [],
    conditions: [],
  });

  assert.throws(
    () =>
      appendSessionEvent(
        initial,
        baseEvent({
          id: "event_character",
          type: "character.created",
          actorRole: "system",
          playerId: "player_missing",
          character,
        }),
      ),
    /player not found/,
  );
  assert.deepEqual(initial.characters, {});
});

test("player projection strips dm_only data but keeps own player_specific data", () => {
  const state = createInitialSessionState({
    id: "session_test",
    roomId: "room_test",
    rulesetId: "5e-srd-5.2.1",
    adventureModuleId: "adventure_lantern",
    currentSceneId: "scene_village_square",
    now: "2026-06-02T00:00:00.000Z",
  });

  state.players.player_1 = {
    id: "player_1",
    displayName: "Ada",
    role: "player",
    characterId: "char_1",
    visibility: "public",
    notes: "Ready.",
    privateNotes: "The whisper feels familiar.",
    privateOwnerPlayerId: "player_1",
  };
  state.players.player_2 = {
    id: "player_2",
    displayName: "Bran",
    role: "player",
    characterId: "char_2",
    visibility: "public",
    privateNotes: "Secret fear of old shrines.",
    privateOwnerPlayerId: "player_2",
  };
  state.npcs.npc_mira = {
    id: "npc_mira",
    name: "Mira",
    publicDescription: "A worried apprentice.",
    dmNotes: "She broke the seal.",
    visibility: "dm_only",
  };
  state.flags.publicWeather = {
    visibility: "public",
    value: "storm clouds",
  };
  state.flags.hiddenTruth = {
    visibility: "dm_only",
    value: "The lantern covers a shrine.",
  };
  state.flags.personalWhisper = {
    visibility: "player_specific",
    playerId: "player_1",
    value: "You hear a faint plea.",
  };

  const playerView = projectSessionState({
    state,
    viewerRole: "player",
    viewerPlayerId: "player_1",
  });
  const hostView = projectSessionState({ state, viewerRole: "host" });

  assert.equal(playerView.npcs.npc_mira, undefined);
  assert.equal(playerView.flags.hiddenTruth, undefined);
  assert.equal(playerView.flags.personalWhisper.value, "You hear a faint plea.");
  assert.equal(playerView.players.player_1.privateNotes, "The whisper feels familiar.");
  assert.equal(playerView.players.player_2.privateNotes, undefined);
  assert.equal(hostView.npcs.npc_mira.dmNotes, "She broke the seal.");
  assert.equal(hostView.flags.hiddenTruth.value, "The lantern covers a shrine.");
});

test("validation requires known event type and matching session id", () => {
  assert.throws(
    () =>
      validateSessionEvent(
        baseEvent({
          id: "event_unknown",
          type: "dragon.arrived",
        }),
        "session_test",
      ),
    /Unsupported event type/,
  );

  assert.throws(
    () =>
      validateSessionEvent(
        baseEvent({
          id: "event_wrong_session",
          type: "scene.changed",
          sessionId: "session_else",
          sceneId: "scene_lantern_tower",
        }),
        "session_test",
      ),
    /sessionId/,
  );
});
