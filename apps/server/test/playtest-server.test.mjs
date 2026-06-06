import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { request } from "node:http";
import { test } from "node:test";
import {
  buildProviderPreflight,
  createPlaytestServer,
} from "../src/playtest-server.mjs";

test("playtest server serves static pages, browser modules, and API config", async () => {
  const app = await createPlaytestServer({
    env: {
      TABLEMIND_AI_PROVIDER_ENABLED: "false",
    },
    logger: quietLogger(),
  });
  const launch = await app.start({ port: 0 });
  try {
    const hostPage = await fetchText(`${launch.baseUrl}/host.html`);
    const hostModule = await fetchText(`${launch.baseUrl}/src/host-app.mjs`);
    const config = await fetchJson(`${launch.baseUrl}/playtest/config.json`);

    assert.equal(hostPage.status, 200);
    assert.match(hostPage.body, /<title>TableMind Host<\/title>/);
    assert.equal(hostModule.status, 200);
    assert.match(hostModule.body, /createHostCommandClient/);
    assert.equal(config.status, 200);
    assert.deepEqual(config.body, {
      apiBaseUrl: launch.baseUrl,
      fixtures: {
        adventureUrl: `${launch.baseUrl}/playtest/fixtures/demo-adventure.json`,
        compendiumUrl: `${launch.baseUrl}/playtest/fixtures/srd-compendium.json`,
      },
    });
  } finally {
    await app.stop();
  }
});

test("playtest fixture routes expose approved content without provider secrets", async () => {
  const testProviderApiKey = "<TEST_PROVIDER_API_KEY_DO_NOT_USE>";
  const app = await createPlaytestServer({
    env: {
      TABLEMIND_AI_PROVIDER_ENABLED: "true",
      TABLEMIND_AI_PROVIDER_ENDPOINT: "https://provider.invalid/v1/respond",
      TABLEMIND_AI_PROVIDER_API_KEY: testProviderApiKey,
      TABLEMIND_AI_PROVIDER_MODEL: "structured-dm",
      TABLEMIND_AI_PROVIDER_TIMEOUT_MS: "30000",
    },
    logger: quietLogger(),
  });
  const launch = await app.start({ port: 0 });
  try {
    const created = await postJson(`${launch.baseUrl}/rooms`, {
      hostDisplayName: "Host",
      rulesetId: "5e-srd-5.2.1",
      adventureModuleId: "adventure_lantern_beneath_hill",
      startingSceneId: "scene_village_square",
      now: "2026-06-02T14:00:00.000Z",
    });
    const joined = await postJson(`${launch.baseUrl}/rooms/${created.body.data.roomId}/join`, {
      displayName: "Ada",
      now: "2026-06-02T14:01:00.000Z",
    });
    const unauthorizedAdventure = await fetchJson(
      `${launch.baseUrl}/playtest/fixtures/demo-adventure.json`,
    );
    const playerAdventure = await fetchJson(
      `${launch.baseUrl}/playtest/fixtures/demo-adventure.json?roomId=${created.body.data.roomId}&sessionToken=${joined.body.data.playerSessionToken}`,
    );
    const adventure = await fetchJson(
      `${launch.baseUrl}/playtest/fixtures/demo-adventure.json?roomId=${created.body.data.roomId}&sessionToken=${created.body.data.hostSessionToken}`,
    );
    const compendium = await fetchJson(
      `${launch.baseUrl}/playtest/fixtures/srd-compendium.json`,
    );
    const combined = JSON.stringify({ adventure: adventure.body, compendium: compendium.body });

    assert.equal(unauthorizedAdventure.status, 403);
    assert.equal(playerAdventure.status, 403);
    assert.equal(adventure.status, 200);
    assert.equal(adventure.body.id, "adventure_lantern_beneath_hill");
    assert.equal(adventure.body.source.visibility, "public");
    assert.ok(adventure.body.truth.some((entry) => entry.visibility === "dm_only"));
    assert.equal(compendium.status, 200);
    assert.ok(compendium.body.entries.some((entry) => entry.id === "monster_hill_scavenger"));
    assert.equal(combined.includes(testProviderApiKey), false);
    assert.equal(combined.includes("TABLEMIND_AI_PROVIDER_API_KEY"), false);
  } finally {
    await app.stop();
  }
});

test("provider preflight validates enabled config and never prints API keys", () => {
  const testProviderApiKey = "<TEST_PROVIDER_API_KEY_DO_NOT_USE>";
  const preflight = buildProviderPreflight({
    TABLEMIND_AI_PROVIDER_ENABLED: "true",
    TABLEMIND_AI_PROVIDER_ENDPOINT: "https://provider.invalid/v1/respond",
    TABLEMIND_AI_PROVIDER_API_KEY: testProviderApiKey,
    TABLEMIND_AI_PROVIDER_MODEL: "structured-dm",
    TABLEMIND_AI_PROVIDER_TIMEOUT_MS: "15000",
  });

  assert.equal(preflight.enabled, true);
  assert.equal(preflight.config.endpoint, "https://provider.invalid/v1/respond");
  assert.equal(preflight.config.model, "structured-dm");
  assert.equal(preflight.config.timeoutMs, 15000);
  assert.equal(JSON.stringify(preflight).includes(testProviderApiKey), false);
  assert.equal(preflight.messages.join("\n").includes(testProviderApiKey), false);
  assert.match(preflight.messages.join("\n"), /Provider mode: enabled/);
  assert.match(preflight.messages.join("\n"), /API key: configured/);
});

test("playtest server launch logs never print provider API keys", async () => {
  const testProviderApiKey = "<TEST_PROVIDER_API_KEY_DO_NOT_USE>";
  const captured = captureLogger();
  const app = await createPlaytestServer({
    env: {
      TABLEMIND_AI_PROVIDER_ENABLED: "true",
      TABLEMIND_AI_PROVIDER_ENDPOINT: "https://provider.invalid/v1/respond",
      TABLEMIND_AI_PROVIDER_API_KEY: testProviderApiKey,
      TABLEMIND_AI_PROVIDER_MODEL: "structured-dm",
    },
    logger: captured.logger,
    fetchImpl: async () => {
      throw new Error("fetch should not run during preflight");
    },
  });
  const launch = await app.start({ port: 0 });
  try {
    const logs = captured.messages.join("\n");

    assert.match(logs, /Provider mode: enabled/);
    assert.match(logs, /API key: configured/);
    assert.match(logs, new RegExp(launch.hostUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.equal(logs.includes(testProviderApiKey), false);
    assert.equal(logs.includes("TABLEMIND_AI_PROVIDER_API_KEY"), false);
  } finally {
    await app.stop();
  }
});

test("provider preflight reports disabled mode and rejects invalid enabled config", () => {
  const disabled = buildProviderPreflight({
    TABLEMIND_AI_PROVIDER_ENABLED: "false",
  });

  assert.equal(disabled.enabled, false);
  assert.deepEqual(disabled.config, {
    enabled: false,
  });
  assert.match(disabled.messages.join("\n"), /mock\/disabled provider mode/);

  assert.throws(
    () =>
      buildProviderPreflight({
        TABLEMIND_AI_PROVIDER_ENABLED: "true",
        TABLEMIND_AI_PROVIDER_ENDPOINT: "https://provider.invalid/v1/respond",
        TABLEMIND_AI_PROVIDER_API_KEY: "<TEST_PROVIDER_API_KEY_DO_NOT_USE>",
        TABLEMIND_AI_PROVIDER_MODEL: "structured-dm",
        TABLEMIND_AI_PROVIDER_TIMEOUT_MS: "0",
      }),
    /TABLEMIND_AI_PROVIDER_TIMEOUT_MS must be a positive integer/,
  );
});

test("package playtest scripts target local launch scripts", async () => {
  const packageJson = JSON.parse(await readFile("package.json", "utf8"));

  assert.equal(packageJson.scripts.playtest, "node scripts/start-playtest.mjs");
  assert.equal(packageJson.scripts["smoke:playtest"], "node scripts/smoke-playtest-flow.mjs");
  await assert.doesNotReject(() => readFile("scripts/start-playtest.mjs", "utf8"));
  await assert.doesNotReject(() => readFile("scripts/smoke-playtest-flow.mjs", "utf8"));
});

function quietLogger() {
  return {
    log() {},
    error() {},
  };
}

function captureLogger() {
  const messages = [];
  return {
    messages,
    logger: {
      log(message) {
        messages.push(String(message));
      },
      error(message) {
        messages.push(String(message));
      },
    },
  };
}

async function fetchText(url) {
  const response = await requestLocal(url);
  return {
    status: response.statusCode,
    body: response.body,
  };
}

async function fetchJson(url) {
  const response = await requestLocal(url);
  return {
    status: response.statusCode,
    body: JSON.parse(response.body),
  };
}

async function postJson(url, body) {
  const response = await requestLocal(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
  return {
    status: response.statusCode,
    body: JSON.parse(response.body),
  };
}

async function requestLocal(url, options = {}) {
  return await new Promise((resolveRequest, reject) => {
    const clientRequest = request(new URL(url), options, (response) => {
      const chunks = [];
      response.on("data", (chunk) => chunks.push(chunk));
      response.on("end", () => {
        resolveRequest({
          statusCode: response.statusCode,
          body: Buffer.concat(chunks).toString("utf8"),
        });
      });
    });
    clientRequest.on("error", reject);
    if (options.body) {
      clientRequest.write(options.body);
    }
    clientRequest.end();
  });
}
