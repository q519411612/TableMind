import { runAiDmTurn } from "./ai-dm-orchestrator.mjs";

const publicHistoryEventTypes = new Set([
  "player.joined",
  "character.created",
  "adventure.loaded",
  "session.started",
  "player.message",
  "ai.message",
  "system.message",
  "dice.rolled",
  "scene.changed",
  "clue.revealed",
  "combat.started",
  "combat.turn_advanced",
  "combat.ended",
  "attack.resolved",
  "damage.applied",
]);

export function loadAiProviderConfig(env = {}) {
  const enabled = env.TABLEMIND_AI_PROVIDER_ENABLED === "true";
  if (!enabled) {
    return { enabled: false };
  }

  return {
    enabled: true,
    endpoint: requireEnv(env, "TABLEMIND_AI_PROVIDER_ENDPOINT"),
    apiKey: requireEnv(env, "TABLEMIND_AI_PROVIDER_API_KEY"),
    model: requireEnv(env, "TABLEMIND_AI_PROVIDER_MODEL"),
    timeoutMs: env.TABLEMIND_AI_PROVIDER_TIMEOUT_MS
      ? Number.parseInt(env.TABLEMIND_AI_PROVIDER_TIMEOUT_MS, 10)
      : undefined,
  };
}

export function buildAiContextForRoom(input) {
  const session = input.roomService.getSnapshot({
    roomId: input.roomId,
    viewerRole: "host",
  });
  const adventure = input.roomService.getAdventureSnapshot({
    roomId: input.roomId,
    viewerRole: "host",
  });
  const discoveredClues = new Set(session.discoveredClueIds ?? []);
  const currentScene = adventure.currentScene;

  return {
    session,
    currentScene,
    recentPublicEvents: publicHistory(session.eventLog ?? []),
    hiddenEntities: hiddenEntitiesForScene(currentScene),
    unrevealedClues: (currentScene.clues ?? []).filter(
      (clue) => clue.visibility === "dm_only" && !discoveredClues.has(clue.id),
    ),
    dmOnlySecrets: adventure.truth ?? [],
    combat: session.combat,
    policy: {
      diceResults: "forbidden",
      stateMutation: "host_review_required",
      reveal: "host_review_required",
      allowedRuleRequests: ["skill_check", "ability_check", "saving_throw"],
    },
  };
}

export async function runAiTurnForRoom(input) {
  if (input.providerConfig && !input.providerConfig.enabled) {
    return {
      status: "provider_disabled",
      error: {
        code: "provider_disabled",
        message: "AI provider is disabled.",
      },
    };
  }

  if (!input.adapter) {
    return {
      status: "provider_disabled",
      error: {
        code: "provider_disabled",
        message: "AI adapter is not configured.",
      },
    };
  }

  const context = buildAiContextForRoom(input);
  let aiTurn;
  try {
    aiTurn = await runAiDmTurn({
      adapter: input.adapter,
      context,
      randomSource: input.randomSource,
    });
  } catch (error) {
    return {
      status: "rejected",
      error: {
        code: "invalid_ai_output",
        message: error.message,
      },
      events: [],
      broadcasts: [],
    };
  }

  if (aiTurn.status === "host_review_required") {
    const reviewItem = input.roomService.addHostReviewItem({
      roomId: input.roomId,
      type: aiTurn.reviewItem.type,
      proposedPayload: aiTurn.reviewItem.proposedPayload,
      reason: aiTurn.reviewItem.reason,
      riskLevel: aiTurn.reviewItem.riskLevel,
      actorId: input.hostPlayerId,
      actorRole: "ai_dm",
      now: input.now,
    });

    return {
      status: "host_review_required",
      reviewItem,
      ruleResults: aiTurn.ruleResults,
      spoilerCheck: aiTurn.spoilerCheck,
      events: [input.roomService.getCommittedEvents(input.roomId).at(-1)],
      broadcasts: [],
    };
  }

  const diceEvents = [];
  for (const ruleResult of aiTurn.ruleResults ?? []) {
    const committed = input.roomService.commitDiceRoll({
      roomId: input.roomId,
      roll: ruleResult.d20,
      reason: ruleResult.reason,
      now: input.now,
    });
    diceEvents.push(committed.event);
  }

  const committedMessage = input.roomService.commitApprovedAiMessage({
    roomId: input.roomId,
    hostPlayerId: input.hostPlayerId,
    message: aiTurn.response.publicMessage,
    reviewStatus: "auto_approved",
    now: input.now,
  });

  return {
    status: "broadcast_ready",
    events: [...diceEvents, committedMessage.event],
    broadcasts: committedMessage.broadcasts,
    ruleResults: aiTurn.ruleResults,
    spoilerCheck: aiTurn.spoilerCheck,
    response: aiTurn.response,
  };
}

function publicHistory(events) {
  return events
    .filter((event) => publicHistoryEventTypes.has(event.type))
    .filter((event) => event.visibility !== "dm_only")
    .slice(-20)
    .map((event) => structuredClone(event));
}

function hiddenEntitiesForScene(scene) {
  return [
    ...(scene.npcs ?? []).map((npc) => ({
      id: npc.id,
      entityType: "npc",
      title: npc.name,
      name: npc.name,
      aliases: npc.aliases ?? [],
      visibility: npc.visibility,
    })),
    scene.encounter
      ? {
          id: scene.encounter.id,
          entityType: "encounter",
          title: scene.encounter.title,
          name: scene.encounter.title,
          aliases: scene.encounter.aliases ?? [],
          visibility: scene.encounter.visibility,
        }
      : undefined,
  ].filter(Boolean);
}

function requireEnv(env, key) {
  if (typeof env[key] !== "string" || env[key].length === 0) {
    throw new Error(`${key} is required when AI provider is enabled`);
  }
  return env[key];
}
