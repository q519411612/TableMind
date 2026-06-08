import { runAiDmTurn } from "./ai-dm-orchestrator.mjs";

const defaultMaxContextBytes = 32000;
const maxPublicEventTextCharacters = 320;

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
    timeoutMs: parseProviderTimeout(env.TABLEMIND_AI_PROVIDER_TIMEOUT_MS),
  };
}

export function buildAiContextForRoom(input) {
  const sessionSnapshot = input.roomService.getSnapshot({
    roomId: input.roomId,
    viewerRole: "host",
  });
  const adventure = input.roomService.getAdventureSnapshot({
    roomId: input.roomId,
    viewerRole: "host",
    locale: input.locale,
  });
  const discoveredClues = new Set(sessionSnapshot.discoveredClueIds ?? []);
  const currentScene = adventure.currentScene;
  const maxContextBytes = normalizeMaxContextBytes(
    input.maxContextBytes ?? defaultMaxContextBytes,
  );

  const requiredContext = {
    session: sessionBasicsForAi(sessionSnapshot),
    currentScene,
    recentPublicEvents: [],
    hiddenEntities: hiddenEntitiesForScene(currentScene),
    unrevealedClues: (currentScene.clues ?? []).filter(
      (clue) => clue.visibility === "dm_only" && !discoveredClues.has(clue.id),
    ),
    dmOnlySecrets: adventure.truth ?? [],
    combat: sessionSnapshot.combat,
    policy: {
      diceResults: "forbidden",
      stateMutation: "host_review_required",
      reveal: "host_review_required",
      allowedRuleRequests: ["skill_check", "ability_check", "saving_throw"],
    },
  };

  return withBoundedPublicHistory({
    context: requiredContext,
    publicEvents: publicHistoryCandidates(sessionSnapshot.eventLog ?? []),
    maxContextBytes,
  });
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
    if (
      error.code === "provider_timeout" ||
      error.code === "provider_request_failed" ||
      error.code === "invalid_provider_payload"
    ) {
      return {
        status: "rejected",
        error: {
          code: error.code,
          message: error.message,
        },
        events: [],
        broadcasts: [],
      };
    }
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
      check: checkEventData(ruleResult),
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

function publicHistoryCandidates(events) {
  return events
    .filter((event) => publicHistoryEventTypes.has(event.type))
    .filter((event) => event.visibility !== "dm_only")
    .map(summarizePublicEventForAi);
}

function withBoundedPublicHistory(input) {
  const budget = {
    maxBytes: input.maxContextBytes,
    usedBytes: 0,
    truncatedRecentPublicEvents: false,
    omittedRecentPublicEventCount: 0,
  };
  const baseContext = {
    ...input.context,
    contextBudget: budget,
  };

  assertRequiredContextFits(baseContext, input.maxContextBytes);

  let recentPublicEvents = [];
  for (let index = input.publicEvents.length - 1; index >= 0; index -= 1) {
    const nextEvents = [input.publicEvents[index], ...recentPublicEvents];
    const candidate = withBudget(input.context, {
      ...budget,
      truncatedRecentPublicEvents: nextEvents.length < input.publicEvents.length,
      omittedRecentPublicEventCount: input.publicEvents.length - nextEvents.length,
    }, nextEvents);

    if (serializedByteLength(candidate) <= input.maxContextBytes) {
      recentPublicEvents = nextEvents;
      continue;
    }

    break;
  }

  let output = withBudget(input.context, {
    ...budget,
    truncatedRecentPublicEvents: recentPublicEvents.length < input.publicEvents.length,
    omittedRecentPublicEventCount: input.publicEvents.length - recentPublicEvents.length,
  }, recentPublicEvents);
  output.contextBudget.usedBytes = serializedByteLength(output);

  while (
    output.contextBudget.usedBytes > input.maxContextBytes &&
    recentPublicEvents.length > 0
  ) {
    recentPublicEvents = recentPublicEvents.slice(1);
    output = withBudget(input.context, {
      ...budget,
      truncatedRecentPublicEvents: recentPublicEvents.length < input.publicEvents.length,
      omittedRecentPublicEventCount: input.publicEvents.length - recentPublicEvents.length,
    }, recentPublicEvents);
    output.contextBudget.usedBytes = serializedByteLength(output);
  }

  return output;
}

function withBudget(context, budget, recentPublicEvents) {
  return {
    ...context,
    recentPublicEvents,
    contextBudget: structuredClone(budget),
  };
}

function assertRequiredContextFits(context, maxContextBytes) {
  const requiredOnlyBytes = serializedByteLength(context);
  if (requiredOnlyBytes > maxContextBytes) {
    throw new Error(
      `AI context required fields exceed maxContextBytes: ${requiredOnlyBytes} > ${maxContextBytes}`,
    );
  }
}

function sessionBasicsForAi(session) {
  return {
    id: session.id,
    roomId: session.roomId,
    rulesetId: session.rulesetId,
    adventureModuleId: session.adventureModuleId,
    currentSceneId: session.currentSceneId,
    phase: session.phase,
    players: structuredClone(session.players ?? {}),
    characters: structuredClone(session.characters ?? {}),
    discoveredClueIds: structuredClone(session.discoveredClueIds ?? []),
    revealedSecretIds: structuredClone(session.revealedSecretIds ?? []),
    diceLog: structuredClone(session.diceLog ?? []),
    flags: structuredClone(session.flags ?? {}),
    version: session.version,
    updatedAt: session.updatedAt,
  };
}

function summarizePublicEventForAi(event) {
  const output = structuredClone(event);
  for (const key of ["message", "reason"]) {
    if (typeof output[key] === "string") {
      output[key] = truncateTextForAi(output[key]);
    }
  }
  return output;
}

function truncateTextForAi(text) {
  if (text.length <= maxPublicEventTextCharacters) {
    return text;
  }
  return `${text.slice(0, maxPublicEventTextCharacters)} [truncated ${text.length} chars]`;
}

function normalizeMaxContextBytes(value) {
  if (!Number.isInteger(value) || value < 1024) {
    throw new Error("maxContextBytes must be an integer greater than or equal to 1024");
  }
  return value;
}

function serializedByteLength(value) {
  return Buffer.byteLength(JSON.stringify(value), "utf8");
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

function checkEventData(ruleResult) {
  return {
    characterId: ruleResult.characterId,
    requestType: ruleResult.requestType ?? ruleResult.type,
    skill: ruleResult.skill,
    ability: ruleResult.ability,
    dc: ruleResult.dc,
    selectedD20: ruleResult.selectedD20,
    total: ruleResult.total,
    success: ruleResult.success,
    reason: ruleResult.reason,
  };
}

function requireEnv(env, key) {
  if (typeof env[key] !== "string" || env[key].length === 0) {
    throw new Error(`${key} is required when AI provider is enabled`);
  }
  return env[key];
}

function parseProviderTimeout(value) {
  if (value === undefined || value === "") {
    return 30000;
  }
  const timeoutMs = Number.parseInt(value, 10);
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1) {
    throw new Error("TABLEMIND_AI_PROVIDER_TIMEOUT_MS must be a positive integer");
  }
  return timeoutMs;
}
