# Live Provider Setup

This guide prepares a supervised live-provider dry run without committing secrets. The provider remains disabled unless explicitly enabled in the local environment.

## Environment Variables

`loadAiProviderConfig` reads these variables:

- `TABLEMIND_AI_PROVIDER_ENABLED`: set to `true` only for a supervised live run.
- `TABLEMIND_AI_PROVIDER_ENDPOINT`: provider endpoint URL.
- `TABLEMIND_AI_PROVIDER_API_KEY`: provider API key or bearer credential.
- `TABLEMIND_AI_PROVIDER_MODEL`: model identifier for the provider request.
- `TABLEMIND_AI_PROVIDER_TIMEOUT_MS`: request timeout in milliseconds. Defaults to `30000` when omitted.

For a DeepSeek dry run through a local structured-response bridge, point
`TABLEMIND_AI_PROVIDER_ENDPOINT` at the local bridge and follow
`../providers/DEEPSEEK_STRUCTURED_RESPONSE_BRIDGE.md`.

## Local Shell Example

Use placeholders only in documentation, tickets, and screenshots:

```bash
export TABLEMIND_AI_PROVIDER_ENABLED="true"
export TABLEMIND_AI_PROVIDER_ENDPOINT="https://provider.example.test/v1/responses"
export TABLEMIND_AI_PROVIDER_API_KEY="<provider-api-key>"
export TABLEMIND_AI_PROVIDER_MODEL="<provider-model>"
export TABLEMIND_AI_PROVIDER_TIMEOUT_MS="30000"
```

Disable the provider before returning to normal development:

```bash
unset TABLEMIND_AI_PROVIDER_ENDPOINT
unset TABLEMIND_AI_PROVIDER_API_KEY
unset TABLEMIND_AI_PROVIDER_MODEL
unset TABLEMIND_AI_PROVIDER_TIMEOUT_MS
export TABLEMIND_AI_PROVIDER_ENABLED="false"
```

## Safety Rules

- Never commit API keys, provider account identifiers, private endpoints, or captured provider payloads containing secrets.
- Do not put real credentials in `.env`, shell history examples, fixtures, test snapshots, issue bodies, or playtest reports.
- Automated tests must use mock adapters and must not require live network calls.
- Host supervision is mandatory for every live-provider run.
- Public AI output must still pass structured validation, spoiler guard checks, and Host review gates when required.
- Stop the dry run if player-facing HTTP, SSE, UI, or recap output exposes DM-only truth.
