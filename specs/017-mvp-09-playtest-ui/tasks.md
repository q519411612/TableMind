# 017 MVP-0.9 Playtest UI - Tasks

## MVP-0.9A player UI skeleton

### App shell

- [ ] Decide zero-dependency static UI vs minimal framework and document rationale.
- [ ] Add player HTML entry point.
- [ ] Add shared CSS.
- [ ] Add API client module over MVP-0.8 endpoints.
- [ ] Add event stream client module.

### Player panels

- [ ] Implement join form.
- [ ] Implement current scene panel.
- [ ] Implement public message feed.
- [ ] Implement character summary panel.
- [ ] Implement dice log panel.
- [ ] Implement combat panel.
- [ ] Implement recap panel.

### Player actions

- [ ] Join room.
- [ ] Send public message.
- [ ] Create MVP character or select fixture character.
- [ ] Attack in combat if active and authorized.
- [ ] Refresh snapshot.

### Player safety tests

- [ ] Test player renderer with fixture snapshot.
- [ ] Assert known DM-only truth does not appear in player render output.
- [ ] Assert player UI does not call Host endpoints.

## MVP-0.9B Host UI controls

### Host panels

- [ ] Add Host HTML entry point.
- [ ] Implement room creation panel.
- [ ] Implement invite link panel.
- [ ] Implement player list/presence panel.
- [ ] Implement DM-only scene panel.
- [ ] Implement clue reveal controls.
- [ ] Implement scene change controls.
- [ ] Implement AI pause/resume indicator and control.
- [ ] Implement Host review queue panel.
- [ ] Implement combat controls.
- [ ] Implement session complete/recap panel.

### Host actions

- [ ] Create room.
- [ ] Load demo adventure.
- [ ] Start session.
- [ ] Change scene.
- [ ] Reveal clue.
- [ ] Pause/resume AI.
- [ ] Approve/edit/reject review item.
- [ ] Start encounter.
- [ ] Patch combatant HP.
- [ ] Patch combatant condition.
- [ ] Advance turn.
- [ ] End combat.
- [ ] Complete session.

### Host tests

- [ ] Test Host renderer includes DM-only scene details when provided Host snapshot.
- [ ] Test Host action client calls expected command types.
- [ ] Test review queue rendering and update actions.

## MVP-0.9C UI playtest acceptance

- [ ] Add simulated browser/local UI playtest acceptance.
- [ ] Complete demo flow with Host and two players using mock/local AI.
- [ ] Assert player-rendered output excludes known DM-only truth.
- [ ] Assert Host-rendered output can include DM-only truth.
- [ ] Assert recap appears for player and Host.
- [ ] Assert no full VTT features are required for completion.

## Verification

- [ ] Run `npm run check`.
- [ ] Run `npm test`.
- [ ] Run `npm run acceptance`.
- [ ] Run `npm run build`.

## Deferrals

- [ ] Do NOT implement full map/token/fog/lighting.
- [ ] Do NOT implement full character builder.
- [ ] Do NOT implement PDF import.
- [ ] Do NOT implement marketplace/public adventure sharing.
- [ ] Do NOT require live AI provider calls in MVP-0.9.
