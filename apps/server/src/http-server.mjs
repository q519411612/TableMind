import { createServer } from "node:http";
import { createRoomEventStreamHub } from "./room-event-stream.mjs";

const statusByErrorCode = {
  bad_request: 400,
  unknown_command: 400,
  forbidden: 403,
  not_found: 404,
  room_not_found: 404,
  player_not_found: 404,
  review_item_not_found: 404,
  adventure_not_loaded: 404,
  invalid_room_phase: 409,
  invalid_combat_action: 409,
  review_item_not_approved: 409,
  payload_too_large: 413,
  unsupported_media_type: 415,
  internal_error: 500,
};

export function createHttpServer(input) {
  const handler = createHttpRequestHandler(input);
  const server = createServer(handler);

  return {
    server,
    async start(options = {}) {
      const host = options.host ?? "127.0.0.1";
      const port = options.port ?? 0;
      await new Promise((resolve) => {
        server.listen(port, host, resolve);
      });
      const address = server.address();
      return {
        baseUrl: `http://${address.address}:${address.port}`,
      };
    },
    async stop() {
      if (!server.listening) {
        return;
      }
      server.closeAllConnections?.();
      await new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
    },
  };
}

export function createHttpRequestHandler(input) {
  const dispatcher = input.dispatcher;
  if (!dispatcher) {
    throw new Error("dispatcher is required");
  }
  if (!dispatcher.roomService) {
    throw new Error("dispatcher.roomService is required");
  }
  const eventStreamHub = input.eventStreamHub ?? createRoomEventStreamHub();

  return async (request, response) => {
    try {
      if (isEventStreamRequest(request)) {
        await handleEventStream(dispatcher, eventStreamHub, request, response);
        return;
      }

      const result = await routeRequest(dispatcher, eventStreamHub, request);
      writeJson(response, statusForResult(result), result);
    } catch (error) {
      const code = statusByErrorCode[error.code] ? error.code : "internal_error";
      writeJson(response, statusByErrorCode[code], {
        ok: false,
        commandType: "http.request",
        error: {
          code,
          message: error.message,
        },
      });
    }
  };
}

async function routeRequest(dispatcher, eventStreamHub, request) {
  const url = new URL(request.url, "http://localhost");
  const path = url.pathname.split("/").filter(Boolean);

  if (request.method === "POST" && path.length === 1 && path[0] === "rooms") {
    const body = await readJsonBody(request);
    return await dispatcher.dispatchRoomCommand({
      type: "room.create",
      now: body.now,
      payload: body,
    });
  }

  if (
    request.method === "POST" &&
    path.length === 3 &&
    path[0] === "rooms" &&
    path[2] === "join"
  ) {
    const body = await readJsonBody(request);
    const result = await dispatcher.dispatchRoomCommand({
      type: "room.join",
      roomId: decodeURIComponent(path[1]),
      now: body.now,
      payload: body,
    });
    publishResultEvents(dispatcher, eventStreamHub, decodeURIComponent(path[1]), result);
    return result;
  }

  if (
    request.method === "POST" &&
    path.length === 3 &&
    path[0] === "rooms" &&
    path[2] === "actions"
  ) {
    const body = await readJsonBody(request);
    const roomId = decodeURIComponent(path[1]);
    const identityResult = resolveHttpViewer({
      dispatcher,
      request,
      url,
      body,
      roomId,
      commandType: body.type ?? "room.action",
    });
    if (!identityResult.ok) {
      return identityResult;
    }
    const result = await dispatcher.dispatchRoomCommand({
      ...body,
      roomId,
      actorPlayerId: identityResult.identity.playerId,
    });
    publishResultEvents(dispatcher, eventStreamHub, roomId, result);
    return result;
  }

  if (
    request.method === "GET" &&
    path.length === 3 &&
    path[0] === "rooms" &&
    path[2] === "snapshot"
  ) {
    const roomId = decodeURIComponent(path[1]);
    const identityResult = resolveHttpViewer({
      dispatcher,
      request,
      url,
      roomId,
      commandType: "room.snapshot",
    });
    if (!identityResult.ok) {
      return identityResult;
    }
    return await dispatcher.dispatchRoomCommand({
      type: "room.snapshot",
      roomId,
      viewerRole: identityResult.identity.viewerRole,
      viewerPlayerId: identityResult.identity.viewerPlayerId,
    });
  }

  if (
    request.method === "GET" &&
    path.length === 3 &&
    path[0] === "rooms" &&
    path[2] === "adventure-snapshot"
  ) {
    const roomId = decodeURIComponent(path[1]);
    const identityResult = resolveHttpViewer({
      dispatcher,
      request,
      url,
      roomId,
      commandType: "adventure.snapshot",
    });
    if (!identityResult.ok) {
      return identityResult;
    }
    return await dispatcher.dispatchRoomCommand({
      type: "adventure.snapshot",
      roomId,
      viewerRole: identityResult.identity.viewerRole,
      viewerPlayerId: identityResult.identity.viewerPlayerId,
    });
  }

  return {
    ok: false,
    commandType: "http.request",
    error: {
      code: "not_found",
      message: "Route not found",
    },
  };
}

async function handleEventStream(dispatcher, eventStreamHub, request, response) {
  const url = new URL(request.url, "http://localhost");
  const path = url.pathname.split("/").filter(Boolean);
  const roomId = decodeURIComponent(path[1]);
  const identityResult = resolveHttpViewer({
    dispatcher,
    request,
    url,
    roomId,
    commandType: "room.snapshot",
  });
  if (!identityResult.ok) {
    writeJson(response, statusForResult(identityResult), identityResult);
    return;
  }
  const identity = identityResult.identity;
  const snapshotResult = await dispatcher.dispatchRoomCommand({
    type: "room.snapshot",
    roomId,
    viewerRole: identity.viewerRole,
    viewerPlayerId: identity.viewerPlayerId,
  });

  if (!snapshotResult.ok) {
    writeJson(response, statusForResult(snapshotResult), snapshotResult);
    return;
  }

  response.writeHead(200, {
    "content-type": "text/event-stream",
    "cache-control": "no-store",
    connection: "keep-alive",
  });

  const unsubscribe = eventStreamHub.subscribe({
    roomId,
    viewerRole: identity.viewerRole,
    viewerPlayerId: identity.viewerPlayerId,
    send: (payload) => writeSse(response, payload.event, payload.data),
  });
  request.on("close", unsubscribe);

  writeSse(response, "room.snapshot", {
    snapshot: snapshotResult.snapshot,
  });
}

function publishResultEvents(dispatcher, eventStreamHub, roomId, result) {
  if (!result.ok || !Array.isArray(result.events) || result.events.length === 0) {
    return;
  }

  eventStreamHub.publish({
    roomId,
    events: result.events,
    snapshotForSubscriber(subscriber) {
      return dispatcher.roomService.getSnapshot({
        roomId,
        viewerRole: subscriber.viewerRole,
        viewerPlayerId: subscriber.viewerPlayerId,
      });
    },
  });
}

function resolveHttpViewer(input) {
  const sessionToken = extractSessionToken(input.request, input.url, input.body);
  if (!sessionToken) {
    return forbiddenResult(input.commandType);
  }

  try {
    const identity = input.dispatcher.roomService.resolveSessionIdentity({
      roomId: input.roomId,
      sessionToken,
    });
    if (!requestedViewerMatches(input.url, identity)) {
      return forbiddenResult(input.commandType);
    }
    return {
      ok: true,
      identity,
    };
  } catch (error) {
    return errorResult(input.commandType, error);
  }
}

function extractSessionToken(request, url, body = {}) {
  const authorization = request.headers.authorization;
  if (authorization?.startsWith("Bearer ")) {
    return authorization.slice("Bearer ".length);
  }

  const headerToken = request.headers["x-tablemind-session-token"];
  if (typeof headerToken === "string" && headerToken.length > 0) {
    return headerToken;
  }

  if (typeof body.sessionToken === "string" && body.sessionToken.length > 0) {
    return body.sessionToken;
  }

  return url.searchParams.get("sessionToken") ?? undefined;
}

function requestedViewerMatches(url, identity) {
  const requestedRole = url.searchParams.get("viewerRole");
  const requestedPlayerId = url.searchParams.get("viewerPlayerId");
  if (requestedRole && requestedRole !== identity.viewerRole) {
    return false;
  }
  if (requestedPlayerId && requestedPlayerId !== identity.viewerPlayerId) {
    return false;
  }
  return true;
}

function forbiddenResult(commandType) {
  return {
    ok: false,
    commandType,
    error: {
      code: "forbidden",
      message: "forbidden",
    },
  };
}

function errorResult(commandType, error) {
  const code = error.code ?? error.message;
  if (statusByErrorCode[code]) {
    return {
      ok: false,
      commandType,
      error: {
        code,
        message: code,
      },
    };
  }
  return {
    ok: false,
    commandType,
    error: {
      code: "internal_error",
      message: error.message,
    },
  };
}

function isEventStreamRequest(request) {
  const url = new URL(request.url, "http://localhost");
  const path = url.pathname.split("/").filter(Boolean);
  return (
    request.method === "GET" &&
    path.length === 3 &&
    path[0] === "rooms" &&
    path[2] === "events"
  );
}

async function readJsonBody(request) {
  const contentType = request.headers["content-type"];
  if (contentType && !isJsonContentType(contentType)) {
    throw httpRequestError("unsupported_media_type", "Unsupported media type");
  }

  const chunks = [];
  let total = 0;
  for await (const chunk of request) {
    total += chunk.length;
    if (total > 1_000_000) {
      throw httpRequestError("payload_too_large", "Request body too large");
    }
    chunks.push(chunk);
  }

  if (chunks.length === 0) {
    return {};
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw httpRequestError("bad_request", "Invalid JSON body");
  }
}

function isJsonContentType(contentType) {
  return contentType.split(";")[0].trim().toLowerCase() === "application/json";
}

function httpRequestError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function statusForResult(result) {
  if (result.ok) {
    return 200;
  }
  return statusByErrorCode[result.error.code] ?? 500;
}

function writeJson(response, statusCode, body) {
  response.writeHead(statusCode, {
    "content-type": "application/json",
  });
  response.end(JSON.stringify(body));
}

function writeSse(response, event, data) {
  response.write(`event: ${event}\n`);
  response.write(`data: ${JSON.stringify(data)}\n\n`);
}
