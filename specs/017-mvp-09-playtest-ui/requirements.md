# 017 MVP-0.9 Playtest UI - Requirements

## Goal

Build the smallest browser UI that lets one Host and 2–4 players complete the demo one-shot using the local transport and mock/local AI behavior.

The UI should prove the product loop, not attempt to become a full VTT.

## User stories

### Story 1: Host can start a playtest room

As a Host, I want to create a room, load the demo adventure, invite players, and start the session, so that I can run a short playtest.

#### Acceptance criteria

- WHEN Host opens the app THEN Host can create a room.
- WHEN room is created THEN Host sees room ID and invite link.
- WHEN Host loads the demo adventure THEN Host sees DM-only current scene details.
- WHEN enough players have joined THEN Host can start the session.

### Story 2: Player can join and play

As a player, I want to join through an invite link, create or select a simple character, and see the current public scene, so that I can play without reading the backend logs.

#### Acceptance criteria

- WHEN player opens invite link THEN player can enter display name.
- WHEN player joins THEN player sees only player-safe snapshot data.
- WHEN player creates a character THEN the character summary appears.
- WHEN public messages, dice, scenes, or combat state change THEN the player UI updates.

### Story 3: Host can supervise AI and adventure flow

As a Host, I want to reveal clues, change scenes, approve/edit/reject AI output, and control combat, so that AI errors can be corrected quickly.

#### Acceptance criteria

- WHEN a clue is relevant THEN Host can reveal it.
- WHEN party moves location THEN Host can change scene.
- WHEN AI output is pending review THEN Host can approve, edit, or reject it.
- WHEN combat starts THEN Host can start encounter, patch HP/conditions, advance turns, and end combat.
- WHEN session ends THEN Host can complete session and view recap.

## Functional requirements

1. Add minimal player room UI.
2. Add minimal Host room UI.
3. Use MVP-0.8 transport/command APIs only; no direct imports of server room state into client code.
4. Keep player and Host data flows separate.
5. Render current scene, messages, dice log, characters, combat, and recap.
6. Add UI playtest acceptance with mock/local engine completing the demo adventure.
7. Add explicit no-DM-leak assertions for player-rendered content.

## Non-goals

- Full map grid.
- Token movement.
- Fog of war.
- Dynamic lighting.
- 3D dice.
- Full character builder.
- Mobile-perfect responsive design.
- Public account/auth flows.
- PDF import.
- Marketplace or public adventure sharing.
