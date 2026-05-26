# 007 SRD Compendium - Design

## Entry model

```ts
type CompendiumEntryType =
  | "rule"
  | "condition"
  | "action"
  | "spell"
  | "monster"
  | "item"
  | "class";

type CompendiumEntry = {
  id: string;
  type: CompendiumEntryType;
  name: string;
  normalizedName: string;
  source: ContentSource;
  sectionPath: string[];
  rawText: string;
  summary?: string;
  structuredData?: Record<string, unknown>;
  tags: string[];
};
```

## Source metadata

```ts
type ContentSource = {
  id: string;
  title: string;
  contentClass: "embedded_srd" | "embedded_original" | "user_private_upload" | "licensed_partner_content" | "unknown";
  license?: string;
  attribution?: string;
  url?: string;
};
```

## Search interface

```ts
type CompendiumSearchQuery = {
  query: string;
  types?: CompendiumEntryType[];
  limit?: number;
  rulesetId?: string;
};

type CompendiumSearchResult = {
  entry: CompendiumEntry;
  score: number;
  matchReason?: string;
};
```

MVP can implement simple keyword search. Future versions may add BM25, vector search, or hybrid retrieval.

## Structured monster data

```ts
type MonsterData = {
  armorClass: number;
  hitPoints: number;
  speed?: string;
  abilities: Record<AbilityKey, number>;
  attacks: AttackDefinition[];
  challengeRating?: string;
};
```

## Structured condition data

```ts
type ConditionData = {
  effects: string[];
};
```

## Fixture strategy

The first implementation should include tiny fixture files, not the full SRD.

Recommended fixture entries:

- ability checks
- advantage/disadvantage
- grappled condition
- goblin-like original/SRD-safe monster fixture
- short sword item fixture

## Attribution

Every embedded SRD entry must include source and license metadata.

Public UI should be able to display attribution when showing rule references.
