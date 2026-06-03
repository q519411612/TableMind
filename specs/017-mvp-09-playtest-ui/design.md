# 017 MVP-0.9 Playtest UI - Design

## Responsibility

The playtest UI is a thin client over the MVP-0.8 transport contract.

It owns:

- rendering;
- local form state;
- calling HTTP command endpoints;
- subscribing to event stream updates;
- showing player-safe or Host data according to viewer role.

It must not own:

- game rules;
- event reduction;
- visibility filtering;
- spoiler checks;
- AI orchestration;
- Host authority decisions.

## Recommended UI architecture

Prefer the smallest viable browser implementation.

Options:

1. **Zero-dependency static UI** using HTML, CSS, and browser modules.
2. **Small framework UI** only if justified and kept behind clear app boundaries.

For MVP-0.9, zero-dependency static UI is acceptable and often preferable.

Suggested structure:

```txt
apps/web/
  README.md
  public/
    index.html
    host.html
    player.html
    styles.css
  src/
    api-client.mjs
    event-stream-client.mjs
    render-player.mjs
    render-host.mjs
    ui-state.mjs
  test/
    ui-render.test.mjs
    ui-playtest.acceptance.test.mjs
```

If existing app structure differs, adapt while preserving boundaries.

## Player UI

Required panels:

- room/join panel;
- current scene panel;
- public feed panel;
- character summary panel;
- dice log panel;
- combat panel;
- recap panel after session completion.

### Player data source

Player UI must use only:

- player snapshot endpoint;
- player event stream;
- player command responses.

It must never call Host snapshot endpoints or read Host-only payloads.

## Host UI

Required panels:

- room creation panel;
- invite link panel;
- player list/presence panel;
- DM-only current scene panel;
- adventure controls;
- AI review queue panel;
- combat controls;
- session completion/recap panel.

### Host controls

Host should be able to issue these commands through UI:

- `room.create`;
- `adventure.load`;
- `session.start`;
- `scene.change`;
- `clue.reveal`;
- `ai.pause`;
- `host.review.update`;
- `combat.start`;
- `combat.attack` as Host override if needed;
- `combat.advance_turn`;
- `combat.patch_hp`;
- `combat.patch_condition`;
- `combat.end`;
- `session.complete`.

## Event updates

The UI should subscribe to the event stream if MVP-0.8C exists.

Fallback polling is acceptable only as a temporary test mode and must be documented.

On update:

1. receive broadcast or event-stream payload;
2. replace local snapshot with projected snapshot;
3. re-render relevant panels.

## UI safety

Player UI tests must assert that known fixture secret text does not appear in:

- initial page HTML;
- player snapshot JSON rendered output;
- player message feed;
- player recap;
- player combat/adventure panels.

Host UI may display DM-only data.

## Playtest acceptance

Add a simulated UI playtest that exercises:

1. Host creates room.
2. Two players join.
3. Players create characters.
4. Host loads demo adventure.
5. Host starts session.
6. Player sends investigation message.
7. Mock/local AI produces safe narration or Host-approved output.
8. Rules engine produces at least one check result.
9. Host reveals clue.
10. Host starts combat.
11. Player attack resolves through rules engine.
12. Host completes session.
13. Player and Host recap are visible.
14. Player-rendered content excludes known DM-only truth.

## Error handling

- Show user-readable errors for failed commands.
- Keep raw stack traces out of UI.
- If event stream disconnects, show reconnect status and allow manual snapshot refresh.
- If session is paused or AI is paused, show a Host-visible indicator.

## Accessibility and UX floor

MVP UI should be plain but usable:

- buttons have text labels;
- forms have labels;
- current turn is visually clear;
- error messages are visible;
- dangerous Host actions require explicit button press, not automatic execution.
