# 001 Content Boundary - Requirements

## Goal

Define what content TableMind may embed, import, store, expose, and use during MVP.

## User stories

### Story 1: Product only embeds allowed content

As a maintainer, I want embedded content to be limited to SRD/open/original material, so that the product does not redistribute commercial D&D content.

#### Acceptance criteria

- WHEN content is committed to the repo THEN it is SRD/open/original content.
- WHEN a compendium entry is included THEN it includes source and license metadata.
- WHEN a demo adventure is included THEN all adventure text is original.

### Story 2: User uploads remain private

As a Host, I want uploaded adventure files to remain private to my room, so that private materials are not shared publicly.

#### Acceptance criteria

- WHEN a user uploads content THEN it is scoped to the user/session.
- WHEN another room queries content THEN it cannot access that upload.
- WHEN content is indexed THEN it does not enter a public/shared compendium by default.

## Functional requirements

1. Embedded rules content MUST be SRD/open licensed or original.
2. Demo adventures MUST be original or clearly licensed.
3. User uploads MUST be private by default.
4. Public adventure sharing is out of MVP scope.
5. D&D Beyond sync is out of MVP scope.
6. Commercial official adventures are not embedded in the MVP.

## Non-goals

- Legal review automation.
- Marketplace licensing.
- Public module publishing.
- D&D Beyond import.
- Official non-SRD book ingestion.
