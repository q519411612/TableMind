# TableMind Demo Goal Runbook

## Goal

Advance the current TableMind repository from local MVP to a demo-ready browser
flow: one Host and two players can complete an original 5e-compatible short
adventure with room creation, joining, character creation, AI DM narration,
checks, combat, Host review/control, bilingual UI, localized built-in adventure
text, and recap.

## Do Not Treat This As A Rewrite

Workers must build on the current architecture. Prefer existing boundaries:

- `apps/server/src/room-service.mjs`
- `apps/server/src/room-actions.mjs`
- `apps/server/src/http-server.mjs`
- `apps/server/src/playtest-server.mjs`
- `apps/web/src/*`
- `packages/rules-engine`
- `packages/adventure-loader`
- `packages/session-recap`
- `packages/shared-test-fixtures`
- existing `specs/**` and `docs/**`

## Runtime

Use Node 20 or newer. In this local workspace, the bundled Node runtime is:

```bash
/Users/chenminghui/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node
```

The local shell used for the final acceptance pass has no `npm` executable in
`PATH`, so direct Node commands are the recorded verification method.

## Hard Constraints

1. The LLM is not the source of truth; AI output cannot directly modify state.
2. Dice, checks, attacks, damage, initiative, HP changes, and combat turns must
   come from deterministic rules/system code.
3. Player snapshot, HTTP response, SSE, UI, and recap must not include DM-only,
   Host-only, rejected AI output, private review payloads, or raw state patches.
4. Risky AI output, low-confidence output, reveal proposals, and state patches
   must enter Host review.
5. Default tests must not call live providers.
6. Do not commit provider keys, tokens, authorization headers, or real provider
   payloads.
7. Keep business logic in domain, room, command, and rules modules. UI and HTTP
   handlers remain thin adapters.
8. Demo scope is a short local one-shot, not a full VTT or production platform.

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
`docs/playtests/DEMO_ACCEPTANCE_REPORT_2026-06-08.md`:

```bash
node scripts/check-js.mjs
node scripts/run-tests.mjs packages apps tests
node scripts/run-tests.mjs tests/acceptance
TABLEMIND_AI_PROVIDER_ENABLED=false node scripts/smoke-playtest-flow.mjs
```

If the environment Node version does not satisfy Node 20+, record:

- current `node --version`;
- which commands could not run;
- how to switch to Node 20+.

## Review Checklist

Review output by checking:

- Required docs and specs were read before implementation.
- UI and HTTP remain thin adapters.
- No unnecessary framework or project rewrite was introduced.
- Tests were added or updated for changed behavior.
- Provider-disabled remains the default automated path.
- Player-visible output is covered by projection/no-leak tests.
- English and Simplified Chinese labels are complete and do not render
  `undefined`.
- Final reports include scope, changed files, tests, commands, risks, and
  deferred work.

## Stop And Split Signals

Pause and split work if a change tries to:

- introduce a large UI framework without need;
- change rules-engine behavior just to satisfy UI wiring;
- call a live provider in default tests;
- add production auth, durable storage, payments, or deployment;
- render player UI from Host snapshots;
- hard-translate authored text without explicit locale fields;
- remove or weaken no-DM-leak, spoiler guard, or Host review coverage.
