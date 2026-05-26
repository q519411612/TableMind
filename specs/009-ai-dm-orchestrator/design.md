# 009 AI DM Orchestrator - Design

## Responsibility

The AI DM Orchestrator prepares context, invokes a model adapter, validates structured output, routes rule requests, sends risky output to Host review, and commits approved results.

It does not own authoritative state or dice.

## Context input

```ts
type AiDmContext = {
  session: ProjectedSessionState;
  hostOnlyContext?: HostOnlyContext;
  currentScene: Scene;
  recentEvents: SessionEvent[];
  relevantRules: CompendiumEntry[];
  relevantAdventureEntities: AdventureEntity[];
  pendingCombat?: CombatState;
  hostSettings: HostAiSettings;
};
```

## AI response schema

```ts
type AiDmResponse = {
  publicMessage: string;
  privateMessages?: Array<{
    playerId: string;
    message: string;
  }>;
  ruleRequests?: RuleRequest[];
  statePatch?: ProposedStatePatch;
  revealProposals?: Array<{
    entityType: "clue" | "secret" | "scene";
    entityId: string;
    reason: string;
  }>;
  rulesCitations?: RuleCitation[];
  dmWarnings?: string[];
  confidence?: "low" | "medium" | "high";
};
```

## Rule request examples

```ts
type RuleRequest =
  | { type: "ability_check"; characterId: string; ability: AbilityKey; skill?: SkillKey; dc: number; advantage: AdvantageState; reason: string }
  | { type: "saving_throw"; characterId: string; ability: AbilityKey; dc: number; advantage: AdvantageState; reason: string }
  | { type: "attack"; attackerId: string; targetId: string; attackId: string; advantage: AdvantageState; reason: string };
```

## Processing pipeline

```txt
player event
  -> collect context
  -> retrieve rules/adventure snippets
  -> call model adapter
  -> validate schema
  -> spoiler guard
  -> route rule requests
  -> create pending Host review if required
  -> commit AI message/state events
  -> broadcast projections
```

## Host review triggers

Host review is required when:

- spoiler guard detects risk;
- AI proposes scene transition;
- AI reveals a clue/secret;
- AI applies major damage/death outside rules engine;
- AI confidence is low;
- Host settings require manual approval.

## Model adapter

Implement a provider-agnostic adapter:

```ts
interface AiModelAdapter {
  generateStructuredResponse(input: AiDmContext): Promise<AiDmResponse>;
}
```

MVP can use a mock adapter for tests before integrating real providers.
