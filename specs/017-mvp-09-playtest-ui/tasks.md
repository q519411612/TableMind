# 017 MVP-0.9 Playtest UI - Tasks

## MVP-0.9A player UI skeleton

### App shell

- [x] Decide zero-dependency static UI vs minimal framework and document rationale.
- [x] Add player HTML entry point.
- [x] Add shared CSS.
- [x] Add API client module over MVP-0.8 endpoints.
- [x] Add event stream client module.

### Player panels

- [x] Implement join form.
- [x] Implement current scene panel.
- [x] Implement public message feed.
- [x] Implement character summary panel.
- [x] Implement dice log panel.
- [x] Implement combat panel.
- [x] Implement recap panel.

### Player actions

- [x] Join room.
- [x] Send public message.
- [x] Create MVP character or select fixture character.
- [x] Attack in combat if active and authorized.
- [x] Refresh snapshot.

### Player safety tests

- [x] Test player renderer with fixture snapshot.
- [x] Assert known DM-only truth does not appear in player render output.
- [x] Assert player UI does not call Host endpoints.

## MVP-0.9B Host UI controls

### Host panels

- [x] Add Host HTML entry point.
- [x] Implement room creation panel.
- [x] Implement invite link panel.
- [x] Implement player list/presence panel.
- [x] Implement DM-only scene panel.
- [x] Implement clue reveal controls.
- [x] Implement scene change controls.
- [x] Implement AI pause/resume indicator and control.
- [x] Implement Host review queue panel.
- [x] Implement combat controls.
- [x] Implement session complete/recap panel.

### Host actions

- [x] Create room.
- [x] Load demo adventure.
- [x] Start session.
- [x] Change scene.
- [x] Reveal clue.
- [x] Pause/resume AI.
- [x] Approve/edit/reject review item.
- [x] Start encounter.
- [x] Patch combatant HP.
- [x] Patch combatant condition.
- [x] Advance turn.
- [x] End combat.
- [x] Complete session.

### Host tests

- [x] Test Host renderer includes DM-only scene details when provided Host snapshot.
- [x] Test Host action client calls expected command types.
- [x] Test review queue rendering and update actions.

## MVP-0.9C UI playtest acceptance

- [x] Add simulated browser/local UI playtest acceptance.
- [x] Complete demo flow with Host and two players using mock/local AI.
- [x] Assert player-rendered output excludes known DM-only truth.
- [x] Assert Host-rendered output can include DM-only truth.
- [x] Assert recap appears for player and Host.
- [x] Assert no full VTT features are required for completion.

## Verification

Latest verification in this workspace used a Node 20+ executable directly because `npm` is not installed.

- [x] Run `node scripts/check-js.mjs`.
- [x] Run `node scripts/run-tests.mjs packages apps tests`.
- [x] Run `node scripts/run-tests.mjs tests/acceptance`.
- [ ] Run `npm run build`; not runnable in this workspace because `npm` is unavailable. The equivalent build script commands passed.

## Deferrals

- [x] Do NOT implement full map/token/fog/lighting.
- [x] Do NOT implement full character builder.
- [x] Do NOT implement PDF import.
- [x] Do NOT implement marketplace/public adventure sharing.
- [x] Do NOT require live AI provider calls in MVP-0.9.
