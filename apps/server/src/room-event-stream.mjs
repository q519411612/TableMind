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
    if (!roomSubscribers || !Array.isArray(input.broadcasts)) {
      return 0;
    }

    let delivered = 0;
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

function canReceiveBroadcast(subscriber, broadcast) {
  if (subscriber.viewerRole === "host") {
    return true;
  }

  return broadcast.playerId === subscriber.viewerPlayerId;
}
