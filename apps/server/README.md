# TableMind Server App

The server app owns the local in-memory orchestration used by the MVP engine:

- Host-owned rooms, invite URLs, player joins, leave, and reconnect flows;
- character validation and session start;
- committed room events and role-aware snapshots;
- adventure runtime controls;
- mock AI DM routing, spoiler filtering, Host review queues, and rules-engine handoff;
- encounter combat controls and session completion summaries.

Production websocket/API transport, authentication, and durable persistence remain outside the local MVP engine.
