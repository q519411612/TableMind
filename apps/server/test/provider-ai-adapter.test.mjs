import assert from "node:assert/strict";
import { test } from "node:test";
import { createProviderAiAdapter } from "../src/provider-ai-adapter.mjs";

test("provider adapter is disabled unless the feature flag is enabled", async () => {
  const adapter = createProviderAiAdapter({
    enabled: false,
    endpoint: "https://provider.invalid/v1/respond",
    apiKey: "secret",
    model: "structured-dm",
    fetchImpl: async () => {
      throw new Error("fetch should not run");
    },
  });

  await assert.rejects(
    () => adapter.generateStructuredResponse({ currentScene: { title: "Tower" } }),
    /disabled/,
  );
});

test("provider adapter requests structured output and validates the response", async () => {
  const calls = [];
  const adapter = createProviderAiAdapter({
    enabled: true,
    endpoint: "https://provider.invalid/v1/respond",
    apiKey: "secret",
    model: "structured-dm",
    fetchImpl: async (url, init) => {
      calls.push({ url, init });
      return {
        ok: true,
        async json() {
          return {
            publicMessage: "The lantern frame trembles in the wind.",
            ruleRequests: [],
            confidence: "high",
          };
        },
      };
    },
  });

  const response = await adapter.generateStructuredResponse({
    currentScene: { id: "scene_lantern_tower", title: "Lantern Tower" },
    recentEvents: [],
  });

  assert.equal(response.publicMessage, "The lantern frame trembles in the wind.");
  assert.equal(calls[0].url, "https://provider.invalid/v1/respond");
  assert.equal(calls[0].init.headers.authorization, "Bearer secret");
  assert.equal(JSON.parse(calls[0].init.body).model, "structured-dm");
});
