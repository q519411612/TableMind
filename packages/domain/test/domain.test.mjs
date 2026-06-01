import assert from "node:assert/strict";
import { test } from "node:test";
import {
  appendSessionEvent,
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
