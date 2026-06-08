# TableMind Demo Acceptance Checklist

This checklist combines the demo goal pack acceptance template with the current
verified local demo evidence. It is not a production readiness checklist.

## Environment

- [x] Node 20+ requirement is documented.
- [x] Default automated tests do not call live providers.
- [x] `npm run check` was attempted and recorded as unavailable because `npm`
  is not in `PATH`.
- [x] `npm test` was attempted and recorded as unavailable because `npm` is not
  in `PATH`.
- [x] `npm run acceptance` was attempted and recorded as unavailable because
  `npm` is not in `PATH`.
- [x] `npm run build` was attempted and recorded as unavailable because `npm`
  is not in `PATH`.
- [x] `TABLEMIND_AI_PROVIDER_ENABLED=false npm run smoke:playtest` was
  attempted and recorded as unavailable because `npm` is not in `PATH`.
- [x] Direct Node check passed.
- [x] Direct Node full test suite passed.
- [x] Direct Node acceptance suite passed.
- [x] Direct Node provider-disabled smoke passed.

## Host Flow

- [x] Host can open Host UI.
- [x] Host can create a room.
- [x] Host can load the original demo adventure.
- [x] Host can copy/share invite link.
- [x] Host can see joined players and their character readiness.
- [x] Host can start session.
- [x] Host can see current scene public text and DM-only notes/truth.
- [x] Host can run AI turn.
- [x] Host can pause/resume AI.
- [x] Host can approve/edit/reject review items.
- [x] Host can reveal clues.
- [x] Host can change scene.
- [x] Host can start combat.
- [x] Host can patch HP/conditions without typing obscure IDs.
- [x] Host can advance/end combat.
- [x] Host can complete session and view Host recap.

## Player Flow

- [x] Player can open invite link with roomId prefilled.
- [x] Player can enter display name and join.
- [x] Player can create/select a demo-ready level 1 character.
- [x] Player can see current scene/read-aloud text.
- [x] Player can see public feed.
- [x] Player can send a public action/message.
- [x] Player can see deterministic check/dice results.
- [x] Player can see discovered clues only after reveal.
- [x] Player can see own character summary.
- [x] Player can see combat status.
- [x] Player can select a valid attack and target without typing raw IDs.
- [x] Player can see hit/miss/damage results.
- [x] Player can view player-safe recap.

## AI And Host Review

- [x] Safe AI narration can be broadcast/committed.
- [x] Low confidence AI output enters Host review.
- [x] Spoiler-risk output enters Host review.
- [x] Reveal proposal enters Host review.
- [x] State patch proposal enters Host review.
- [x] Edited AI output is what players see.
- [x] Rejected AI output never appears to players.
- [x] AI cannot directly mutate room/session state.
- [x] Rules requests route through deterministic rules code.

## Combat

- [x] Encounter start rolls/sets initiative deterministically.
- [x] Round and active combatant are visible.
- [x] Turn order is visible.
- [x] Player attack uses rules engine.
- [x] Damage applies to target HP.
- [x] HP cannot go into invalid states.
- [x] Conditions apply/remove through Host command.
- [x] End combat records an auditable event.

## Bilingual Support

- [x] UI fixed text supports English.
- [x] UI fixed text supports Simplified Chinese.
- [x] Language switcher persists via localStorage.
- [x] `?lang=en` and `?lang=zh-CN` work.
- [x] New errors/empty states/next-step hints are translated.
- [x] Combat/review/recap headings are translated.
- [x] AI/mock output can follow selected locale where configured.
- [x] Session recap system labels support selected locale.
- [x] The built-in Lantern demo has explicit English and Simplified Chinese
  authored adventure text.
- [x] Authored gameplay text uses explicit localized fields or remains
  unchanged.

## No-DM-Leak Safety

- [x] Player snapshot has no `dm_only` secrets.
- [x] Player adventure snapshot has no hidden truth, hidden clue IDs, hidden NPC
  IDs, or hidden encounter internals.
- [x] Player HTTP responses are role-projected.
- [x] Player SSE stream has no Host-only event types/payloads.
- [x] Player UI has no DM-only text.
- [x] Player recap has no DM-only truth, rejected AI output, raw state patches,
  or Host-only review payloads.
- [x] Same no-leak checks pass in English and Chinese UI paths.

## Documentation

- [x] README explains Node 20+ and commands.
- [x] README explains how to start playtest server.
- [x] README links Host and Player UI entry points.
- [x] README states provider-disabled default behavior.
- [x] `docs/CURRENT_STATUS.md` is updated honestly.
- [x] `docs/playtests/DEMO_ACCEPTANCE_CHECKLIST_2026-06-08.md` records the
  detailed self-check.
- [x] `docs/playtests/DEMO_ACCEPTANCE_REPORT_2026-06-08.md` records final
  command results and known limitations.
- [x] Docs do not claim production readiness.
- [x] Docs do not include secrets or real provider payloads.

## Demo-Ready Final Evidence

- [x] One recorded local run with Host and two players completed.
- [x] At least one skill/check flow completed.
- [x] At least one combat flow completed.
- [x] At least one Host review intervention completed.
- [x] Player recap and Host recap generated.
- [x] Known limitations are documented.
