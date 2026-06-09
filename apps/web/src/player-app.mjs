import {
  createPlayerCommandClient,
  createTableMindApi,
} from "./api-client.mjs";
import { readBrowserLocale, storeBrowserLocale } from "./browser-locale.mjs";
import { connectRoomEventStream } from "./event-stream-client.mjs";
import { renderPlayerRoom } from "./render-player.mjs";

const appState = {
  baseUrl: globalThis.localStorage?.getItem("tablemind.apiBaseUrl") ?? "",
  locale: readBrowserLocale(),
  roomId: new URL(globalThis.location.href).searchParams.get("roomId") ?? "",
  playerId: globalThis.localStorage?.getItem("tablemind.playerId") ?? "",
  playerSessionToken:
    globalThis.localStorage?.getItem("tablemind.playerSessionToken") ?? "",
  snapshot: undefined,
  adventureSnapshot: undefined,
  recap: undefined,
  stream: undefined,
  errorMessage: undefined,
};

await loadPlaytestConfig();

const api = createTableMindApi({ baseUrl: appState.baseUrl });
const root = document.querySelector("#app");

render();

root.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.target;
  clearError();

  try {
    if (form.dataset.action === "join-room") {
      const body = new FormData(form);
      appState.roomId = body.get("roomId");
      const result = requireOkResult(
        await api.joinRoom(appState.roomId, {
          displayName: body.get("displayName"),
          now: new Date().toISOString(),
        }),
      );
      appState.playerId = result.data.playerId;
      appState.playerSessionToken = result.data.playerSessionToken;
      appState.snapshot = result.snapshot;
      globalThis.localStorage?.setItem("tablemind.playerId", appState.playerId);
      globalThis.localStorage?.setItem(
        "tablemind.playerSessionToken",
        appState.playerSessionToken,
      );
      await syncAdventureSnapshot();
      await syncRecap();
      connectStream();
      render();
    }

    if (form.dataset.action === "send-message") {
      const body = new FormData(form);
      const client = playerClient();
      const result = requireOkResult(await client.sendMessage(body.get("message")));
      appState.snapshot = result.snapshot;
      await syncAdventureSnapshot();
      await syncRecap();
      render();
    }

    if (form.dataset.action === "combat-attack") {
      const body = new FormData(form);
      const client = playerClient();
      const result = requireOkResult(
        await client.attack({
          attackerCombatantId: body.get("attackerCombatantId"),
          targetCombatantId: body.get("targetCombatantId"),
          attackId: body.get("attackId"),
        }),
      );
      appState.snapshot = result.snapshot;
      await syncAdventureSnapshot();
      await syncRecap();
      render();
    }
  } catch (error) {
    showError(error);
  }
});

root.addEventListener("click", async (event) => {
  const target = event.target.closest("button");
  if (!target) {
    return;
  }

  if (target.dataset.action === "set-language") {
    appState.locale = storeBrowserLocale(target.dataset.locale);
    await syncAdventureSnapshot();
    await syncRecap();
    render();
    return;
  }

  if (target.dataset.action === "refresh-snapshot") {
    clearError();
    try {
      const result = requireOkResult(await playerClient().refreshSnapshot());
      appState.snapshot = result.snapshot;
      await syncAdventureSnapshot();
      await syncRecap();
      render();
    } catch (error) {
      showError(error);
    }
  }

  if (target.dataset.action === "create-character") {
    clearError();
    try {
      const result = requireOkResult(
        await playerClient().createCharacter(defaultCharacter()),
      );
      appState.snapshot = result.snapshot;
      await syncAdventureSnapshot();
      await syncRecap();
      render();
    } catch (error) {
      showError(error);
    }
  }
});

function playerClient() {
  return createPlayerCommandClient({
    api,
    roomId: appState.roomId,
    playerId: appState.playerId,
    playerSessionToken: appState.playerSessionToken,
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
    sessionToken: appState.playerSessionToken,
    async onSnapshot(payload) {
      appState.snapshot = payload.snapshot;
      await syncAdventureSnapshot();
      await syncRecap();
      render();
    },
    async onBroadcast(payload) {
      appState.snapshot = payload.broadcast.snapshot;
      await syncAdventureSnapshot();
      await syncRecap();
      render();
    },
  });
}

async function syncAdventureSnapshot() {
  if (!appState.roomId || !appState.playerSessionToken) {
    return;
  }
  const result = await api.getAdventureSnapshot(appState.roomId, {
    sessionToken: appState.playerSessionToken,
    locale: appState.locale,
  });
  if (result.ok) {
    appState.adventureSnapshot = result.snapshot;
    return;
  }
  if (result.error?.code === "adventure_not_loaded") {
    appState.adventureSnapshot = undefined;
    return;
  }
  throw resultError(result);
}

async function syncRecap() {
  if (!appState.roomId || !appState.playerSessionToken || appState.snapshot?.phase !== "ended") {
    appState.recap = undefined;
    return;
  }
  const result = await api.getRecap(appState.roomId, {
    sessionToken: appState.playerSessionToken,
    locale: appState.locale,
  });
  if (result.ok) {
    appState.recap = result.data.recap;
    return;
  }
  throw resultError(result);
}

function render() {
  globalThis.document.documentElement.lang = appState.locale;
  root.innerHTML = renderPlayerRoom(appState);
}

async function loadPlaytestConfig() {
  const response = await fetch("/playtest/config.json");
  if (!response.ok) {
    throw new Error("Failed to load playtest config");
  }
  const config = await response.json();
  appState.baseUrl = appState.baseUrl || config.apiBaseUrl;
}

function clearError() {
  appState.errorMessage = undefined;
}

function showError(error) {
  appState.errorMessage = error.message;
  render();
}

function requireOkResult(result) {
  if (result?.ok === false) {
    throw resultError(result);
  }
  return result;
}

function resultError(result) {
  return new Error(result?.error?.message ?? result?.error?.code ?? "Command failed");
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
