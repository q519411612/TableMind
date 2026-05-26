# 013 Session Recap - Design

## Recap input

```ts
type RecapInput = {
  sessionState: SessionState;
  events: SessionEvent[];
  viewerRole: "player" | "host";
  viewerPlayerId?: string;
};
```

## Recap output

```ts
type SessionRecap = {
  title: string;
  audience: "player" | "host";
  summary: string;
  timeline: RecapTimelineItem[];
  keyRolls: RecapRollItem[];
  discoveredClues: string[];
  combatOutcomes: string[];
  rewards: string[];
  unresolvedThreads?: string[];
  markdown: string;
};
```

## Generation approach

MVP can first generate deterministic recap sections from events.

A later AI-assisted summarizer can polish the prose, but must use role-filtered input.

## Player vs Host recap

Player recap:

- includes only public/revealed information;
- excludes unrevealed clues;
- excludes secrets and DM notes.

Host recap:

- may include unresolved hidden clues;
- may include AI warnings and Host overrides;
- may include debugging notes.

## Event sources

Useful event types:

- player messages
- AI messages
- scene changes
- clue reveals
- dice rolls
- combat events
- Host overrides

## Export

Recap should be exportable as Markdown.
