#!/usr/bin/env node
import { createPlaytestServer } from "../apps/server/src/playtest-server.mjs";

const app = await createPlaytestServer();
let stopping = false;

await app.start();

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, async () => {
    if (stopping) {
      return;
    }
    stopping = true;
    await app.stop();
    process.exit(0);
  });
}
