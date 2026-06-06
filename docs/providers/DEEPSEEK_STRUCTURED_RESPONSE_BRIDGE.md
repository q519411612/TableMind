# DeepSeek Structured Response Bridge Contract

Status: documented temporary bridge path.

This contract describes how a local DeepSeek structured-response bridge can be
used with the existing TableMind provider adapter for supervised dry runs. It is
not a permanent first-party DeepSeek integration and does not make TableMind
production-ready.

The bridge is responsible for translating between any DeepSeek-specific API
shape and the TableMind structured AI DM response shape. TableMind sends one
generic provider request and expects one validated structured response back.

## Request From TableMind

TableMind sends an HTTP `POST` request to `TABLEMIND_AI_PROVIDER_ENDPOINT`.

Headers:

```txt
content-type: application/json
authorization: Bearer <provider-api-key>
```

Body:

```json
{
  "model": "<provider-model-label>",
  "responseFormat": "tablemind.ai_dm_response.v1",
  "context": {
    "session": {},
    "currentScene": {},
    "recentPublicEvents": [],
    "hiddenEntities": [],
    "unrevealedClues": [],
    "dmOnlySecrets": [],
    "combat": null,
    "policy": {
      "diceResults": "forbidden",
      "stateMutation": "host_review_required",
      "reveal": "host_review_required",
      "allowedRuleRequests": [
        "skill_check",
        "ability_check",
        "saving_throw"
      ]
    },
    "contextBudget": {
      "maxBytes": 32000,
      "usedBytes": 0,
      "truncatedRecentPublicEvents": false,
      "omittedRecentPublicEventCount": 0
    }
  }
}
```

The exact `context` values come from `buildAiContextForRoom`. The bridge must
not add provider keys, session tokens, private provider payloads, or local
operator notes into the response body or any captured logs.

## Response To TableMind

The bridge must return JSON directly matching `tablemind.ai_dm_response.v1`.

Safe narration example:

```json
{
  "publicMessage": "Cold soot curls around the cracked lantern frame.",
  "ruleRequests": [
    {
      "type": "skill_check",
      "characterId": "char_ada",
      "skill": "investigation",
      "dc": 15,
      "advantage": "normal",
      "reason": "Inspect the lantern soot."
    }
  ],
  "confidence": "high"
}
```

Review-required reveal proposal example:

```json
{
  "publicMessage": "The lantern trembles in the rain.",
  "revealProposals": [
    {
      "entityType": "clue",
      "entityId": "clue_broken_lens",
      "reason": "The player inspected the lens."
    }
  ],
  "confidence": "high"
}
```

Allowed top-level fields:

- `publicMessage`: required non-empty string.
- `confidence`: optional `low`, `medium`, or `high`.
- `ruleRequests`: optional array of `skill_check`, `ability_check`, or
  `saving_throw` requests.
- `revealProposals`: optional array of `clue`, `secret`, or `scene` proposals.
- `statePatch`: optional object. This is never auto-applied.
- `privateMessages`: optional array of player-specific proposals.
- `rulesCitations`: optional array of rule citation metadata.
- `dmWarnings`: optional array of Host-facing warning strings.

Forbidden fields:

- `diceResults`.
- Raw provider prompts, completions, request IDs, account identifiers, API keys,
  session tokens, or private provider payloads.

Invalid JSON or an invalid structured payload is rejected with
`invalid_provider_payload`.

## Timeout Behavior

`TABLEMIND_AI_PROVIDER_TIMEOUT_MS` controls the runtime timeout. If it is not
set, TableMind uses `30000`.

When the timeout is reached, TableMind aborts the bridge request and returns a
controlled `provider_timeout` error. The error message must not include the
endpoint, API key, provider payload, or private context.

The bridge should stop upstream provider work when the HTTP request is aborted.

## Error Behavior

The bridge should return a non-2xx HTTP status when it cannot produce a
structured response. TableMind maps non-2xx responses and request failures to a
controlled `provider_request_failed` error.

The bridge should not forward raw provider error bodies to TableMind logs. If
operator diagnostics are needed, store them outside the repository and redact
secrets before sharing.

## No-Secret Logging Rules

Never log or commit:

- `TABLEMIND_AI_PROVIDER_API_KEY`.
- Authorization headers.
- Provider account identifiers.
- Session tokens.
- Raw prompt or completion payloads from a private run.
- Private uploaded content.

Allowed operational evidence:

- Provider enabled status.
- Endpoint reachability without credentials.
- Model label.
- Timeout value.
- Controlled error code.
- Host review count and decision summary.

## Host Review Requirements

Host review remains mandatory for:

- reveal proposals;
- low confidence output;
- state patch proposals;
- spoiler risk or spoiler guard blocks;
- unsupported actions;
- ambiguous provider output.

Safe public narration may auto-commit only after structured validation passes,
spoiler checks allow the output, no reveal or state patch is proposed, confidence
is not `low`, and any rule request is routed through deterministic rules code.

Rejected risky review items must not reach player HTTP responses, player SSE
events, player UI, or player recaps.
