import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, normalize, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadAdventureFixture } from "../../../packages/adventure-loader/src/index.mjs";
import { loadCompendiumFixture } from "../../../packages/compendium/src/index.mjs";
import { createProviderAiAdapter } from "./provider-ai-adapter.mjs";
import { createHttpRequestHandler } from "./http-server.mjs";
import { loadAiProviderConfig } from "./ai-room-runner.mjs";
import { createRoomActionDispatcher } from "./room-actions.mjs";
import { createRoomService } from "./room-service.mjs";

const rootDir = fileURLToPath(new URL("../../..", import.meta.url));
const defaultPaths = {
  publicDir: resolve(rootDir, "apps/web/public"),
  srcDir: resolve(rootDir, "apps/web/src"),
  adventureFixture: resolve(
    rootDir,
    "packages/shared-test-fixtures/adventures/the-lantern-beneath-the-hill.md",
  ),
  compendiumFixture: resolve(
    rootDir,
    "packages/shared-test-fixtures/compendium/srd-mini.json",
  ),
};

const mimeTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".mjs", "text/javascript; charset=utf-8"],
]);

export async function createPlaytestServer(options = {}) {
  const env = options.env ?? process.env;
  const logger = options.logger ?? console;
  const paths = {
    ...defaultPaths,
    ...(options.paths ?? {}),
  };
  const providerPreflight = buildProviderPreflight(env);
  const providerConfig = loadAiProviderConfig(env);
  const roomService = createRoomService({
    baseInviteUrl: "/player.html?roomId={roomId}",
  });
  const aiAdapter = providerConfig.enabled
    ? createProviderAiAdapter({
        ...providerConfig,
        fetchImpl: options.fetchImpl ?? globalThis.fetch,
      })
    : createLocalPlaytestAiAdapter();
  const dispatcher = createRoomActionDispatcher({
    roomService,
    aiAdapter,
    providerConfig: providerConfig.enabled ? providerConfig : undefined,
  });
  const apiHandler = createHttpRequestHandler({ dispatcher });
  const fixtures = {
    adventure: await loadAdventureFixture(paths.adventureFixture),
    compendiumEntries: await loadCompendiumFixture(paths.compendiumFixture),
  };

  const server = createServer(async (request, response) => {
    try {
      if (isPlaytestConfigRequest(request)) {
        writeJson(response, 200, buildPlaytestConfig(request));
        return;
      }
      if (isAdventureFixtureRequest(request)) {
        if (!isHostFixtureRequest(request, roomService)) {
          writeJson(response, 403, {
            ok: false,
            error: {
              code: "forbidden",
              message: "forbidden",
            },
          });
          return;
        }
        writeJson(response, 200, fixtures.adventure);
        return;
      }
      if (isCompendiumFixtureRequest(request)) {
        writeJson(response, 200, {
          entries: fixtures.compendiumEntries,
        });
        return;
      }
      if (await serveStaticAsset({ request, response, paths })) {
        return;
      }
      await apiHandler(request, response);
    } catch (error) {
      writeJson(response, 500, {
        ok: false,
        error: {
          code: "internal_error",
          message: error.message,
        },
      });
    }
  });

  return {
    server,
    providerPreflight,
    async start(startOptions = {}) {
      const host = startOptions.host ?? env.TABLEMIND_PLAYTEST_HOST ?? "127.0.0.1";
      const port = Number.parseInt(
        String(startOptions.port ?? env.TABLEMIND_PLAYTEST_PORT ?? "3000"),
        10,
      );
      if (!Number.isInteger(port) || port < 0) {
        throw new Error("TABLEMIND_PLAYTEST_PORT must be a non-negative integer");
      }

      await new Promise((resolveListen) => {
        server.listen(port, host, resolveListen);
      });
      const address = server.address();
      const baseUrl = `http://${address.address}:${address.port}`;
      const launch = {
        baseUrl,
        apiBaseUrl: baseUrl,
        hostUrl: `${baseUrl}/host.html`,
        playerUrl: `${baseUrl}/player.html`,
      };
      logLaunch({ logger, launch, providerPreflight });
      return launch;
    },
    async stop() {
      if (!server.listening) {
        return;
      }
      server.closeAllConnections?.();
      await new Promise((resolveClose, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolveClose();
        });
      });
    },
  };
}

function createLocalPlaytestAiAdapter() {
  return {
    async generateStructuredResponse(context) {
      return {
        publicMessage: localPlaytestMessage(context.locale),
        ruleRequests: localPlaytestRuleRequests(context),
        confidence: "high",
      };
    },
  };
}

function localPlaytestRuleRequests(context) {
  const characters = context.session?.characters ?? {};
  const characterId = Object.keys(characters).sort()[0];
  if (!characterId) {
    return [];
  }

  return [
    {
      type: "skill_check",
      characterId,
      skill: "investigation",
      dc: 15,
      advantage: "normal",
      reason: localPlaytestCheckReason(context.locale),
    },
  ];
}

function localPlaytestMessage(locale) {
  if (locale === "zh-CN") {
    return "冰冷煤灰在破裂灯框上蜷起。";
  }
  return "Cold soot curls around the cracked lantern frame.";
}

function localPlaytestCheckReason(locale) {
  if (locale === "zh-CN") {
    return "检查灯上的煤灰。";
  }
  return "Inspect the lantern soot.";
}

export function buildProviderPreflight(env = {}) {
  const enabled = env.TABLEMIND_AI_PROVIDER_ENABLED === "true";
  if (!enabled) {
    return {
      enabled: false,
      config: {
        enabled: false,
      },
      messages: ["Provider mode: mock/disabled provider mode is active."],
    };
  }

  const endpoint = requireEnv(env, "TABLEMIND_AI_PROVIDER_ENDPOINT");
  requireEnv(env, "TABLEMIND_AI_PROVIDER_API_KEY");
  const model = requireEnv(env, "TABLEMIND_AI_PROVIDER_MODEL");
  const timeoutMs = parseTimeout(env.TABLEMIND_AI_PROVIDER_TIMEOUT_MS);

  return {
    enabled: true,
    config: {
      enabled: true,
      endpoint,
      model,
      timeoutMs,
      apiKeyStatus: "configured",
    },
    messages: [
      "Provider mode: enabled.",
      `Provider endpoint: ${endpoint}`,
      `Provider model: ${model}`,
      `Provider timeout: ${timeoutMs}ms`,
      "API key: configured.",
      "Startup preflight made no provider network calls.",
    ],
  };
}

function logLaunch(input) {
  for (const message of input.providerPreflight.messages) {
    input.logger.log(message);
  }
  input.logger.log(`Host URL: ${input.launch.hostUrl}`);
  input.logger.log(`Player URL: ${input.launch.playerUrl}`);
  input.logger.log(`API base URL: ${input.launch.apiBaseUrl}`);
}

function buildPlaytestConfig(request) {
  const baseUrl = requestBaseUrl(request);
  return {
    apiBaseUrl: baseUrl,
    fixtures: {
      adventureUrl: `${baseUrl}/playtest/fixtures/demo-adventure.json`,
      compendiumUrl: `${baseUrl}/playtest/fixtures/srd-compendium.json`,
    },
  };
}

async function serveStaticAsset(input) {
  const url = new URL(input.request.url, "http://localhost");
  const pathname = url.pathname === "/" ? "/host.html" : url.pathname;
  const filePath = staticFilePath({
    pathname,
    publicDir: input.paths.publicDir,
    srcDir: input.paths.srcDir,
  });
  if (!filePath) {
    return false;
  }

  try {
    const body = await readFile(filePath);
    input.response.writeHead(200, {
      "content-type": mimeTypes.get(extname(filePath)) ?? "application/octet-stream",
      "cache-control": "no-store",
    });
    input.response.end(body);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") {
      return false;
    }
    throw error;
  }
}

function staticFilePath(input) {
  if (input.pathname.startsWith("/src/")) {
    return safeResolve(input.srcDir, input.pathname.slice("/src/".length));
  }
  if (["/host.html", "/index.html", "/player.html", "/styles.css"].includes(input.pathname)) {
    return safeResolve(input.publicDir, input.pathname.slice(1));
  }
  return undefined;
}

function safeResolve(baseDir, relativePath) {
  const candidate = resolve(baseDir, normalize(relativePath));
  const distance = relative(baseDir, candidate);
  if (distance.startsWith("..") || distance === "..") {
    return undefined;
  }
  return candidate;
}

function parseTimeout(value) {
  if (value === undefined || value === "") {
    return 30000;
  }
  const timeoutMs = Number.parseInt(value, 10);
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1) {
    throw new Error("TABLEMIND_AI_PROVIDER_TIMEOUT_MS must be a positive integer");
  }
  return timeoutMs;
}

function requireEnv(env, key) {
  if (typeof env[key] !== "string" || env[key].length === 0) {
    throw new Error(`${key} is required when AI provider is enabled`);
  }
  return env[key];
}

function requestBaseUrl(request) {
  const host = request.headers.host;
  if (typeof host !== "string" || host.length === 0) {
    throw new Error("request host is required");
  }
  return `http://${host}`;
}

function isPlaytestConfigRequest(request) {
  return request.method === "GET" && new URL(request.url, "http://localhost").pathname === "/playtest/config.json";
}

function isAdventureFixtureRequest(request) {
  return request.method === "GET" && new URL(request.url, "http://localhost").pathname === "/playtest/fixtures/demo-adventure.json";
}

function isCompendiumFixtureRequest(request) {
  return request.method === "GET" && new URL(request.url, "http://localhost").pathname === "/playtest/fixtures/srd-compendium.json";
}

function isHostFixtureRequest(request, roomService) {
  const url = new URL(request.url, "http://localhost");
  const roomId = url.searchParams.get("roomId");
  const sessionToken = url.searchParams.get("sessionToken");
  if (!roomId || !sessionToken) {
    return false;
  }

  try {
    const identity = roomService.resolveSessionIdentity({
      roomId,
      sessionToken,
    });
    return identity.viewerRole === "host";
  } catch {
    return false;
  }
}

function writeJson(response, statusCode, body) {
  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  response.end(JSON.stringify(body));
}
