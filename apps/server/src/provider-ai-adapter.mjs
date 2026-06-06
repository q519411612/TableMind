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

      const controller = new AbortController();
      const timeout = timeoutFor(config, controller);
      let response;
      try {
        response = await config.fetchImpl(config.endpoint, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${config.apiKey}`,
          },
          signal: controller.signal,
          body: JSON.stringify({
            model: config.model,
            responseFormat: "tablemind.ai_dm_response.v1",
            context,
          }),
        });
      } catch (error) {
        if (controller.signal.aborted || error.name === "AbortError") {
          throw providerError("provider_timeout", "AI provider request timed out.");
        }
        throw providerError("provider_request_failed", "AI provider request failed.");
      } finally {
        if (timeout) {
          clearTimeout(timeout);
        }
      }

      if (!response.ok) {
        throw providerError("provider_request_failed", "AI provider request failed.");
      }

      try {
        const payload = await response.json();
        return validateAiDmResponse(payload);
      } catch {
        throw providerError(
          "invalid_provider_payload",
          "AI provider returned invalid structured payload.",
        );
      }
    },
  };
}

function timeoutFor(config, controller) {
  if (config.timeoutMs === undefined) {
    return undefined;
  }
  if (!Number.isInteger(config.timeoutMs) || config.timeoutMs < 1) {
    throw new Error("timeoutMs must be a positive integer");
  }
  return setTimeout(() => controller.abort(), config.timeoutMs);
}

function providerError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function requireString(object, key) {
  if (typeof object?.[key] !== "string" || object[key].length === 0) {
    throw new Error(`${key} is required`);
  }
}
