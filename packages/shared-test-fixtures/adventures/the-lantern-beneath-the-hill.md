# Adventure: The Lantern Beneath the Hill

## Metadata
id: adventure_lantern_beneath_hill
rulesetId: 5e-srd-5.2.1
recommendedLevel: 1
playerCount: 2-4
estimatedTime: 60-90 minutes
startingSceneId: scene_village_square

## Synopsis
The village lantern that protects the old hill road has gone dark before a storm. The party investigates the lantern tower, discovers signs of a buried shrine, and decides whether to repair the light, free the voice beneath it, or flee before nightfall.

## Truth
### Secret: Broken Seal
id: secret_broken_seal
Mira, a frightened apprentice, broke the shrine seal while searching for her missing sibling. The spirit beneath the hill is not evil, but it is using the dead lantern to draw help.

## Scene: Village Square
id: scene_village_square
### Read Aloud
The village square smells of wet rope, chimney smoke, and rain on stone. Above the roofs, the hill road is dark where the lantern should be burning.
### DM Notes
Mayor Elric wants the party moving before the storm arrives. He omits the old shrine record unless pressed.
### Clues
- clue_old_record
### NPCs
- npc_mayor_elric

## Scene: Mayor's House
id: scene_mayors_house
### Read Aloud
Stacks of damp ledgers crowd the mayor's table. A single shutter bangs whenever the wind turns.
### DM Notes
The old record is hidden in a locked drawer. A successful investigation check finds scrape marks by the drawer pull.
### Clues
- clue_old_record
- clue_miras_charm
### NPCs
- npc_mayor_elric

## Scene: Old Hill Road
id: scene_old_hill_road
### Read Aloud
The hill road climbs between leaning pines. Pale motes drift in the ditch, bright for a heartbeat and gone the next.
### DM Notes
Small muddy footprints lead toward the lantern tower and away from the road.
### Clues
- clue_small_footprints
- clue_goblin_scrap_map
### NPCs
- npc_old_kett

## Scene: Lantern Tower
id: scene_lantern_tower
### Read Aloud
The lantern tower squats against the black sky. Its glass lens is cracked, and cold soot rings the metal frame.
### DM Notes
The hatch below the tower can be opened after the party notices the soot pattern or the symbol under the frame.
### Clues
- clue_broken_lens
- clue_symbol_under_hatch
### NPCs
- npc_mira
### Encounter
encounter_hill_scavengers

## Scene: Buried Shrine
id: scene_buried_shrine
### Read Aloud
Stone steps descend under the tower into a round chamber where a blue flame whispers inside a cracked bowl.
### DM Notes
The spirit asks for release, but repairing the seal is safer if the party has not learned Mira's reason.
### Clues
- clue_whispered_phrase
### NPCs
- npc_whisper_in_flame

## NPC: Mayor Elric
id: npc_mayor_elric
### Public
A nervous village leader with ink-stained sleeves and a rehearsed smile.
### DM Notes
He knows the lantern was built over an older shrine but fears panic if the story spreads.

## NPC: Mira
id: npc_mira
### Public
A young apprentice with muddy boots, red eyes, and a habit of glancing toward the hill.
### DM Notes
She broke the seal while searching for her sibling and is terrified the village will blame her.

## NPC: Old Kett
id: npc_old_kett
### Public
The road keeper speaks slowly and carries a lantern hook worn smooth by years of use.
### DM Notes
Kett knows the old warning phrase but thinks it is only a work song.

## NPC: Whisper in the Flame
id: npc_whisper_in_flame
### Public
A voice flickers in the blue flame, gentle one moment and desperate the next.
### DM Notes
The spirit is bound to warn travelers away from the sealed chamber, but loneliness has warped its judgment.

## Clue: Old Record
id: clue_old_record
visibility: dm_only
sourceSceneId: scene_mayors_house
### Text
An old ledger says the lantern was raised to mark a sealed shrine, not merely to guide travelers.

## Clue: Mira's Dropped Charm
id: clue_miras_charm
visibility: dm_only
sourceSceneId: scene_mayors_house
### Text
A clay charm with Mira's initials is wedged behind the mayor's drawer.

## Clue: Small Footprints
id: clue_small_footprints
visibility: dm_only
sourceSceneId: scene_old_hill_road
### Text
Small muddy footprints circle the tower and vanish near a loose stone.

## Clue: Goblin Scrap Map
id: clue_goblin_scrap_map
visibility: dm_only
sourceSceneId: scene_old_hill_road
### Text
A torn scrap marks the tower hatch and a safer path through the pines.

## Clue: Broken Lantern Lens
id: clue_broken_lens
visibility: dm_only
aliases: hatch, hidden hatch, tower hatch, hatch below the tower
sourceSceneId: scene_lantern_tower
### Text
The cracked lens is blackened from the inside, and the soot curls toward a hidden hatch.

## Clue: Symbol Under Hatch
id: clue_symbol_under_hatch
visibility: dm_only
sourceSceneId: scene_lantern_tower
### Text
A worn symbol under the hatch matches the mark in the mayor's ledger.

## Clue: Whispered Phrase
id: clue_whispered_phrase
visibility: dm_only
sourceSceneId: scene_buried_shrine
### Text
The flame repeats Kett's old work song as a warning: mend the light, mind the door.

## Encounter: Hill Scavengers
id: encounter_hill_scavengers
visibility: dm_only
### Public Setup
Two wiry scavengers burst from behind fallen stones, more frightened than bold.
### DM Notes
They try to flee if one is defeated or if the party offers food and a way out.
### Combatants
- monster_hill_scavenger x2

## Ending: Repair the Lantern
id: ending_repair_lantern
### Public
The lantern catches with a warm gold flame, and the hill road shines clear before the storm breaks.
### DM Notes
The shrine remains sealed, and Mira owes the party the truth.

## Ending: Free the Spirit
id: ending_free_spirit
### Public
The blue flame rises like breath on glass, then scatters into the rain as the chamber falls silent.
### DM Notes
The road is safe, but the village must learn to guard the open shrine.

## Ending: Bargain with the Spirit
id: ending_bargain_spirit
### Public
The lantern burns blue for one night, and the voice promises guidance at a price yet unnamed.
### DM Notes
Use this ending if the party chooses trust over repair.

## Ending: Fail Before the Storm
id: ending_fail_storm
### Public
The storm swallows the hill road, and the village wakes to fresh lights moving beneath the tower.
### DM Notes
This ending leaves the mystery unresolved for a later session.
