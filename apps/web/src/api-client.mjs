export function createTableMindApi(input = {}) {
  const baseUrl = normalizeBaseUrl(input.baseUrl ?? "");
  const fetchImpl = input.fetchImpl ?? globalThis.fetch;

  if (typeof fetchImpl !== "function") {
    throw new Error("fetch is required");
  }

  async function requestJson(url, options = {}) {
    const response = await fetchImpl(url, options);
    return response.json();
  }

  return {
    createRoom(payload) {
      return requestJson(`${baseUrl}/rooms`, jsonPost(payload));
    },
    joinRoom(roomId, payload) {
      return requestJson(`${baseUrl}/rooms/${encodeURIComponent(roomId)}/join`, jsonPost(payload));
    },
    sendAction(roomId, command) {
      return requestJson(
        `${baseUrl}/rooms/${encodeURIComponent(roomId)}/actions`,
        jsonPost(command),
      );
    },
    getSnapshot(roomId, input) {
      const search = new URLSearchParams();
      if (input.sessionToken) {
        search.set("sessionToken", input.sessionToken);
      }
      if (input.viewerRole) {
        search.set("viewerRole", input.viewerRole);
      }
      if (input.viewerPlayerId) {
        search.set("viewerPlayerId", input.viewerPlayerId);
      }
      return requestJson(
        `${baseUrl}/rooms/${encodeURIComponent(roomId)}/snapshot?${search.toString()}`,
      );
    },
    getAdventureSnapshot(roomId, input) {
      const search = new URLSearchParams();
      if (input.sessionToken) {
        search.set("sessionToken", input.sessionToken);
      }
      if (input.viewerRole) {
        search.set("viewerRole", input.viewerRole);
      }
      if (input.viewerPlayerId) {
        search.set("viewerPlayerId", input.viewerPlayerId);
      }
      return requestJson(
        `${baseUrl}/rooms/${encodeURIComponent(roomId)}/adventure-snapshot?${search.toString()}`,
      );
    },
  };
}

export function createHostCommandClient(input) {
  const command = hostCommand(input);

  return {
    loadAdventure(adventure) {
      return command("adventure.load", { adventure });
    },
    startSession() {
      return command("session.start", {});
    },
    changeScene(sceneId, reason) {
      return command("scene.change", { sceneId, reason });
    },
    revealClue(clueId) {
      return command("clue.reveal", { clueId });
    },
    setAiPaused(paused, reason) {
      return command("ai.pause", { paused, reason });
    },
    updateReview(itemId, action, reason, proposedPayload) {
      return command("host.review.update", {
        itemId,
        action,
        reason,
        proposedPayload,
      });
    },
    listReviewQueue() {
      return command("host.review.list", {});
    },
    runAiTurn(payload = {}) {
      return command("ai.turn.run", payload);
    },
    commitAiMessage(message, reviewItemId, reviewStatus) {
      return command("ai.message.commit", {
        message,
        reviewItemId,
        reviewStatus,
      });
    },
    startCombat(payload) {
      return command("combat.start", payload);
    },
    patchHitPoints(combatantId, currentHp, reason) {
      return command("combat.patch_hp", {
        combatantId,
        currentHp,
        reason,
      });
    },
    patchCondition(combatantId, conditionId, action, reason) {
      return command("combat.patch_condition", {
        combatantId,
        condition: { conditionId },
        action,
        reason,
      });
    },
    advanceTurn() {
      return command("combat.advance_turn", {});
    },
    endCombat(reason) {
      return command("combat.end", { reason });
    },
    completeSession(ending, rewards) {
      return command("session.complete", { ending, rewards });
    },
    refreshSnapshot() {
      return input.api.getSnapshot(input.roomId, {
        sessionToken: input.hostSessionToken,
      });
    },
  };
}

export function createPlayerCommandClient(input) {
  const command = playerCommand(input);

  return {
    sendMessage(text) {
      return command("message.send", { text });
    },
    createCharacter(character) {
      return command("character.create", { character });
    },
    attack(payload) {
      return command("combat.attack", payload);
    },
    refreshSnapshot() {
      return input.api.getSnapshot(input.roomId, {
        sessionToken: input.playerSessionToken,
      });
    },
  };
}

function hostCommand(input) {
  return (type, payload) =>
    input.api.sendAction(input.roomId, {
      type,
      actorPlayerId: input.hostPlayerId,
      sessionToken: input.hostSessionToken,
      payload,
      now: currentTime(input),
    });
}

function playerCommand(input) {
  return (type, payload) =>
    input.api.sendAction(input.roomId, {
      type,
      actorPlayerId: input.playerId,
      sessionToken: input.playerSessionToken,
      payload,
      now: currentTime(input),
    });
}

function jsonPost(payload) {
  return {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  };
}

function currentTime(input) {
  return input.now ? input.now() : new Date().toISOString();
}

function normalizeBaseUrl(baseUrl) {
  return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
}
