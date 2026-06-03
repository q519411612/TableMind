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
  review_item_not_approved: 409,
  internal_error: 500,
};

export function createHttpServer(input) {
  const dispatcher = input.dispatcher;
  if (!dispatcher) {
    throw new Error("dispatcher is required");
  }
  const eventStreamHub = input.eventStreamHub ?? createRoomEventStreamHub();

  const server = createServer(async (request, response) => {
    try {
      if (isEventStreamRequest(request)) {
        await handleEventStream(dispatcher, eventStreamHub, request, response);
        return;
      }

      const result = await routeRequest(dispatcher, eventStreamHub, request);
      writeJson(response, statusForResult(result), result);
    } catch (error) {
      writeJson(response, 500, {
        ok: false,
        commandType: "http.request",
        error: {
          code: "internal_error",
          message: error.message,
        },
      });
    }
  });

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

async function routeRequest(dispatcher, eventStreamHub, request) {
  const url = new URL(request.url, "http://localhost");
  const path = url.pathname.split("/").filter(Boolean);

  if (request.method === "POST" && path.length === 1 && path[0] === "rooms") {
    const body = await readJsonBody(request);
    return dispatcher.dispatchRoomCommand({
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
    return dispatcher.dispatchRoomCommand({
      type: "room.join",
      roomId: decodeURIComponent(path[1]),
      now: body.now,
      payload: body,
    });
  }

  if (
    request.method === "POST" &&
    path.length === 3 &&
    path[0] === "rooms" &&
    path[2] === "actions"
  ) {
    const body = await readJsonBody(request);
    const roomId = decodeURIComponent(path[1]);
    const result = dispatcher.dispatchRoomCommand({
      ...body,
      roomId,
    });
    if (result.ok) {
      eventStreamHub.publish({
        roomId,
        broadcasts: result.broadcasts,
      });
    }
    return result;
  }

  if (
    request.method === "GET" &&
    path.length === 3 &&
    path[0] === "rooms" &&
    path[2] === "snapshot"
  ) {
    return dispatcher.dispatchRoomCommand({
      type: "room.snapshot",
      roomId: decodeURIComponent(path[1]),
      viewerRole: url.searchParams.get("viewerRole"),
      viewerPlayerId: url.searchParams.get("viewerPlayerId") ?? undefined,
    });
  }

  if (
    request.method === "GET" &&
    path.length === 3 &&
    path[0] === "rooms" &&
    path[2] === "adventure-snapshot"
  ) {
    return dispatcher.dispatchRoomCommand({
      type: "adventure.snapshot",
      roomId: decodeURIComponent(path[1]),
      viewerRole: url.searchParams.get("viewerRole"),
      viewerPlayerId: url.searchParams.get("viewerPlayerId") ?? undefined,
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
  const viewerRole = url.searchParams.get("viewerRole");
  const viewerPlayerId = url.searchParams.get("viewerPlayerId") ?? undefined;
  const snapshotResult = dispatcher.dispatchRoomCommand({
    type: "room.snapshot",
    roomId,
    viewerRole,
    viewerPlayerId,
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
    viewerRole,
    viewerPlayerId,
    send: (payload) => writeSse(response, payload.event, payload.data),
  });
  request.on("close", unsubscribe);

  writeSse(response, "room.snapshot", {
    snapshot: snapshotResult.snapshot,
  });
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
  const chunks = [];
  let total = 0;
  for await (const chunk of request) {
    total += chunk.length;
    if (total > 1_000_000) {
      throw new Error("Request body too large");
    }
    chunks.push(chunk);
  }

  if (chunks.length === 0) {
    return {};
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    return {};
  }
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
