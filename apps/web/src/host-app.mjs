import {
  createHostCommandClient,
  createTableMindApi,
} from "./api-client.mjs";
import { connectRoomEventStream } from "./event-stream-client.mjs";
import { renderHostRoom } from "./render-host.mjs";

const appState = {
  baseUrl: globalThis.localStorage?.getItem("tablemind.apiBaseUrl") ?? "",
  room: undefined,
  snapshot: undefined,
  adventureSnapshot: undefined,
  reviewQueue: [],
  stream: undefined,
};

const api = createTableMindApi({ baseUrl: appState.baseUrl });
const root = document.querySelector("#app");

render();

root.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.target;

  if (form.dataset.action === "create-room") {
    const body = new FormData(form);
    const result = await api.createRoom({
      hostDisplayName: body.get("hostDisplayName"),
      rulesetId: "5e-srd-5.2.1",
      adventureModuleId: "adventure_lantern_beneath_hill",
      startingSceneId: "scene_village_square",
      now: new Date().toISOString(),
    });
    appState.room = result.data;
    appState.snapshot = result.snapshot;
    connectStream();
    render();
  }

  if (form.dataset.command === "session.complete") {
    const body = new FormData(form);
    const result = await hostClient().completeSession(body.get("ending"), []);
    appState.snapshot = result.snapshot;
    render();
  }

  if (form.dataset.command === "combat.patch_hp") {
    const body = new FormData(form);
    const result = await hostClient().patchHitPoints(
      body.get("combatantId"),
      Number.parseInt(body.get("currentHp"), 10),
      "Host patched HP.",
    );
    appState.snapshot = result.snapshot;
    render();
  }

  if (form.dataset.command === "combat.patch_condition") {
    const body = new FormData(form);
    const result = await hostClient().patchCondition(
      body.get("combatantId"),
      body.get("condition"),
      body.get("action"),
      "Host patched condition.",
    );
    appState.snapshot = result.snapshot;
    await syncReviewQueue();
    render();
  }
});

root.addEventListener("click", async (event) => {
  const button = event.target.closest("button");
  if (!button) {
    return;
  }
  if (button.type === "submit") {
    return;
  }

  if (button.dataset.action === "refresh-snapshot") {
    if (!appState.room) {
      return;
    }
    const result = await hostClient().refreshSnapshot();
    appState.snapshot = result.snapshot;
    await syncAdventureSnapshot();
    await syncReviewQueue();
    render();
    return;
  }

  if (!button.dataset.command || !appState.room) {
    return;
  }

  const result = await dispatchHostCommand(button);
  if (result?.snapshot) {
    appState.snapshot = result.snapshot;
  }
  await syncAdventureSnapshot();
  await syncReviewQueue();
  render();
});

function hostClient() {
  return createHostCommandClient({
    api,
    roomId: appState.room.roomId,
    hostPlayerId: appState.room.hostPlayerId,
    hostSessionToken: appState.room.hostSessionToken,
  });
}

async function dispatchHostCommand(button) {
  const client = hostClient();
  if (button.dataset.command === "adventure.load") {
    const result = await client.loadAdventure(demoAdventure());
    appState.adventureSnapshot = result.snapshot;
    return result;
  }
  if (button.dataset.command === "session.start") {
    return client.startSession();
  }
  if (button.dataset.command === "scene.change") {
    return client.changeScene("scene_lantern_tower", "The party reaches the hill.");
  }
  if (button.dataset.command === "clue.reveal") {
    return client.revealClue(button.dataset.clueId ?? "clue_broken_lens");
  }
  if (button.dataset.command === "ai.pause") {
    return client.setAiPaused(button.dataset.paused === "true", "Host toggled AI pause.");
  }
  if (button.dataset.command === "host.review.update") {
    return client.updateReview(
      button.dataset.reviewId,
      button.dataset.actionValue,
      "Host reviewed output.",
    );
  }
  if (button.dataset.command === "ai.turn.run") {
    return client.runAiTurn();
  }
  if (button.dataset.command === "combat.start") {
    return client.startCombat({
      encounterId: "encounter_hill_scavengers",
      characterIds: Object.keys(appState.snapshot?.characters ?? {}),
      compendiumEntries: globalThis.tableMindCompendiumEntries ?? [],
    });
  }
  if (button.dataset.command === "combat.patch_hp") {
    return undefined;
  }
  if (button.dataset.command === "combat.patch_condition") {
    return undefined;
  }
  if (button.dataset.command === "combat.advance_turn") {
    return client.advanceTurn();
  }
  if (button.dataset.command === "combat.end") {
    return client.endCombat("Host ended combat.");
  }
  return undefined;
}

async function syncAdventureSnapshot() {
  if (!appState.room) {
    return;
  }
  const result = await api.getAdventureSnapshot(appState.room.roomId, {
    sessionToken: appState.room.hostSessionToken,
  });
  if (result.ok) {
    appState.adventureSnapshot = result.snapshot;
  }
}

async function syncReviewQueue() {
  if (!appState.room) {
    return;
  }
  const result = await hostClient().listReviewQueue();
  if (result.ok) {
    appState.reviewQueue = result.data.reviewQueue;
  }
}

function connectStream() {
  appState.stream?.close();
  if (!appState.room) {
    return;
  }

  appState.stream = connectRoomEventStream({
    baseUrl: appState.baseUrl,
    roomId: appState.room.roomId,
    sessionToken: appState.room.hostSessionToken,
    async onSnapshot(payload) {
      appState.snapshot = payload.snapshot;
      await syncAdventureSnapshot();
      await syncReviewQueue();
      render();
    },
    async onBroadcast(payload) {
      appState.snapshot = payload.broadcast.snapshot;
      await syncAdventureSnapshot();
      await syncReviewQueue();
      render();
    },
  });
}

function render() {
  root.innerHTML = renderHostRoom(appState);
}

function demoAdventure() {
  return (
    globalThis.tableMindDemoAdventure ?? {
      id: "adventure_lantern_beneath_hill",
      rulesetId: "5e-srd-5.2.1",
      startingSceneId: "scene_village_square",
      scenes: [
        {
          id: "scene_village_square",
          title: "Village Square",
          readAloud: {
            text: "The village square smells of wet rope, chimney smoke, and rain.",
          },
          clues: [],
          npcs: [],
        },
      ],
      truth: [],
      clues: [],
      npcs: [],
      encounters: [],
      endings: [],
    }
  );
}
