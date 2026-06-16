# Web Play UI Smoke Checklist

Use this checklist before and during an internal Web Play UI feedback run. Keep
notes objective and link each failure to a reproducible screen or action.

## Launchpad

- [ ] Launchpad opens from the server base URL.
- [ ] Host Console link opens `host.html`.
- [ ] Player Room link opens `player.html`.
- [ ] Copy clearly says this is a local/internal MVP demo.
- [ ] Copy does not imply production readiness, public launch, dashboard,
      account system, durable database, marketplace, payment, or full VTT scope.

## Host Console

- [ ] Host can create a room.
- [ ] Host can see room id, Host id, invite link, and copy/open invite controls.
- [ ] Host can load the demo adventure.
- [ ] Host can see public scene read-aloud text separately from Host-only notes
      and hidden truth.
- [ ] Host can see player readiness.
- [ ] Host can start the session when players are ready.
- [ ] Host can run AI DM, pause AI, and resume AI.
- [ ] Host can complete the session and view Host recap.

## Player Room

- [ ] Invite link carries `roomId`.
- [ ] Player join form pre-fills room id from the invite link.
- [ ] Player can join with a display name.
- [ ] Player can create a demo-ready character.
- [ ] Player sees current scene, action composer, public feed, character status,
      dice/rules log, combat, and recap panels.
- [ ] Player can submit a normal action.
- [ ] Player guidance changes after joining, character creation, session start,
      combat, and session completion.

## Locale Propagation

- [ ] `?lang=en` renders English fixed UI labels.
- [ ] `?lang=zh-CN` renders Simplified Chinese fixed UI labels.
- [ ] Language switcher persists the selected locale.
- [ ] Launchpad links preserve the selected locale.
- [ ] Host and Player pages render no `undefined` fixed UI text in either
      supported locale.
- [ ] Authored gameplay text is preserved unless explicit localized authored
      text exists.

## Session Guidance

- [ ] Host next-action guidance is clear before room creation.
- [ ] Host next-action guidance is clear before adventure load.
- [ ] Host next-action guidance is clear while waiting for players.
- [ ] Host next-action guidance is clear during play, Host review, combat, and
      recap.
- [ ] Player next-action guidance is clear before join.
- [ ] Player next-action guidance is clear before character creation.
- [ ] Player next-action guidance is clear during lobby, play, combat, and
      recap.

## Narrative/Public Feed

- [ ] Player actions appear in a readable public feed format.
- [ ] AI narration appears in a readable public feed format only after the
      existing validation/review path allows it.
- [ ] Scene changes use player-safe scene names or generic safe copy.
- [ ] Revealed clues use player-safe clue names or generic safe copy.
- [ ] Combat updates are understandable in the feed.
- [ ] Feed cards remain scannable after a long playtest.

## Dice/Rules Log

- [ ] At least one deterministic check appears in the dice/rules log.
- [ ] Formula, modifier, DC, total, success/failure, reason, and rules-engine
      source are understandable.
- [ ] Attack rolls appear with hit/miss details.
- [ ] Damage appears with amount, type, and resulting HP.
- [ ] The UI does not present AI-authored dice as authoritative rules results.

## Host Review Queue

- [ ] Empty review queue explains that safe public flow can continue.
- [ ] Pending item shows status, type, risk, reason, and public message preview.
- [ ] Reveal proposals are visible to Host only.
- [ ] State patch proposals are visible to Host only.
- [ ] Approve, reject, and edit controls are understandable.
- [ ] Edit form textareas are readable and usable on desktop and narrow screens.
- [ ] Rejected output does not appear in Player UI or Player recap.
- [ ] State patches remain manual Host override actions.

## Player-Safe Rendering

- [ ] Player snapshot does not render DM-only notes.
- [ ] Player UI does not render hidden truth.
- [ ] Player UI does not render Host review payloads.
- [ ] Player UI does not render rejected AI output.
- [ ] Player UI does not render raw state patch paths.
- [ ] Player UI does not render `host.review`, `state.patch`, or
      `host.override`.
- [ ] Player UI does not render provider prompts, provider payloads, provider
      credentials, authorization headers, or session tokens.
- [ ] Player recap remains player-safe.

## Combat

- [ ] Host can start the demo encounter.
- [ ] Host and Player panels show round and active combatant.
- [ ] Turn order is readable.
- [ ] HP, AC, status, and conditions are readable for projected combatants.
- [ ] Player attack form appears only when the active player can act.
- [ ] Player attack target selector is usable.
- [ ] Attack and damage output appears in feed, dice/rules log, and combat
      panels.
- [ ] Host can patch HP.
- [ ] Host can apply or remove a condition.
- [ ] Host can advance turn.
- [ ] Host can end combat.

## Recap

- [ ] Host can complete the session.
- [ ] Player recap renders after session completion.
- [ ] Host recap renders after session completion.
- [ ] Player recap excludes DM-only truth, rejected AI output, private review
      payloads, raw state patches, and provider-private material.
- [ ] Host recap is useful for unresolved Host-only threads.
- [ ] Participants can explain whether recap was useful.

## Mobile/Narrow Width

- [ ] Launchpad avoids horizontal overflow.
- [ ] Host Console topbar and status guidance remain readable.
- [ ] Host review cards wrap long text without horizontal overflow.
- [ ] Host review buttons and edit fields are tappable.
- [ ] Combat turn order remains readable.
- [ ] Host combat patch controls stack without clipping.
- [ ] Player action composer remains usable.
- [ ] Player attack form remains usable.
- [ ] Dice/rules log and feed cards remain readable.

## Known Limitations

- [ ] The run used local in-memory room state only.
- [ ] The run did not test production auth, accounts, durable database,
      deployment, payment, marketplace, public adventure sharing, or session
      history.
- [ ] The run did not test full VTT maps, token movement, fog of war, dynamic
      lighting, or 3D scenes.
- [ ] The run did not test a full character builder or complete 5e automation.
- [ ] Live provider use, if any, was explicitly supervised and documented
      without secrets.
- [ ] Any uncovered area is marked as not covered instead of passed.
