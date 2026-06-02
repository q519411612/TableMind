import { validateAiDmResponse } from "./ai-dm-orchestrator.mjs";

export function createProviderAiAdapter(config) {
  return {
    async generateStructuredResponse(context) {
      if (!config.enabled) {
        throw new Error("provider AI adapter is disabled");
      }
      requireString(config, "endpoint");
      requireString(config, "apiKey");
      requireString(config, "model");
      if (typeof config.fetchImpl !== "function") {
        throw new Error("fetchImpl is required");
      }

      const response = await config.fetchImpl(config.endpoint, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          responseFormat: "tablemind.ai_dm_response.v1",
          context,
        }),
      });

      if (!response.ok) {
        throw new Error("provider AI request failed");
      }

      const payload = await response.json();
      return validateAiDmResponse(payload);
    },
  };
}

function requireString(object, key) {
  if (typeof object?.[key] !== "string" || object[key].length === 0) {
    throw new Error(`${key} is required`);
  }
}
