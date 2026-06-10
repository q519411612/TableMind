# Web UI Redesign Design

## Goal

TableMind should upgrade the current local browser demo UI from a text-first
playtest tool into an implementation-ready demo workspace for one Host and
2-4 players. The redesign should make the full demo path clearer without
weakening the existing safety boundaries.

The first redesign batch covers:

- local demo launchpad;
- Host room setup;
- Host play workspace;
- Host review workspace;
- Host combat workspace;
- Host recap view;
- player join and demo character creation;
- player exploration room;
- player combat room;
- player recap view.

The design is implementation-oriented. It is meant to guide later incremental
changes in the existing zero-dependency static web app, not to serve as a
marketing concept or a full visual prototype.

## Context

The current web app lives under `apps/web` and uses static HTML, CSS, and ES
modules. Host and player rendering are already split across `render-host.mjs`
and `render-player.mjs`, with transport handled through first-party API and
event stream clients.

The current UI can run the local demo path:

- Host creates a room and copies an invite link.
- Players join by link.
- Players create demo-ready characters.
- Host loads the Lantern demo adventure.
- Host starts the session.
- Players and Host see localized scene text.
- AI turns pass through Host review where required.
- Deterministic checks and combat are resolved through system commands.
- Recaps render after session completion.

The redesign must preserve the project invariants:

- The LLM is not the source of truth.
- Dice, checks, attacks, damage, initiative, HP, and combat turns remain
  deterministic rules operations.
- AI output cannot directly mutate session state.
- Host review remains mandatory for low-confidence AI output, spoiler risk,
  reveal proposals, and state patch proposals.
- Player snapshots, HTTP responses, SSE streams, player UI, and player recaps
  must not expose DM-only secrets, rejected AI output, private review payloads,
  or raw state patches.
- Fixed UI text must support `en` and `zh-CN`.
- Authored gameplay text should use explicit localized fields when present and
  otherwise preserve canonical authored text.

## Approaches Considered

### Recommended: flow workspace redesign

Organize the UI around the demo run flow instead of a flat collection of
panels. The Host gets a workflow-oriented control console, while players get a
light tabletop room focused on scene, action, character status, and public
history.

Trade-offs:

- Best fit for an internal demo that needs to be run reliably.
- Gives future implementation tasks clear page and component boundaries.
- Improves usability without adding a framework or full VTT scope.
- Requires reorganizing render structure and CSS beyond simple visual polish.

### Alternate: panel polish only

Keep the existing panel order and improve spacing, colors, empty states, and
button grouping.

Trade-offs:

- Fastest implementation path.
- Lowest risk of changing current tests.
- Does not materially improve Host flow guidance or player action clarity.

### Alternate: light immersive player room

Make the player view more game-like with stronger scenic framing while keeping
Host as a control console.

Trade-offs:

- Better presentation value.
- Higher implementation cost.
- Easier to drift toward visual features outside MVP scope.

## Scope

### Included

- Information architecture for the full local demo path.
- Page-level layout guidance for Host and player views.
- State-specific UI behavior for setup, exploration, review, combat, and recap.
- Component inventory for incremental implementation.
- Responsive layout rules for desktop, tablet, and mobile.
- Bilingual UI text requirements for `en` and `zh-CN`.
- Verification requirements, especially player no-leak coverage.

### Not Included

- No production authentication or accounts.
- No durable database or multi-process room runtime.
- No marketplace, public adventure sharing, payments, or deployment work.
- No full VTT map, token movement, fog of war, dynamic lighting, or 3D scene.
- No full character builder.
- No provider configuration UI.
- No live provider dependency in default UI tests.
- No runtime machine translation.
- No marketing landing page.

## Design Principles

### Flow before panels

The demo UI should answer what happens next. Host and player views should
surface the current run state and the next useful action before logs and
secondary details.

### Role-specific density

Host views may be denser because the Host supervises the room, reviews AI
output, and fixes issues. Player views should be lighter and focused on
understanding the scene and choosing an action.

### Safety by layout

Visibility boundaries should be apparent in the design. Player pages should not
have components that expect Host-only data. Host-only review payloads, DM notes,
and private management records should live in Host-specific areas.

### Existing architecture first

The design should fit the current static app. Future implementation should
prefer first-party render helpers and API clients over new production
dependencies.

### Demo clarity over feature breadth

The UI should make the current 60-90 minute one-shot demo more reliable. It
should not expand TableMind into a generic VTT or campaign manager.

## Page Map

```txt
Index Launchpad
  -> Host Room Setup
  -> Player Join/Create

Host
  Host Room Setup
  Host Play Workspace
  Host Review Workspace
  Host Combat Workspace
  Host Recap View

Player
  Player Join/Create
  Player Exploration Room
  Player Combat Room
  Player Recap View
```

## Demo Flow

The UI should support this main path:

1. User opens the local launchpad.
2. Host opens the Host console and creates a room.
3. Host copies the invite link.
4. Players open the invite link and join.
5. Players create demo characters.
6. Host loads the demo adventure.
7. Host starts the session.
8. Players read the current scene and describe actions.
9. Host runs or supervises AI turns.
10. Host reviews risky AI output before anything public is committed.
11. Deterministic checks and dice results appear in public logs.
12. Host reveals clues when appropriate.
13. Host starts combat.
14. Players resolve attacks only through combat commands.
15. Host advances or patches combat as needed.
16. Host completes the session.
17. Player and Host recap views render with role-appropriate content.

## Shared Shell

### Topbar

The topbar should appear on all pages and include:

- TableMind label or current room ID;
- current viewer role;
- language switcher;
- connection or refresh state;
- compact status message area.

Host topbar may include room ID, Host name, invite action, and AI status.
Player topbar may include room ID, player display name, and current phase.

### Status Messages

The shell should reserve consistent locations for:

- command success notices;
- user-readable command errors;
- event stream reconnect status;
- next-step hints.

Raw stack traces and raw provider errors must not be shown in the browser UI.

### Language Behavior

The redesign must preserve existing `?lang=` and localStorage behavior. New
fixed labels, button text, empty states, error messages, flow hints, review
headings, combat headings, and recap headings must be added for both `en` and
`zh-CN`.

## Index Launchpad

### Purpose

The launchpad is a local demo entry point. It should help testers start the
right view quickly. It should not be a marketing homepage.

### Layout

- Topbar with language switcher.
- Primary action area with Host and Player entry actions.
- Small local demo status area showing expected server/API connection.
- Optional recent room recovery if room data exists in localStorage.

### Primary Actions

- Open Host console.
- Join as Player using a room link or room ID.
- Refresh local server status.

### Data Sources

- Browser URL parameters.
- localStorage for remembered locale and recent session details.
- Public playtest config only.

### States

- Server config loaded.
- Server config failed.
- Recent Host room available.
- Recent player session available.

## Host Room Setup

### Purpose

Help the Host create a room, invite players, and get the room ready without
typing internal IDs.

### Layout

Desktop Host setup should use three zones:

- left progress rail with room setup and readiness state;
- center setup workspace with create room, invite link, and adventure controls;
- right monitor rail with players, AI status, and recent system events.

### Primary Content

- Host display name input.
- Create room action.
- Invite link with copy and open actions.
- Player readiness list.
- Demo adventure load action.
- Start session action.

### States

- No active room.
- Room created, no players.
- Players joined, missing characters.
- Players ready, adventure not loaded.
- Adventure loaded, ready to start.
- Session started.

### Data Sources

- Host room create response.
- Host snapshot.
- Host adventure snapshot.
- Host command results.

### Safety Notes

Invite information is shareable, but Host session tokens must never be copied
into player-visible UI. Player readiness should use display names and character
names rather than raw internal IDs wherever possible.

## Host Play Workspace

### Purpose

Give the Host one clear place to supervise exploration, scene changes, clue
reveals, and AI status.

### Layout

The workspace should keep the three-zone Host layout:

- left progress rail with the current run state;
- center scene workspace;
- right monitor rail with player, AI, dice, and event summaries.

### Center Scene Workspace

The center area should include:

- current scene title;
- public read-aloud text;
- DM notes in a clearly Host-only block;
- truth or secret summaries in a Host-only block;
- revealed clue list;
- unrevealed clue controls;
- scene change control;
- run AI turn action;
- pause or resume AI action.

### States

- Adventure not loaded.
- Session not started.
- Exploration active.
- AI paused.
- Review required.
- Combat active.
- Session ended.

### Data Sources

- Host snapshot.
- Host adventure snapshot.
- Host review queue.
- Host recap endpoint after completion.

### Safety Notes

DM notes, truth entries, hidden clue data, and review payloads must stay inside
Host-only components. The visual design should label these areas as Host-only
without reusing them in player renderers.

## Host Review Workspace

### Purpose

Make AI review fast and auditable. When pending review exists, the Host should
see it as the most urgent workspace item.

### Layout

Pending review should appear in the center workspace. The progress rail should
highlight review required. The monitor rail may show the count of pending review
items.

Each review card should include:

- review type;
- risk level;
- trigger reason;
- proposed public message;
- reveal proposal summary;
- state patch proposal summary;
- commit scope;
- approve action;
- edit action;
- reject action.

### Edit Behavior

The edit form should make it clear that edited content is not public until the
Host submits it. It should preserve the review audit trail while only committing
approved public content through existing Host review and public message
commands.

### States

- No pending review.
- One pending review.
- Multiple pending reviews.
- Review approved.
- Review edited and approved.
- Review rejected.
- Review command failed.

### Data Sources

- Host review queue endpoint.
- Host snapshot after review update.
- Review commit helper response.

### Safety Notes

Rejected output and private review payloads must never be rendered by player
views, player event streams, player recaps, or public feeds. State patch
proposal details should remain Host-only unless committed through explicit
rules or Host override events.

## Host Combat Workspace

### Purpose

Give the Host a compact combat control surface that makes turn order, active
combatant, HP, conditions, and override controls obvious.

### Layout

The center workspace should prioritize:

- combat round;
- active combatant;
- turn order;
- combatant rows with display name, side, HP, AC, conditions, and status;
- recent attack or damage result;
- advance turn action;
- HP patch form;
- condition add or remove form;
- end combat action.

The monitor rail may show recent dice and combat events.

### States

- No active combat.
- Encounter can be started.
- Combat active.
- Active combatant defeated.
- Host patch pending or failed.
- Combat ended.

### Data Sources

- Host snapshot combat projection.
- Host combat command responses.
- Public dice and event logs.

### Safety Notes

Combat outcomes must come from deterministic rules operations. The UI may send
commands and render results, but it must not calculate authoritative combat
outcomes in the browser.

## Host Recap View

### Purpose

Show the Host the completed session summary with management context separated
from player-visible recap content.

### Layout

The Host recap view should include:

- completion status;
- player-safe session recap preview;
- Host-only management summary;
- important review decisions;
- combat and check highlights;
- copy or refresh recap actions if supported by current endpoints.

### Data Sources

- Host snapshot.
- Host recap endpoint.
- Host event log.

### Safety Notes

Host-only recap content may include Host interventions and review decisions.
Player recap content must remain separate and must not include rejected AI
output, private review payloads, raw state patches, or DM-only secrets.

## Player Join/Create

### Purpose

Help a player enter the room and create a demo-ready character with minimal
friction.

### Layout

Before join, player view should show:

- room ID or invite-derived room ID;
- display name input;
- join action;
- language switcher;
- friendly connection or command error.

After join but before character creation, player view should show:

- joined status;
- create demo character action;
- waiting-for-Host hint;
- party readiness summary if available in the player projection.

### States

- Missing room ID.
- Ready to join.
- Join command failed.
- Joined without character.
- Character created.
- Waiting for Host to start.

### Data Sources

- URL room ID.
- Player join response.
- Player snapshot.
- Player session token stored in localStorage.

### Safety Notes

The player page should never request or render Host snapshots. Character
creation should use existing demo preset behavior until a future character
builder is explicitly scoped.

## Player Exploration Room

### Purpose

Make the player's normal play state clear: where they are, what they know, what
they can do, and what just happened.

### Layout

Desktop player exploration should use two columns:

- main scene and action column;
- side status column.

The main column should include:

- current scene title;
- public scene text;
- revealed clues;
- next action hint;
- player action composer;
- recent public narration and system results.

The side column should include:

- own character summary;
- party status;
- current phase;
- dice log summary;
- known combat or room state.

### States

- Waiting for Host.
- Exploration active.
- AI paused from Host perspective, if represented in player-safe text.
- Command failed.
- Event stream reconnecting.

### Data Sources

- Player snapshot.
- Player adventure snapshot.
- Player event stream.
- Player command responses.

### Safety Notes

Player exploration must use only player-projected APIs and snapshots. It must
not display hidden clue IDs, hidden NPC IDs, hidden encounter IDs, DM notes,
truth entries, Host review payloads, or raw state patch details.

## Player Combat Room

### Purpose

Let players understand combat and act when it is their turn without exposing
Host controls.

### Layout

When combat is active, the player main column should prioritize:

- current round and active combatant;
- clear turn status for the current player;
- target selection when the current player can act;
- attack action;
- recent attack result.

The side column should include:

- own HP and AC;
- visible combatants;
- turn order;
- public dice log;
- public combat feed.

### States

- Combat active, not current player's turn.
- Combat active, current player's turn.
- No valid target.
- Attack command failed.
- Attack resolved.
- Combat ended.

### Data Sources

- Player snapshot combat projection.
- Player combat command responses.
- Public dice and event logs.

### Safety Notes

The player UI must not expose hidden encounter data beyond the current
player-safe combat projection. The browser must not calculate hit, damage, HP,
or combat turn outcomes as authoritative state.

## Player Recap View

### Purpose

Give players a clean summary of what happened after the session ends.

### Layout

The recap view should include:

- session ending title or status;
- public story summary;
- public clue and discovery summary;
- public check and combat highlights;
- character outcome summary if available.

### Data Sources

- Player snapshot phase.
- Player recap endpoint.

### Safety Notes

Player recap must exclude DM-only secrets, rejected AI output, private review
payloads, raw state patches, and hidden unrevealed content.

## Component Inventory

Implementation can be split around these component concepts. The current app
may keep module-level render helpers rather than framework components.

### Shell and Navigation

- `IndexLaunchpad`
- `HostShell`
- `PlayerShell`
- `Topbar`
- `LanguageSwitcher`
- `ConnectionStatus`
- `CommandNotice`
- `CommandError`
- `NextStepNotice`

### Flow Components

- `DemoProgressRail`
- `PhaseBadge`
- `ReadinessMeter`
- `CurrentTaskPanel`

### Room Components

- `CreateRoomPanel`
- `InvitePanel`
- `JoinPanel`
- `PlayerReadinessList`
- `DemoCharacterPrompt`

### Scene Components

- `ScenePanel`
- `DmNotePanel`
- `TruthPanel`
- `RevealedClueList`
- `RevealClueControls`
- `SceneChangeControls`

### Action Components

- `PlayerActionComposer`
- `PublicFeed`
- `AuditFeed`
- `DiceLog`

### Review Components

- `AiStatusPanel`
- `ReviewQueue`
- `ReviewCard`
- `ReviewPayloadSummary`
- `ReviewEditForm`

### Combat Components

- `CombatSummary`
- `TurnOrder`
- `CombatantRow`
- `PlayerAttackControl`
- `HostCombatControls`
- `HpPatchForm`
- `ConditionPatchForm`

### Recap Components

- `RecapView`
- `HostRecapNotes`
- `PlayerRecapSummary`

## Responsive Rules

### Desktop

Host desktop should use three zones:

- left progress rail;
- center current workspace;
- right monitor rail.

Player desktop should use two zones:

- main scene and action column;
- side character and status column.

### Tablet

Host tablet may collapse the monitor rail below the center workspace and turn
the progress rail into a horizontal run state bar.

Player tablet may keep two columns when width allows, then collapse side status
below the action area.

### Mobile

Mobile views should use one column. Ordering should be:

1. current state;
2. primary action;
3. character or combat status;
4. feed and logs;
5. secondary controls.

Player action input and player combat actions must appear before long logs.
Host review actions must remain close to the reviewed content.

### Text Fitting

All fixed UI text must fit in English and Simplified Chinese. Buttons should
allow wrapping or use shorter labels where needed. Long room IDs, invite links,
review reasons, and recap text must wrap without overlapping adjacent controls.

## Visual System

### Tone

Host should feel like a calm control console. Player should feel like a light
tabletop room. Both should share the same base design language.

### Color

The current green action color can remain the main action color. The redesign
should add restrained supporting colors:

- green for primary actions and ready states;
- amber for warnings, review attention, and paused states;
- red for destructive or failed states;
- blue or neutral cool tones for connection and informational state;
- neutral surfaces and borders for panels.

The palette should avoid becoming a one-hue green theme. It should also avoid
large purple gradients, dark full-screen slate, and decorative background
orbs.

### Shape and Spacing

Cards and panels should keep 6-8px radius. Page sections should not be nested
inside decorative cards. Repeated items such as review cards, combatant rows,
and feed entries may use cards.

### Typography

Host typography should be compact and scannable. Player scene headings and
current action hints may be more prominent, but the UI should avoid oversized
hero typography inside app workspaces.

## Error Handling

The UI should show user-readable messages for:

- failed room creation;
- failed player join;
- failed character creation;
- failed adventure load;
- failed session start;
- failed message send;
- failed AI turn;
- failed review update;
- failed combat start;
- failed attack;
- failed HP or condition patch;
- failed recap fetch;
- event stream disconnect or reconnect.

Errors should preserve the existing typed command result model where possible.
Browser UI should not display raw stack traces, provider credentials,
authorization headers, session tokens, or raw private provider payloads.

## Testing and Verification

Future implementation should update or add tests for:

- Host render states for setup, exploration, review, combat, and recap.
- Player render states for join, character creation, exploration, combat, and
  recap.
- `en` and `zh-CN` fixed labels for new UI text.
- Player render no-leak coverage for known fixture secrets.
- Player recap no-leak coverage.
- Player event stream content remains role-projected.
- Host review rendering does not appear in player UI.
- Combat actions render only when allowed by projected state.
- Responsive markup does not depend on hidden Host-only data.

Recommended verification commands for the implementation slice:

```bash
npm run check
npm test
npm run acceptance
npm run build
TABLEMIND_AI_PROVIDER_ENABLED=false npm run smoke:playtest
```

If the local environment lacks Node 20+ or npm, the final implementation report
should include the exact command that could not run, observed versions, and the
reason.

## Migration Strategy

Implementation should be incremental:

1. Add shared layout and status helpers without changing command behavior.
2. Redesign Host setup and player join screens.
3. Redesign Host play workspace and player exploration room.
4. Redesign Host review workspace.
5. Redesign Host and player combat workspaces.
6. Redesign recap views.
7. Tighten responsive and bilingual coverage.
8. Run full acceptance and smoke verification.

Each implementation slice should preserve existing transport contracts and
role-aware projections.

## Acceptance Criteria

- The design covers the complete local demo path from launchpad to recap.
- Host and player information architecture are distinct and role-appropriate.
- Every page identifies its primary data sources.
- Player pages are explicitly limited to player-projected data.
- Host-only review, DM notes, truth, and management records remain Host-only.
- Combat UI is display and command oriented, with authoritative outcomes
  delegated to deterministic rules operations.
- Fixed UI text requirements include both `en` and `zh-CN`.
- Responsive behavior is defined for desktop, tablet, and mobile.
- Deferred features are explicitly out of scope.

## Implementation Planning Notes

- The launchpad should build on the existing `index.html` entry rather than add
  a separate route.
- Host progress rail and monitor rail should start as small render helpers, then
  be introduced page by page as each Host workspace is redesigned.
- UI tests should prefer visible copy, role-safe rendered content, and stable
  `data-*` hooks over brittle layout class assertions.
