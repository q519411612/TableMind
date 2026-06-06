# TableMind QA Report - 2026-06-06

## Scope

QA/testing pass for the current TableMind worktree after the supervised DeepSeek dry-run, temporary structured-response bridge, local playtest launch harness, and bilingual Host/Player UI label work. This report does not claim production readiness.

## Commit Tested

- Commit: `50f1ab8de483c60580087ff8b7e05da180adc913`
- Worktree note: QA added focused renderer assertions in `apps/web/test/ui-render.test.mjs` and this report.
- Pre-existing untracked files observed before QA edits: `AGENTS.md`, `add-open-source-integration-strategy.patch`, `spec-open-source-integration-guardrails.patch`.

## Environment

- Default `node --version`: `v16.20.2` (below project requirement)
- Test runtime used: `/Users/chenminghui/.nvm/versions/node/v24.14.0/bin/node` -> `v24.14.0`
- Default `npm`: unavailable on the shell path
- npm used with Node 24 path injected: `npm 11.9.0`
- Provider mode for local playtest smoke: `TABLEMIND_AI_PROVIDER_ENABLED=false`

## Automated Verification

| Area | Result | Evidence |
| --- | --- | --- |
| Syntax check | PASS | `node scripts/check-js.mjs` -> `Checked 57 JavaScript files.` |
| Full test sweep | PASS | `node scripts/run-tests.mjs packages apps tests` -> `128 pass, 0 fail` |
| Acceptance tests | PASS | `node scripts/run-tests.mjs tests/acceptance` -> `11 pass, 0 fail` |
| Diff whitespace | PASS | `git diff --check` -> no output |
| npm check | PASS | `npm run check` -> `Checked 57 JavaScript files.` |
| npm test | PASS | `npm test` -> `128 pass, 0 fail` |
| npm acceptance | PASS | `npm run acceptance` -> `11 pass, 0 fail` |
| npm build | PASS | `npm run build` -> syntax check, `128 pass`, acceptance `11 pass` |

## Playtest Server Smoke

Started with:

```bash
env TABLEMIND_AI_PROVIDER_ENABLED=false TABLEMIND_PLAYTEST_PORT=0 /Users/chenminghui/.nvm/versions/node/v24.14.0/bin/node scripts/start-playtest.mjs
```

Server selected `http://127.0.0.1:55477`.

| Check | Result | Evidence |
| --- | --- | --- |
| Server starts | PASS | Startup printed Host, Player, and API base URLs |
| Provider-disabled mode logged | PASS | Startup printed `Provider mode: mock/disabled provider mode is active.` |
| Startup log secret exposure | PASS | No API key, bearer token, or provider payload printed |
| Host URL loads | PASS | Browser title `TableMind Host`; HTTP `200 text/html` |
| Player URL loads | PASS | Browser title `TableMind Player`; HTTP `200 text/html` |
| `/playtest/config.json` loads | PASS | HTTP `200 application/json` |
| `/playtest/fixtures/srd-compendium.json` loads | PASS | HTTP `200 application/json` |
| `/playtest/fixtures/demo-adventure.json` Host-gated | PASS | HTTP `403 application/json` without a valid Host session |

## API Flow Smoke

Ran the requested core flow through HTTP against the provider-disabled playtest server.

| Flow Step | Result |
| --- | --- |
| Create room | PASS |
| Join two players | PASS |
| Create two characters | PASS |
| Host fetches gated demo adventure fixture | PASS |
| Host loads adventure | PASS |
| Host starts session | PASS |
| Player sends message | PASS |
| Host changes scene to Lantern Tower | PASS |
| Host reveals `clue_broken_lens` | PASS |
| Host starts Hill Scavengers combat | PASS |
| Player resolves one attack | PASS |
| Host ends combat | PASS |
| Host completes session | PASS |

Final flow evidence:

- Room reached `phase: ended`.
- Current scene was `scene_lantern_tower`.
- Player discovered clues contained `clue_broken_lens`.
- Attack response emitted `attack.resolved` and `damage.applied`.
- Player snapshot, player adventure snapshot, and player recap did not contain known DM-only strings, including the redacted DM-only phrase, hidden clue id, Host-only recap heading, or DM note used by the smoke check.
- Host adventure snapshot included Host-only truth.
- Host recap included the expected redacted Host-only truth summary.

## UI/Render Smoke

| Check | Result | Evidence |
| --- | --- | --- |
| English labels render | PASS | Added and ran renderer assertions for Host and Player English labels |
| Chinese labels render | PASS | Existing and rerun renderer assertions for Host and Player Chinese labels |
| Language switcher appears on Host page | PASS | Browser page showed one language switcher |
| Language switcher appears on Player page | PASS | Browser page showed one language switcher |
| Language switcher appears on index page | PASS | Browser page showed language switcher controls and Host/Player entry links |
| Authored gameplay text is not auto-translated | PASS | Added Chinese-locale renderer assertion preserving adventure text, character name, player message, AI output, dice reason, and recap text |
| Player render excludes known DM-only fixture strings | PASS | Renderer and API smoke no-leak checks passed |

Targeted renderer command:

```bash
/Users/chenminghui/.nvm/versions/node/v24.14.0/bin/node scripts/run-tests.mjs apps/web/test/ui-render.test.mjs
```

Result: `8 pass, 0 fail`.

## Provider Safety

No live provider network calls were made.

Targeted command:

```bash
/Users/chenminghui/.nvm/versions/node/v24.14.0/bin/node scripts/run-tests.mjs apps/server/test/provider-ai-adapter.test.mjs apps/server/test/playtest-server.test.mjs apps/server/test/ai-room-runner.test.mjs apps/server/test/http-server.test.mjs apps/server/test/ai-dm-orchestrator.test.mjs
```

Result: `38 pass, 0 fail`.

| Check | Result |
| --- | --- |
| Provider preflight never prints API key | PASS |
| Timeout maps to controlled error | PASS |
| Failed request maps to controlled error | PASS |
| Invalid provider payload is rejected | PASS |
| Reveal proposal routes to Host review | PASS |
| `privateMessages` stay out of player HTTP/SSE/UI/recap | PASS |

## Secret Hygiene

Ran a redacted repository scan for provider keys, bearer tokens, API key assignments, session-token literals, and private payload markers. No high-confidence real secret was exposed in command output or the report.

Redacted findings requiring no immediate blocker:

- `apps/server/test/ai-room-runner.test.mjs:29` - `api_key_assignment: <redacted>`; short test literal.
- `apps/server/test/provider-ai-adapter.test.mjs` - `api_key_assignment: <redacted>`; placeholder/test literals.
- `apps/server/test/playtest-server.test.mjs` - `openai_or_provider_key: <redacted>` and `api_key_assignment: <redacted>`; placeholder/test literals.
- `apps/server/test/http-server.test.mjs:205` - `private_payload_marker: <redacted>`; deliberate test fixture.
- `apps/web/test/ui-render.test.mjs` - `session_token_literal: <redacted>`; placeholder/test literals.
- `docs/playtests/LIVE_PROVIDER_SETUP.md:26` - `api_key_assignment: <redacted>`; setup example line.
- `.worktrees/live-playtest-hardening-phase-1/...` - duplicate placeholder/test findings from an in-repo worktree directory.

## Blockers

None found in this QA pass.

## Warnings

- The default shell runtime is Node 16 and does not satisfy the project `node >=20` requirement. QA used the explicit Node 24 runtime.
- `npm` is not available on the default shell path; npm commands require the Node 24 bin directory first in `PATH`.
- The repository-local `.worktrees/live-playtest-hardening-phase-1` directory increases secret-scan noise by duplicating test fixtures.
- Secret scan placeholders are safe in context, but some are not obviously placeholder-named when redacted.

## Non-Blocking Observations

- The player adventure projection intentionally exposes the revealed clue by public handle/title/text, not by internal clue id.
- The revealed public clue text includes a hidden-hatch hint after Host reveal; this is player-visible adventure content, not unrevealed DM-only truth.
- Local playtest server smoke used an ephemeral port to avoid conflicts.

## Recommended Next Fixes

- Add a small scripted HTTP smoke harness so the manual API-flow smoke can be repeated as one command without relying on ad hoc runner code.
- Standardize local development on the Node 20+ runtime, or add a visible setup note for `PATH`/nvm usage.
- Rename placeholder test API keys and session tokens to more obvious sentinel values to reduce redacted scan review noise.
- Consider excluding repository-local `.worktrees/` from routine secret scans if it remains intentionally ignored and duplicated.

## Second Supervised Live Run

Safe to attempt a second supervised live-provider run, provided the provider key is supplied only through local environment variables, the run remains supervised, and provider network calls are intentionally enabled only for that run. This QA pass does not claim production readiness.
