# Chinese Adventure Support Design

## Goal

TableMind should support a Simplified Chinese authored script for the built-in
demo adventure first, then generalize the same contract so future adventure
modules can provide explicit localized authored content without duplicating
session truth.

## Context

The current browser demo already supports English and Simplified Chinese fixed
UI labels through `apps/web/src/i18n.mjs`. Current authored gameplay text remains
unchanged unless explicit localized fields exist. The built-in demo adventure
fixture, `The Lantern Beneath the Hill`, has a Chinese working title in
`specs/014-demo-adventure/requirements.md`, but the fixture itself only carries
English authored adventure text.

The design must preserve the project invariants:

- LLM output never becomes authoritative state.
- Dice, checks, attacks, damage, initiative, HP, and combat turns remain
  deterministic system operations.
- Player snapshots, HTTP responses, SSE, player UI, and player recaps must not
  leak DM-only content.
- Provider calls remain disabled in default tests.
- Embedded content remains original TableMind authored content or SRD/open
  content with source metadata.

## Approaches Considered

### Recommended: explicit localized fields on the same adventure graph

Keep a single canonical adventure graph with stable IDs, references, visibility,
and combat data. Add explicit `locales` fields for authored strings. Runtime
views apply a requested locale to display text, while session state and events
continue to store stable IDs.

Trade-offs:

- Best fit for replay, projection, and no-leak tests.
- Avoids two divergent adventure modules.
- Requires a small localization helper and validation coverage.

### Alternate: separate English and Chinese fixtures

Create a second Chinese Markdown fixture with the same IDs and references.

Trade-offs:

- Fast to author.
- Higher risk of fixture drift across scene IDs, clue IDs, encounter IDs, and
  hidden visibility.
- Harder to prove replay and recap use the same facts.

### Alternate: runtime translation

Ask a provider or local translation tool to translate adventure text at runtime.

Trade-offs:

- Not acceptable for MVP safety because translated text can alter clue names,
  hidden phrases, spoiler guard aliases, or tone without review.
- Adds provider behavior to default paths.

## Scope

### Slice A: built-in demo Chinese script

Add Simplified Chinese authored text to the existing Lantern demo fixture and
make the local demo consume it in Host and player adventure surfaces.

Covered authored fields:

- adventure `title` and `synopsis`;
- truth `title` and `text`;
- scene `title`, `readAloud.text`, and `dmNotes.text`;
- NPC `name`, `publicDescription`, and `dmNotes`;
- clue `title`, `text`, and `aliases`;
- encounter `title`, `publicSetup`, and `dmNotes`;
- ending `title`, `publicText`, and `dmNotes`.

Slice A must keep stable entity IDs, references, visibility values, combatants,
ruleset ID, and source metadata unchanged.

### Slice B: reusable locale abstraction

Add a reusable, validated localization contract for AdventureModule objects so
future modules can provide localized authored content using the same helper.

Covered behavior:

- Localized fields are selected only when explicitly present.
- Missing localized fields preserve the canonical authored text.
- Unsupported locales fail early at locale resolution boundaries.
- Player projection applies localization after enforcing visibility, or applies
  visibility-preserving localization with the same result.
- Host projection may include localized DM-only text only for Host views.
- Recap can use localized authored names/text for visible clue and Host note
  sections without exposing hidden content to players.
- Spoiler guard can check localized hidden titles, aliases, and clue text when
  the active locale is Simplified Chinese.

## Non-Goals

- No runtime machine translation.
- No separate Chinese state machine or second canonical adventure truth.
- No production adventure marketplace or public sharing.
- No PDF import localization.
- No D&D Beyond sync.
- No full VTT, map, token, lighting, or 3D work.
- No live-provider dependency in default tests.

## Data Contract

Adventure modules may include:

```js
{
  title: "The Lantern Beneath the Hill",
  synopsis: "English synopsis.",
  locales: {
    "zh-CN": {
      title: "山丘下的灯火",
      synopsis: "中文简介。"
    }
  }
}
```

Entities may include a `locales` object with the same shape as their authored
string fields:

```js
{
  id: "scene_village_square",
  title: "Village Square",
  readAloud: {
    text: "English read aloud.",
    visibility: "public"
  },
  dmNotes: {
    text: "English Host text.",
    visibility: "dm_only"
  },
  locales: {
    "zh-CN": {
      title: "村庄广场",
      readAloud: {
        text: "中文朗读文本。"
      },
      dmNotes: {
        text: "中文主持人信息。"
      }
    }
  }
}
```

Localization data must not define IDs, references, visibility, source metadata,
combatants, numeric values, rules data, or session state. Those remain canonical
and language-neutral.

## Markdown Fixture Format

The MVP fixture parser should keep English structural headings such as
`Read Aloud`, `DM Notes`, `Clue`, and `Encounter`. Simplified Chinese content is
authored inside explicit locale subsections. This keeps the parser simple and
avoids guessing whether a heading is structural or authored prose.

Proposed module-level section shape:

```md
## Locale: zh-CN
title: 山丘下的灯火

### Synopsis
中文简介。
```

For entity blocks:

```md
### Locale: zh-CN
title: 村庄广场

#### Read Aloud
中文朗读文本。

#### DM Notes
中文主持人信息。
```

Parser rules:

- Locale blocks are optional.
- Module-level locale blocks use `## Locale: <locale>`.
- Entity-level locale blocks use `### Locale: <locale>` inside the entity block.
- Locale block keys use BCP-47 locale IDs already supported by TableMind.
- Locale `title` is read from key-value metadata before localized subsections.
- Module localized prose is read from `###` subsections inside a module locale
  block.
- Entity localized prose is read from `####` subsections inside an entity locale
  block.
- Missing localized prose falls back to canonical prose.
- Unknown locale IDs are validation errors for embedded fixtures.

## Runtime Data Flow

1. `loadAdventureFixture` parses canonical English text and any explicit locale
   blocks into one AdventureModule.
2. `validateAdventureModule` verifies canonical required fields and validates
   localized fields without requiring full translation coverage.
3. Room service stores the canonical module with localized fields.
4. Adventure snapshot requests carry the viewer role and selected locale.
5. Projection code enforces visibility and selects localized authored text for
   the requested locale.
6. UI renderers remain thin: they render the localized snapshot they receive.
7. Recap receives locale and localized adventure data, then builds deterministic
   player-safe or Host recaps.
8. Spoiler guard checks canonical and localized hidden phrases for the locale
   used by public output.

## Error Handling

- Unsupported locale values fail through the existing locale resolver.
- Locale blocks for unknown locale IDs fail fixture validation.
- Locale fields with non-string authored text fail fixture validation.
- Locale blocks that attempt to override IDs, references, visibility, combatants,
  rules data, or source metadata fail validation.
- Missing localized fields are not errors; they preserve canonical text.

## Test Strategy

Targeted tests:

- Adventure loader parses `zh-CN` locale blocks from the Lantern fixture.
- Validation rejects unsupported locale IDs and non-string localized fields.
- Localization helper falls back to canonical text when a field is missing.
- Player adventure projection in `zh-CN` includes localized public text and
  still excludes truth, DM notes, hidden clue IDs, hidden encounter IDs, hidden
  NPC IDs, and combatant data.
- Host adventure projection in `zh-CN` includes localized DM-only text.
- Player and Host renderers show localized authored scene text when snapshots
  are localized.
- Recap uses localized visible clue names in `zh-CN` while preserving player
  no-leak behavior.
- Spoiler guard catches localized hidden clue titles, aliases, and secret text.
- Acceptance or smoke coverage exercises Host plus player Chinese adventure
  snapshots in the browser-like setup flow.

Verification commands:

```bash
node scripts/check-js.mjs
node scripts/run-tests.mjs packages apps tests
node scripts/run-tests.mjs tests/acceptance
TABLEMIND_AI_PROVIDER_ENABLED=false node scripts/smoke-playtest-flow.mjs
```

When `npm` is available, the final gate remains:

```bash
npm run check
npm test
npm run acceptance
npm run build
```

## Acceptance Criteria

- The built-in demo can show Chinese authored scene and clue text in the local
  Host/player browser flow when `lang=zh-CN`.
- English behavior remains unchanged when `lang=en` or no locale is requested.
- Player surfaces never receive localized DM-only truth, unrevealed clue text,
  hidden encounter combatants, rejected review payloads, or raw state patches.
- Recap labels and visible authored adventure text can be Simplified Chinese.
- Spoiler guard detects Simplified Chinese hidden clue/secret leakage.
- Default automated verification uses mock/disabled provider mode only.

## Documentation Updates

Update these docs when implementation lands:

- `docs/CURRENT_STATUS.md`: describe explicit Chinese authored demo content and
  the fallback behavior.
- `README.md`: mention that the local demo has fixed UI labels and authored
  adventure text in English and Simplified Chinese.
- `docs/codex/demo-goal-pack/DEMO_SCOPE_GAP_ANALYSIS.md`: note that authored
  gameplay localization is no longer only a deferred fallback for the built-in
  demo.
