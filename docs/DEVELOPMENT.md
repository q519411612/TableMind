# TableMind Development Setup

## Node Runtime

TableMind requires Node `>=20`. The default shell `node` on a local machine can be older than the project requirement, so check the runtime before running project commands:

```bash
node --version
npm --version
```

If `node --version` reports a version below `v20`, select a newer runtime first. With `nvm`, for example:

```bash
nvm install 20
nvm use 20
node --version
```

To make npm commands use the selected runtime in new shells:

```bash
nvm alias default 20
```

All npm scripts, including `npm run check`, `npm test`, `npm run acceptance`, `npm run build`, and `npm run smoke:playtest`, expect Node 20 or newer in `PATH`.

## Provider Calls

Provider calls are disabled for normal local verification. The repeatable playtest smoke explicitly starts with:

```bash
TABLEMIND_AI_PROVIDER_ENABLED=false npm run smoke:playtest
```

Live-provider runs must remain supervised and must pass credentials only through the local environment. Do not commit provider keys, session tokens, authorization headers, or captured provider payloads.

## Routine Secret Scans

Repository-local `.worktrees/` directories are intentionally local-only and are already ignored by git. They can duplicate fixtures and test sentinels, so routine scans may exclude them unless the scan is intentionally auditing local worktrees:

```bash
rg --hidden --glob '!.git/**' --glob '!.worktrees/**' '<secret-pattern>'
```

Use obvious sentinels in tests and docs, such as `<TEST_PROVIDER_API_KEY_DO_NOT_USE>`, `tm_test_session_token`, and `Bearer <TEST_BEARER_TOKEN>`, instead of realistic-looking placeholder credentials.
