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

test("provider adapter enforces timeout and redacts provider details", async () => {
  const adapter = createProviderAiAdapter({
    enabled: true,
    endpoint: "https://provider.invalid/v1/respond",
    apiKey: "secret-api-key",
    model: "structured-dm",
    timeoutMs: 1,
    fetchImpl: async (_url, init) =>
      new Promise((_resolve, reject) => {
        assert.ok(init.signal);
        init.signal.addEventListener("abort", () => {
          const error = new Error(
            "aborted https://provider.invalid/v1/respond with secret-api-key",
          );
          error.name = "AbortError";
          reject(error);
        });
      }),
  });

  await assert.rejects(
    () => adapter.generateStructuredResponse({ currentScene: { title: "Tower" } }),
    (error) => {
      assert.equal(error.code, "provider_timeout");
      assert.equal(error.message.includes("provider.invalid"), false);
      assert.equal(error.message.includes("secret-api-key"), false);
      return true;
    },
  );
});

test("provider adapter maps request failure to controlled error", async () => {
  const adapter = createProviderAiAdapter({
    enabled: true,
    endpoint: "https://provider.invalid/v1/respond",
    apiKey: "secret-api-key",
    model: "structured-dm",
    fetchImpl: async () => {
      throw new Error("request failed for secret-api-key at provider.invalid");
    },
  });

  await assert.rejects(
    () => adapter.generateStructuredResponse({ currentScene: { title: "Tower" } }),
    (error) => {
      assert.equal(error.code, "provider_request_failed");
      assert.equal(error.message.includes("secret-api-key"), false);
      assert.equal(error.message.includes("provider.invalid"), false);
      return true;
    },
  );
});

test("provider adapter rejects invalid structured payload with controlled error", async () => {
  const adapter = createProviderAiAdapter({
    enabled: true,
    endpoint: "https://provider.invalid/v1/respond",
    apiKey: "secret-api-key",
    model: "structured-dm",
    fetchImpl: async () => ({
      ok: true,
      async json() {
        return {
          confidence: "high",
        };
      },
    }),
  });

  await assert.rejects(
    () => adapter.generateStructuredResponse({ currentScene: { title: "Tower" } }),
    (error) => {
      assert.equal(error.code, "invalid_provider_payload");
      assert.equal(error.message.includes("publicMessage"), false);
      assert.equal(error.message.includes("secret-api-key"), false);
      return true;
    },
  );
});

test("provider adapter rejects invalid JSON payload with controlled error", async () => {
  const adapter = createProviderAiAdapter({
    enabled: true,
    endpoint: "https://provider.invalid/v1/respond",
    apiKey: "secret-api-key",
    model: "structured-dm",
    fetchImpl: async () => ({
      ok: true,
      async json() {
        throw new Error("invalid JSON near secret-api-key");
      },
    }),
  });

  await assert.rejects(
    () => adapter.generateStructuredResponse({ currentScene: { title: "Tower" } }),
    (error) => {
      assert.equal(error.code, "invalid_provider_payload");
      assert.equal(error.message.includes("JSON"), false);
      assert.equal(error.message.includes("secret-api-key"), false);
      return true;
    },
  );
});
