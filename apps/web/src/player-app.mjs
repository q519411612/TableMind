import {
  createPlayerCommandClient,
  createTableMindApi,
} from "./api-client.mjs";
import { connectRoomEventStream } from "./event-stream-client.mjs";
import { renderPlayerRoom } from "./render-player.mjs";

const appState = {
  baseUrl: globalThis.localStorage?.getItem("tablemind.apiBaseUrl") ?? "",
  roomId: new URL(globalThis.location.href).searchParams.get("roomId") ?? "",
  playerId: globalThis.localStorage?.getItem("tablemind.playerId") ?? "",
  snapshot: undefined,
  adventureSnapshot: undefined,
  stream: undefined,
};

const api = createTableMindApi({ baseUrl: appState.baseUrl });
const root = document.querySelector("#app");

render();

root.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.target;

  if (form.dataset.action === "join-room") {
    const body = new FormData(form);
    appState.roomId = body.get("roomId");
    const result = await api.joinRoom(appState.roomId, {
      displayName: body.get("displayName"),
      now: new Date().toISOString(),
    });
    appState.playerId = result.data.playerId;
    appState.snapshot = result.snapshot;
    globalThis.localStorage?.setItem("tablemind.playerId", appState.playerId);
    connectStream();
    render();
  }

  if (form.dataset.action === "send-message") {
    const body = new FormData(form);
    const client = playerClient();
    const result = await client.sendMessage(body.get("message"));
    appState.snapshot = result.snapshot;
    render();
  }

  if (form.dataset.action === "combat-attack") {
    const body = new FormData(form);
    const character = Object.values(appState.snapshot?.characters ?? {}).find(
      (candidate) => candidate.playerId === appState.playerId,
    );
    const attack = character?.attacks?.[0];
    const client = playerClient();
    const result = await client.attack({
      attackerCombatantId: `combatant_${character.id}`,
      targetCombatantId: body.get("targetCombatantId"),
      attackId: attack?.id,
    });
    appState.snapshot = result.snapshot;
    render();
  }
});

root.addEventListener("click", async (event) => {
  const target = event.target.closest("button");
  if (!target) {
    return;
  }

  if (target.dataset.action === "refresh-snapshot") {
    const result = await playerClient().refreshSnapshot();
    appState.snapshot = result.snapshot;
    render();
  }

  if (target.dataset.action === "create-character") {
    const result = await playerClient().createCharacter(defaultCharacter());
    appState.snapshot = result.snapshot;
    render();
  }
});

function playerClient() {
  return createPlayerCommandClient({
    api,
    roomId: appState.roomId,
    playerId: appState.playerId,
  });
}

function connectStream() {
  appState.stream?.close();
  if (!appState.roomId || !appState.playerId) {
    return;
  }

  appState.stream = connectRoomEventStream({
    baseUrl: appState.baseUrl,
    roomId: appState.roomId,
    viewerRole: "player",
    viewerPlayerId: appState.playerId,
    onSnapshot(payload) {
      appState.snapshot = payload.snapshot;
      render();
    },
    onBroadcast(payload) {
      appState.snapshot = payload.broadcast.snapshot;
      render();
    },
  });
}

function render() {
  root.innerHTML = renderPlayerRoom(appState);
}

function defaultCharacter() {
  return {
    id: `char_${appState.playerId}`,
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
    inventory: [],
    conditions: [],
  };
}
