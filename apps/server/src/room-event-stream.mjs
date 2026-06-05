export function createRoomEventStreamHub() {
  const subscribersByRoom = new Map();
  let nextSubscriberNumber = 1;

  function subscribe(input) {
    if (!input.roomId) {
      throw new Error("roomId is required");
    }
    if (typeof input.send !== "function") {
      throw new Error("send is required");
    }

    const subscriber = {
      id: `subscriber_${String(nextSubscriberNumber).padStart(4, "0")}`,
      viewerRole: input.viewerRole,
      viewerPlayerId: input.viewerPlayerId,
      send: input.send,
    };
    nextSubscriberNumber += 1;

    const roomSubscribers = subscribersByRoom.get(input.roomId) ?? new Map();
    roomSubscribers.set(subscriber.id, subscriber);
    subscribersByRoom.set(input.roomId, roomSubscribers);

    return () => {
      const current = subscribersByRoom.get(input.roomId);
      if (!current) {
        return;
      }
      current.delete(subscriber.id);
      if (current.size === 0) {
        subscribersByRoom.delete(input.roomId);
      }
    };
  }

  function publish(input) {
    const roomSubscribers = subscribersByRoom.get(input.roomId);
    if (!roomSubscribers) {
      return 0;
    }

    let delivered = 0;
    if (Array.isArray(input.events)) {
      for (const subscriber of roomSubscribers.values()) {
        for (const event of input.events) {
          const subscriberEvent = eventForSubscriber(subscriber, event);
          const broadcast = {
            snapshot: input.snapshotForSubscriber(subscriber),
          };
          if (subscriberEvent) {
            broadcast.event = subscriberEvent;
          }
          subscriber.send({
            event: "room.broadcast",
            data: {
              broadcast,
            },
          });
          delivered += 1;
        }
      }
      return delivered;
    }

    if (!Array.isArray(input.broadcasts)) {
      return 0;
    }

    for (const subscriber of roomSubscribers.values()) {
      for (const broadcast of input.broadcasts) {
        if (canReceiveBroadcast(subscriber, broadcast)) {
          subscriber.send({
            event: "room.broadcast",
            data: { broadcast },
          });
          delivered += 1;
        }
      }
    }

    return delivered;
  }

  return {
    subscribe,
    publish,
  };
}

const playerHiddenEventTypes = new Set([
  "host.review.created",
  "host.review.updated",
  "state.patch",
  "host.override",
]);

function eventForSubscriber(subscriber, event) {
  if (subscriber.viewerRole === "host") {
    return structuredClone(event);
  }

  if (playerHiddenEventTypes.has(event.type) || event.visibility === "dm_only") {
    return undefined;
  }

  return structuredClone(event);
}

function canReceiveBroadcast(subscriber, broadcast) {
  if (subscriber.viewerRole === "host") {
    return true;
  }

  return broadcast.playerId === subscriber.viewerPlayerId;
}
