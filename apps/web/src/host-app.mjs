import {
  createHostCommandClient,
  createTableMindApi,
} from "./api-client.mjs";
import { readBrowserLocale, storeBrowserLocale } from "./browser-locale.mjs";
import { connectRoomEventStream } from "./event-stream-client.mjs";
import { buildHostReviewUpdateFromForm } from "./host-review-form.mjs";
import { uiText } from "./i18n.mjs";
import { renderHostRoom } from "./render-host.mjs";

const appState = {
  baseUrl: globalThis.localStorage?.getItem("tablemind.apiBaseUrl") ?? "",
  locale: readBrowserLocale(),
  fixtureUrls: undefined,
  demoAdventure: undefined,
  compendiumEntries: [],
  room: undefined,
  snapshot: undefined,
  adventureSnapshot: undefined,
  reviewQueue: [],
  stream: undefined,
  errorMessage: undefined,
  statusMessage: undefined,
};

await loadPlaytestBootstrap();

const api = createTableMindApi({ baseUrl: appState.baseUrl });
const root = document.querySelector("#app");

render();

root.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.target;
  clearError();

  try {
    if (form.dataset.action === "create-room") {
      const body = new FormData(form);
      const result = requireOkResult(
        await api.createRoom({
          hostDisplayName: body.get("hostDisplayName"),
          rulesetId: "5e-srd-5.2.1",
          adventureModuleId: "adventure_lantern_beneath_hill",
          startingSceneId: "scene_village_square",
          now: new Date().toISOString(),
        }),
      );
      appState.room = result.data;
      appState.snapshot = result.snapshot;
      connectStream();
      render();
    }

    if (form.dataset.command === "session.complete") {
      const body = new FormData(form);
      const result = requireOkResult(
        await hostClient().completeSession(body.get("ending"), []),
      );
      appState.snapshot = result.snapshot;
      render();
    }

    if (form.dataset.command === "combat.patch_hp") {
      const body = new FormData(form);
      const result = requireOkResult(
        await hostClient().patchHitPoints(
          body.get("combatantId"),
          Number.parseInt(body.get("currentHp"), 10),
          "Host patched HP.",
        ),
      );
      appState.snapshot = result.snapshot;
      render();
    }

    if (form.dataset.command === "combat.patch_condition") {
      const body = new FormData(form);
      const result = requireOkResult(
        await hostClient().patchCondition(
          body.get("combatantId"),
          body.get("condition"),
          body.get("action"),
          "Host patched condition.",
        ),
      );
      appState.snapshot = result.snapshot;
      await syncReviewQueue();
      render();
    }

    if (form.dataset.command === "host.review.update") {
      const update = buildHostReviewUpdateFromForm(new FormData(form));
      const result = requireOkResult(
        await hostClient().updateReview(
          update.itemId,
          update.action,
          update.reason,
          update.proposedPayload,
        ),
      );
      if (result?.snapshot) {
        appState.snapshot = result.snapshot;
      }
      await syncReviewQueue();
      render();
    }
  } catch (error) {
    showError(error);
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

  if (button.dataset.action === "set-language") {
    appState.locale = storeBrowserLocale(button.dataset.locale);
    if (appState.room) {
      await syncAdventureSnapshot();
    }
    render();
    return;
  }

  if (button.dataset.action === "copy-invite") {
    clearError();
    try {
      await copyInvite(button.dataset.inviteLink);
      appState.statusMessage = uiText(appState.locale).copiedInvite;
      render();
    } catch (error) {
      showError(error);
    }
    return;
  }

  if (button.dataset.action === "refresh-snapshot") {
    if (!appState.room) {
      return;
    }
    clearError();
    try {
      const result = requireOkResult(await hostClient().refreshSnapshot());
      appState.snapshot = result.snapshot;
      await syncAdventureSnapshot();
      await syncReviewQueue();
      render();
    } catch (error) {
      showError(error);
    }
    return;
  }

  if (!button.dataset.command || !appState.room) {
    return;
  }

  clearError();
  try {
    const result = requireOkResult(await dispatchHostCommand(button));
    if (result?.snapshot) {
      appState.snapshot = result.snapshot;
    }
    applyCommandStatus(result);
    await syncAdventureSnapshot();
    await syncReviewQueue();
    render();
  } catch (error) {
    showError(error);
  }
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
    const result = await client.loadAdventure(await demoAdventure());
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
    return client.runAiTurn({ locale: appState.locale });
  }
  if (button.dataset.command === "combat.start") {
    return client.startCombat({
      encounterId: "encounter_hill_scavengers",
      characterIds: Object.keys(appState.snapshot?.characters ?? {}),
      compendiumEntries: appState.compendiumEntries,
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

function applyCommandStatus(result) {
  const labels = uiText(appState.locale);
  if (result?.commandType === "ai.turn.run" && result.data?.status === "provider_disabled") {
    appState.statusMessage = labels.providerDisabled;
    return;
  }
  if (result?.commandType === "ai.turn.run" && result.data?.status === "host_review_required") {
    appState.statusMessage = labels.aiReviewRequired;
  }
}

async function syncAdventureSnapshot() {
  if (!appState.room) {
    return;
  }
  const result = await api.getAdventureSnapshot(appState.room.roomId, {
    sessionToken: appState.room.hostSessionToken,
    locale: appState.locale,
  });
  if (result.ok) {
    appState.adventureSnapshot = result.snapshot;
    return;
  }
  throw resultError(result);
}

async function syncReviewQueue() {
  if (!appState.room) {
    return;
  }
  const result = await hostClient().listReviewQueue();
  if (result.ok) {
    appState.reviewQueue = result.data.reviewQueue;
    return;
  }
  throw resultError(result);
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
  globalThis.document.documentElement.lang = appState.locale;
  root.innerHTML = renderHostRoom(appState);
}

async function demoAdventure() {
  if (appState.demoAdventure) {
    return structuredClone(appState.demoAdventure);
  }
  const search = new URLSearchParams({
    roomId: appState.room.roomId,
    sessionToken: appState.room.hostSessionToken,
  });
  appState.demoAdventure = await loadJson(
    `${appState.fixtureUrls.adventureUrl}?${search.toString()}`,
  );
  return structuredClone(appState.demoAdventure);
}

async function loadPlaytestBootstrap() {
  const config = await loadJson("/playtest/config.json");
  appState.baseUrl = appState.baseUrl || config.apiBaseUrl;
  appState.fixtureUrls = config.fixtures;
  appState.compendiumEntries = (await loadJson(appState.fixtureUrls.compendiumUrl)).entries;
}

function clearError() {
  appState.errorMessage = undefined;
  appState.statusMessage = undefined;
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

async function copyInvite(inviteLink) {
  if (
    typeof inviteLink !== "string" ||
    inviteLink.length === 0 ||
    typeof globalThis.navigator?.clipboard?.writeText !== "function"
  ) {
    throw new Error(uiText(appState.locale).clipboardUnavailable);
  }
  await globalThis.navigator.clipboard.writeText(inviteLink);
}

async function loadJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load ${url}`);
  }
  return await response.json();
}
