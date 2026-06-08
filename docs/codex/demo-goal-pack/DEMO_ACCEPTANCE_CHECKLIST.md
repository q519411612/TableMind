# TableMind Demo Acceptance Checklist

## Environment

- [ ] Node 20+ is active.
- [ ] `npm run check` passes.
- [ ] `npm test` passes.
- [ ] `npm run acceptance` passes.
- [ ] `npm run build` passes.
- [ ] `TABLEMIND_AI_PROVIDER_ENABLED=false npm run smoke:playtest` passes or is documented as not applicable.
- [ ] Default automated tests do not call live providers.

## Host flow

- [ ] Host can open Host UI.
- [ ] Host can create a room.
- [ ] Host can load the original demo adventure.
- [ ] Host can copy/share invite link.
- [ ] Host can see joined players and their character readiness.
- [ ] Host can start session.
- [ ] Host can see current scene public text and DM-only notes/truth.
- [ ] Host can run AI turn.
- [ ] Host can pause/resume AI.
- [ ] Host can approve/edit/reject review items.
- [ ] Host can reveal clues.
- [ ] Host can change scene.
- [ ] Host can start combat.
- [ ] Host can patch HP/conditions without typing obscure IDs.
- [ ] Host can advance/end combat.
- [ ] Host can complete session and view Host recap.

## Player flow

- [ ] Player can open invite link with roomId prefilled.
- [ ] Player can enter display name and join.
- [ ] Player can create/select a demo-ready level 1 character.
- [ ] Player can see current scene/read-aloud text.
- [ ] Player can see public feed.
- [ ] Player can send a public action/message.
- [ ] Player can see deterministic check/dice results.
- [ ] Player can see discovered clues only after reveal.
- [ ] Player can see own character summary.
- [ ] Player can see combat status.
- [ ] Player can select a valid attack and target without typing raw IDs.
- [ ] Player can see hit/miss/damage results.
- [ ] Player can view player-safe recap.

## AI and Host review

- [ ] Safe AI narration can be broadcast/committed.
- [ ] Low confidence AI output enters Host review.
- [ ] Spoiler-risk output enters Host review.
- [ ] Reveal proposal enters Host review.
- [ ] State patch proposal enters Host review.
- [ ] Edited AI output is what players see.
- [ ] Rejected AI output never appears to players.
- [ ] AI cannot directly mutate room/session state.
- [ ] Rules requests route through deterministic rules code.

## Combat

- [ ] Encounter start rolls/sets initiative deterministically.
- [ ] Round and active combatant are visible.
- [ ] Turn order is visible.
- [ ] Player attack uses rules engine.
- [ ] Damage applies to target HP.
- [ ] HP cannot go into invalid states.
- [ ] Conditions apply/remove through Host command.
- [ ] End combat records an auditable event.

## Bilingual support

- [ ] UI fixed text supports English.
- [ ] UI fixed text supports Simplified Chinese.
- [ ] Language switcher persists via localStorage.
- [ ] `?lang=en` and `?lang=zh-CN` work.
- [ ] New errors/empty states/next-step hints are translated.
- [ ] Combat/review/recap headings are translated.
- [ ] AI/mock output can follow selected locale where configured.
- [ ] Session recap system labels support selected locale.
- [ ] Authored gameplay text uses explicit localized fields or remains unchanged.

## No-DM-leak safety

- [ ] Player snapshot has no `dm_only` secrets.
- [ ] Player adventure snapshot has no hidden truth, hidden clue IDs, hidden NPC IDs, or hidden encounter internals.
- [ ] Player HTTP responses are role-projected.
- [ ] Player SSE stream has no Host-only event types/payloads.
- [ ] Player UI has no DM-only text.
- [ ] Player recap has no DM-only truth, rejected AI output, raw state patches, or Host-only review payloads.
- [ ] Same no-leak checks pass in English and Chinese UI paths.

## Documentation

- [ ] README explains Node 20+ and commands.
- [ ] README explains how to start playtest server.
- [ ] README links Host and Player UI entry points.
- [ ] README states provider-disabled default behavior.
- [ ] docs/CURRENT_STATUS is updated honestly.
- [ ] docs/playtests contains a demo checklist/report template.
- [ ] Docs do not claim production readiness.
- [ ] Docs do not include secrets or real provider payloads.

## Demo-ready final evidence

- [ ] One recorded/manual run with Host + 2 players completed.
- [ ] At least one skill/check flow completed.
- [ ] At least one combat flow completed.
- [ ] At least one Host review intervention completed.
- [ ] Player recap and Host recap generated.
- [ ] Known limitations are documented.
