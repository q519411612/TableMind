# Web Play UI Playtest Runbook

## Goal

Validate whether the current local/internal Web Play UI is usable enough for one
Host and 2-4 players to complete a supervised one-shot demo.

This runbook is for human feedback collection. It does not claim production
readiness, public launch readiness, durable persistence, production auth, full
VTT readiness, or unsupervised AI DM operation.

## Preconditions

- Use Node 20 or newer.
- Keep mock/disabled provider mode as the default unless the run is explicitly
  scheduled as a supervised live-provider playtest.
- Do not record provider keys, session tokens, authorization headers, raw
  provider prompts, raw provider responses, or private player contact details.
- Start a fresh local playtest server before the run.
- Assign one person to take notes with
  `docs/playtests/WEB_PLAY_UI_FEEDBACK_TEMPLATE.md`.

## Start The Local Server

Use the README startup path:

```bash
npm run playtest
```

Or use the direct Node equivalent:

```bash
node scripts/start-playtest.mjs
```

The server prints the local base URL. For an explicit provider-disabled run, set
the flag before startup:

```bash
TABLEMIND_AI_PROVIDER_ENABLED=false npm run playtest
```

Or:

```bash
TABLEMIND_AI_PROVIDER_ENABLED=false node scripts/start-playtest.mjs
```

## Browser Windows

Open these windows from the same server base URL:

- Launchpad: `http://127.0.0.1:<port>/`
- Host Console: opened from the launchpad or
  `http://127.0.0.1:<port>/host.html`
- Player 1: invite link copied from the Host Console
- Player 2: invite link copied from the Host Console
- Optional Player 3 or Player 4: invite link copied from the Host Console
- Optional mobile/narrow viewport: open either Host Console or Player Room at a
  narrow width and repeat the highest-friction actions

Run once in English and once in Simplified Chinese when possible. Confirm
`?lang=` and the language switcher carry the intended locale.

## Watch For Every Action

For each action below, record whether:

- the Host or player knows what to do next;
- the narrative/public feed remains readable;
- the dice/rules log clearly explains formulas, DCs, totals, and outcomes;
- Host review is understandable without reading internal implementation details;
- combat controls are discoverable and operable;
- narrow/mobile viewports avoid horizontal overflow and unusable controls;
- Simplified Chinese fixed UI text does not render `undefined`;
- Player UI and Player DOM do not show Host-only content, DM-only notes, hidden
  truth, rejected AI output, raw state patches, Host review payloads,
  `host.review`, `state.patch`, or `host.override`.

## Playtest Path

1. Open the launchpad.
   - Confirm the page identifies the local/internal Web Play demo.
   - Confirm the Host and Player entry links are visible.
   - Watch for unclear production-sounding copy.

2. Open the Host Console.
   - Confirm the Host sees the create room form, language switcher, and next
     action guidance.
   - Watch for missing or ambiguous setup instructions.

3. Create a room.
   - Use a simple Host display name.
   - Confirm the Host Console shows room id, Host id, invite link, and copy/open
     invite controls.
   - Watch for confusing room identity or stale status messages.

4. Load the demo adventure.
   - Use the Host adventure load control.
   - Confirm the current scene renders with Host-only notes visually separated
     from public read-aloud text.
   - Watch for any claim that this is more than the local Lantern demo.

5. Copy the invite link.
   - Use the Host copy control and open the link for Player 1 and Player 2.
   - Confirm the invite link carries `roomId`.
   - Watch for copy feedback, broken links, or a need to manually type internal
     ids.

6. Join as Player 1 and Player 2.
   - Each player enters a display name.
   - Confirm the room id is prefilled from the invite link.
   - Confirm Player UI shows only player-safe panels.
   - Watch for Player UI references to Host-only notes, review payloads, hidden
     truth, or internal event names.

7. Create demo-ready characters.
   - Each player uses the create fighter/demo-ready character control.
   - Confirm the Player character panel shows name, class, level, AC, and HP.
   - Confirm the Host readiness panel updates.
   - Watch for players not knowing they must create a character before the Host
     starts.

8. Start the session.
   - Host starts the session once at least two players are ready.
   - Confirm Host and Player next-action guidance changes from lobby to play.
   - Watch for stale lobby copy or contradictory session state.

9. Run an AI DM turn.
   - Host uses the AI DM run control.
   - Confirm safe public narration appears in the feed only after validation.
   - Confirm any risky, low-confidence, reveal, or state-patch proposal waits
     for Host review.
   - Watch for players receiving spoiler-prone content before Host review.

10. Exercise Host review.
    - When a pending review item appears, read its status, risk, reason, public
      message, reveal proposals, state patch proposals, decision controls, and
      edit form.
    - Across the readiness batch, exercise approve, reject, and edit on pending
      review items. If the current run does not naturally create enough pending
      items, record the missing coverage instead of claiming it passed.
    - Confirm approved or edited public messages use the existing public commit
      path, rejected output stays private, and state patches remain manual Host
      actions.
    - Watch for decision wording that makes Host authority unclear.

11. Submit player actions.
    - Each player sends at least one action from the action composer.
    - Confirm the public feed identifies player actions and AI/system responses
      clearly.
    - Watch for players not knowing whether to wait for AI or act again.

12. Resolve a deterministic check.
    - Reach or trigger at least one skill, ability, or saving throw check.
    - Confirm the dice/rules log shows formula, modifiers, DC, result, and
      rules-engine source.
    - Confirm the AI does not fabricate dice or directly determine the outcome.
    - Watch for unclear success/failure presentation.

13. Reveal a clue.
    - Host reveals at least one clue through the Host controls.
    - Confirm Player feed uses player-safe clue copy and avoids raw hidden ids
      when a player-safe title is unavailable.
    - Watch for unrevealed clue text, hidden aliases, or DM-only truth appearing
      in Player UI.

14. Start combat.
    - Host starts the demo encounter.
    - Confirm Host and Player combat panels show round, active combatant, turn
      order, HP, AC, status, conditions, and available attacks.
    - Watch for unclear turn ownership or controls that are hard to tap on
      narrow screens.

15. Resolve a player attack.
    - On the active player's turn, use the Player attack form.
    - Confirm the target selector and attack button are derived from projected
      combat state.
    - Confirm attack, damage, resulting HP, and hit/miss output appear in the
      feed, combat panel, and dice/rules log.
    - Watch for players trying to attack when it is not their turn.

16. Patch HP or condition as Host.
    - Use Host HP patch or condition patch controls for one combatant.
    - Confirm the combat panel updates and the action is understandable as a
      manual Host override.
    - Watch for Host confusion about whether the AI or rules engine owns the
      change.

17. Advance turn.
    - Host advances the combat turn.
    - Confirm active combatant labels update in Host and Player views.
    - Watch for stale active-turn hints after refresh.

18. End combat.
    - Host ends combat.
    - Confirm the combat panel returns to no active combat and feed records the
      combat state change.
    - Watch for leftover attack controls or contradictory combat hints.

19. Complete the session.
    - Host completes the session with the demo ending.
    - Confirm phase and next-action guidance move to recap.
    - Watch for players still seeing play/combat prompts after completion.

20. View recaps.
    - Generate and view Player and Host recaps.
    - Confirm Player recap excludes DM-only truth, rejected AI output, private
      review payloads, raw state patches, and provider-private material.
    - Confirm Host recap can include Host-authorized unresolved threads.
    - Watch for recap usefulness feedback from both Host and players.

## Exit Criteria For This Runbook

A runbook pass means the team collected useful evidence about whether the
current local/internal Web Play UI is ready for another feedback iteration.

It does not mean the product is production-ready. Treat findings as input for
small follow-up UI fixes, documentation updates, no-leak regressions, or
operator-runbook changes.
