import { checkSpoilers } from "../../../packages/spoiler-guard/src/index.mjs";
import {
  resolveAbilityCheck,
  resolveSavingThrow,
  resolveSkillCheck,
} from "../../../packages/rules-engine/src/index.mjs";

const confidenceValues = ["low", "medium", "high"];

export function createMockAiAdapter(response) {
  return {
    async generateStructuredResponse() {
      return structuredClone(response);
    },
  };
}

export function validateAiDmResponse(response) {
  if (!response || typeof response !== "object") {
    throw new Error("AI DM response must be an object");
  }
  if ("diceResults" in response) {
    throw new Error("AI DM response must not include dice results");
  }
  requireString(response, "publicMessage");

  if (response.confidence && !confidenceValues.includes(response.confidence)) {
    throw new Error(`Invalid confidence: ${response.confidence}`);
  }

  validateOptionalArray(response.privateMessages, validatePrivateMessage);
  validateOptionalArray(response.ruleRequests, validateRuleRequest);
  validateOptionalArray(response.revealProposals, validateRevealProposal);
  validateOptionalArray(response.rulesCitations, validateRuleCitation);
  validateOptionalArray(response.dmWarnings, validateStringItem);

  if (response.statePatch && typeof response.statePatch !== "object") {
    throw new Error("statePatch must be an object");
  }

  return response;
}

export async function runAiDmTurn(input) {
  const response = await input.adapter.generateStructuredResponse(input.context);
  validateAiDmResponse(response);

  const spoilerCheck = checkSpoilers({
    publicMessage: response.publicMessage,
    hiddenEntities: input.context.hiddenEntities ?? [],
    unrevealedClues: input.context.unrevealedClues ?? [],
    dmOnlySecrets: input.context.dmOnlySecrets ?? [],
    viewerRole: "player",
  });
  const ruleResults = routeRuleRequests({
    context: input.context,
    ruleRequests: response.ruleRequests ?? [],
    randomSource: input.randomSource,
  });
  const reviewReason = reviewReasonFor(response, spoilerCheck);

  if (reviewReason) {
    return {
      status: "host_review_required",
      response,
      ruleResults,
      spoilerCheck,
      reviewItem: {
        id: "review_pending_ai_output",
        type: "ai_output",
        proposedPayload: response,
        reason: reviewReason,
        riskLevel: spoilerCheck.riskLevel,
        status: "pending",
      },
    };
  }

  return {
    status: "broadcast_ready",
    response,
    ruleResults,
    spoilerCheck,
  };
}

function routeRuleRequests(input) {
  return input.ruleRequests.map((request) => {
    if (request.type === "skill_check") {
      return resolveSkillCheck({
        character: rulesCharacter(input.context, request.characterId),
        skill: request.skill,
        dc: request.dc,
        advantage: request.advantage,
        reason: request.reason,
        randomSource: input.randomSource,
      });
    }

    if (request.type === "ability_check") {
      return resolveAbilityCheck({
        character: rulesCharacter(input.context, request.characterId),
        ability: request.ability,
        dc: request.dc,
        advantage: request.advantage,
        reason: request.reason,
        randomSource: input.randomSource,
      });
    }

    if (request.type === "saving_throw") {
      return resolveSavingThrow({
        character: rulesCharacter(input.context, request.characterId),
        ability: request.ability,
        dc: request.dc,
        advantage: request.advantage,
        reason: request.reason,
        randomSource: input.randomSource,
      });
    }

    throw new Error(`Unsupported rule request type: ${request.type}`);
  });
}

function rulesCharacter(context, characterId) {
  const character = context.session?.characters?.[characterId];
  if (!character) {
    throw new Error(`character not found: ${characterId}`);
  }

  return {
    ...character,
    proficientSkills:
      character.proficientSkills ?? character.skillProficiencies ?? [],
    proficientSaves:
      character.proficientSaves ?? character.savingThrowProficiencies ?? [],
  };
}

function reviewReasonFor(response, spoilerCheck) {
  if (!spoilerCheck.allowed) {
    return "Spoiler guard blocked public AI output.";
  }
  if (response.confidence === "low") {
    return "AI confidence is low.";
  }
  if (response.statePatch) {
    return "AI proposed a state patch.";
  }
  if ((response.revealProposals ?? []).length > 0) {
    return "AI proposed a reveal.";
  }
  return undefined;
}

function validatePrivateMessage(message) {
  requireString(message, "playerId");
  requireString(message, "message");
}

function validateRuleRequest(request) {
  requireString(request, "type");
  requireString(request, "characterId");
  requireString(request, "reason");
  if (!["normal", "advantage", "disadvantage"].includes(request.advantage)) {
    throw new Error(`Invalid advantage: ${request.advantage}`);
  }
  if (!Number.isInteger(request.dc) || request.dc < 0) {
    throw new Error(`Invalid DC: ${request.dc}`);
  }
  if (request.type === "skill_check") {
    requireString(request, "skill");
    return;
  }
  if (request.type === "ability_check" || request.type === "saving_throw") {
    requireString(request, "ability");
    return;
  }
  if (request.type === "attack") {
    requireString(request, "attackerId");
    requireString(request, "targetId");
    requireString(request, "attackId");
    return;
  }
  throw new Error(`Unsupported rule request type: ${request.type}`);
}

function validateRevealProposal(proposal) {
  if (!["clue", "secret", "scene"].includes(proposal.entityType)) {
    throw new Error(`Invalid reveal entityType: ${proposal.entityType}`);
  }
  requireString(proposal, "entityId");
  requireString(proposal, "reason");
}

function validateRuleCitation(citation) {
  requireString(citation, "entryId");
  requireString(citation, "reason");
}

function validateStringItem(value) {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error("Expected non-empty string");
  }
}

function validateOptionalArray(value, validator) {
  if (value === undefined) {
    return;
  }
  if (!Array.isArray(value)) {
    throw new Error("Expected array");
  }
  for (const item of value) {
    validator(item);
  }
}

function requireString(object, key) {
  if (typeof object?.[key] !== "string" || object[key].length === 0) {
    throw new Error(`${key} is required`);
  }
}
