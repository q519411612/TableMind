# 008 Adventure Importer - Design

## AdventureModule

```ts
type AdventureModule = {
  id: string;
  title: string;
  rulesetId: string;
  recommendedLevel?: string;
  playerCount?: string;
  estimatedTime?: string;
  synopsis: string;
  startingSceneId: string;
  truth: Secret[];
  scenes: Scene[];
  locations: Location[];
  npcs: NPC[];
  encounters: Encounter[];
  clues: Clue[];
  treasure: Treasure[];
  endings: Ending[];
  source: ContentSource;
  status: "draft" | "approved" | "archived";
};
```

## Structured Markdown sections

Recommended headings:

```md
# Adventure: Title
## Metadata
## Synopsis
## Truth
## Scene: Name
### Read Aloud
### DM Notes
### Clues
### NPCs
### Encounter
## NPC: Name
## Clue: Name
## Encounter: Name
## Ending: Name
```

## Visibility mapping

- `Read Aloud` -> public
- `Synopsis` -> host-visible summary by default, may be public after start
- `Truth` -> dm_only
- `DM Notes` -> dm_only
- `Clue` -> hidden until revealed unless marked public
- `NPC public description` -> public
- `NPC motivation` -> dm_only

## Import stages

1. Parse Markdown structure.
2. Extract metadata.
3. Build entity drafts.
4. Assign stable IDs.
5. Infer references.
6. Validate required fields.
7. Return draft with warnings/errors.
8. Host approves module.

## Validation result

```ts
type ImportResult = {
  module?: AdventureModule;
  errors: ImportIssue[];
  warnings: ImportIssue[];
};

type ImportIssue = {
  code: string;
  message: string;
  sourceRef?: SourceRef;
  severity: "error" | "warning";
};
```

## PDF import

PDF import is deferred/experimental. It should follow the same output contract but must require Host review.
