# TableMind Demo Goal Runbook

## Runtime

Use Node 20 or newer. In this local workspace, the bundled Node runtime is:

```bash
/Users/chenminghui/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node
```

The local shell used for the final acceptance pass has no `npm` executable in
`PATH`, so direct Node commands are the recorded verification method.

## Start The Local Demo

When npm is available:

```bash
npm run playtest
```

Without npm:

```bash
node scripts/start-playtest.mjs
```

Open:

- Host UI: `http://127.0.0.1:<port>/host.html`
- Player UI: `http://127.0.0.1:<port>/player.html`

The Host-created invite link includes `roomId`:

```txt
http://127.0.0.1:<port>/player.html?roomId=room_0001
```

## Host Flow

- Create room.
- Load the demo adventure.
- Copy/open the invite link.
- Wait for two players and demo-ready characters.
- Start session.
- Run AI for safe mock narration.
- Inspect DM-only scene truth in Host UI.
- Use Host review controls if review is triggered.
- Reveal a clue and/or change scene.
- Start combat.
- Patch HP/condition only through Host controls when needed.
- End combat.
- Complete session and read Host recap.

## Player Flow

- Open invite link.
- Enter nickname and join.
- Create demo-ready character.
- Read current scene and public feed.
- Watch dice log and check outcome.
- Use projected combat attack control on the player's active turn.
- Read player recap.
- Switch `?lang=en` or `?lang=zh-CN` to confirm fixed UI labels.

## Safety Checks

- Player surfaces must not include `dm_only`, Host-only review events, rejected
  AI output, private review payloads, or raw state patches.
- AI output must not mutate state directly.
- Dice, checks, attacks, damage, initiative, HP, and combat turns must come from
  deterministic system code.
- Default automated verification must not make live provider calls.

## Verification

When npm is available:

```bash
npm run check
npm test
npm run acceptance
npm run build
TABLEMIND_AI_PROVIDER_ENABLED=false npm run smoke:playtest
```

Without npm, use the direct Node equivalents recorded in
`docs/playtests/DEMO_ACCEPTANCE_REPORT_2026-06-08.md`.
