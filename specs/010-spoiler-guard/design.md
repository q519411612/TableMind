# 010 Spoiler Guard - Design

## Risk levels

```ts
type SpoilerRiskLevel = "none" | "low" | "medium" | "high";
```

## Check input

```ts
type SpoilerCheckInput = {
  publicMessage: string;
  hiddenEntities: AdventureEntity[];
  unrevealedClues: Clue[];
  dmOnlySecrets: Secret[];
  viewerRole: "player" | "host" | "system";
};
```

## Check result

```ts
type SpoilerCheckResult = {
  allowed: boolean;
  riskLevel: SpoilerRiskLevel;
  findings: Array<{
    entityId?: string;
    entityType?: string;
    reason: string;
    matchedText?: string;
  }>;
};
```

## MVP algorithm

The MVP can use deterministic checks:

1. exact hidden names/phrases;
2. normalized case-insensitive matching;
3. entity aliases;
4. unrevealed clue title matching;
5. unrevealed secret keyword matching.

Semantic leak detection can be added later with model-assisted review.

## Projection checks

Add tests for state projection:

- player projection must exclude dm_only;
- host projection may include dm_only;
- player can see own player_specific info;
- player cannot see other player_specific info.

## Host review integration

If `allowed = false` or riskLevel is medium/high, create Host review item:

```ts
type HostReviewItem = {
  id: string;
  type: "ai_output" | "state_patch" | "reveal";
  reason: string;
  proposedPayload: unknown;
  riskLevel: SpoilerRiskLevel;
};
```

## Limitations

Spoiler guard cannot guarantee perfect semantic protection. The product should still provide Host oversight during MVP.
