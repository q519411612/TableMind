export function createRoomEventStreamUrl(input) {
  const baseUrl = normalizeBaseUrl(input.baseUrl ?? "");
  const search = new URLSearchParams();
  if (input.sessionToken) {
    search.set("sessionToken", input.sessionToken);
  }
  if (input.viewerRole) {
    search.set("viewerRole", input.viewerRole);
  }
  if (input.viewerPlayerId) {
    search.set("viewerPlayerId", input.viewerPlayerId);
  }

  return `${baseUrl}/rooms/${encodeURIComponent(input.roomId)}/events?${search.toString()}`;
}

export function connectRoomEventStream(input) {
  const EventSourceCtor = input.EventSourceCtor ?? globalThis.EventSource;
  if (typeof EventSourceCtor !== "function") {
    throw new Error("EventSource is required");
  }

  const source = new EventSourceCtor(createRoomEventStreamUrl(input));
  source.addEventListener("room.snapshot", (event) => {
    input.onSnapshot?.(JSON.parse(event.data));
  });
  source.addEventListener("room.broadcast", (event) => {
    input.onBroadcast?.(JSON.parse(event.data));
  });
  source.onerror = (event) => {
    input.onError?.(event);
  };

  return source;
}

function normalizeBaseUrl(baseUrl) {
  return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
}
