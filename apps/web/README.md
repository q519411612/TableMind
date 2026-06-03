# TableMind Web App

The web app hosts the MVP playtest player room and Host controls.

MVP-0.9 uses a zero-dependency static browser UI:

- `public/player.html` renders the player room shell.
- `public/host.html` renders the Host console shell.
- `src/api-client.mjs` calls the MVP-0.8 HTTP command contract.
- `src/event-stream-client.mjs` subscribes to the MVP-0.8 SSE event stream.
- `src/render-player.mjs` and `src/render-host.mjs` keep rendering separate from transport calls.

The UI intentionally avoids full VTT features such as maps, token movement, fog of war, dynamic lighting, and a full character builder.
