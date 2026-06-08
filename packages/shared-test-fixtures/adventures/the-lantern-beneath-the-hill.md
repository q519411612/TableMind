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

## Locale: zh-CN
title: 山丘下的灯火

### Synopsis
村庄灯火守护着旧山路，却在暴风雨前熄灭了。队伍调查灯塔，发现被掩埋神龛的痕迹，并决定修复灯火、释放灯下的声音，或在夜幕降临前撤离。

## Truth
### Secret: Broken Seal
id: secret_broken_seal
Mira, a frightened apprentice, broke the shrine seal while searching for her missing sibling. The spirit beneath the hill is not evil, but it is using the dead lantern to draw help.
### Locale: zh-CN
title: 破损封印

#### Text
惊慌的学徒米拉在寻找失踪手足时打破了神龛封印。山丘下的灵魂并非邪恶，但它正利用熄灭的灯火引来援助。

## Scene: Village Square
id: scene_village_square
### Read Aloud
The village square smells of wet rope, chimney smoke, and rain on stone. Above the roofs, the hill road is dark where the lantern should be burning.
### DM Notes
Mayor Elric wants the party moving before the storm arrives. He omits the old shrine record unless pressed.
### Locale: zh-CN
title: 村庄广场

#### Read Aloud
村庄广场弥漫着潮湿的绳索、烟囱炊烟，以及雨水敲在石面上的气味。屋顶上方，旧山路本该有灯火燃烧的地方一片漆黑。

#### DM Notes
艾瑞克镇长希望队伍在暴风雨抵达前动身。除非被追问，否则他不会提起旧神龛记录。
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
### Locale: zh-CN
title: 镇长宅邸

#### Read Aloud
一摞摞潮湿账本挤满镇长的桌面。风向一变，唯一那扇百叶窗就砰砰作响。

#### DM Notes
旧记录藏在上锁抽屉里。一次成功的调查检定会发现抽屉拉手旁的刮痕。
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
### Locale: zh-CN
title: 旧山路

#### Read Aloud
山路在倾斜的松树之间向上延伸。苍白光点在沟渠里飘浮，亮起一瞬，又在下一瞬消失。

#### DM Notes
小小的泥脚印离开道路，朝灯塔方向延伸。
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
### Locale: zh-CN
title: 灯塔

#### Read Aloud
灯塔低伏在漆黑天空下。玻璃灯镜已经破裂，冰冷煤灰在金属框上绕成一圈。

#### DM Notes
队伍注意到煤灰纹路或框架下的符号后，可以打开灯塔下方的活板门。
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
### Locale: zh-CN
title: 地下神龛

#### Read Aloud
石阶从塔下向下延伸，通往一间圆形密室。裂开的石碗里，一簇蓝色火焰正低声絮语。

#### DM Notes
灵魂请求释放，但如果队伍尚未了解米拉的动机，修复封印会更安全。
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
### Locale: zh-CN
title: 艾瑞克镇长

#### Public
一位紧张的村庄领袖，袖口沾着墨迹，脸上挂着排练过的笑容。

#### DM Notes
他知道灯塔建在一座更古老的神龛之上，但害怕真相传开后引发恐慌。

## NPC: Mira
id: npc_mira
### Public
A young apprentice with muddy boots, red eyes, and a habit of glancing toward the hill.
### DM Notes
She broke the seal while searching for her sibling and is terrified the village will blame her.
### Locale: zh-CN
title: 米拉

#### Public
一名年轻学徒，靴子沾满泥，眼眶发红，总忍不住看向山丘。

#### DM Notes
她在寻找手足时打破了封印，害怕村民会因此责怪她。

## NPC: Old Kett
id: npc_old_kett
### Public
The road keeper speaks slowly and carries a lantern hook worn smooth by years of use.
### DM Notes
Kett knows the old warning phrase but thinks it is only a work song.
### Locale: zh-CN
title: 老凯特

#### Public
这位守路人说话很慢，随身带着一根被多年使用磨得光滑的提灯钩。

#### DM Notes
凯特知道那句古老警语，却以为它只是一首劳作歌。

## NPC: Whisper in the Flame
id: npc_whisper_in_flame
### Public
A voice flickers in the blue flame, gentle one moment and desperate the next.
### DM Notes
The spirit is bound to warn travelers away from the sealed chamber, but loneliness has warped its judgment.
### Locale: zh-CN
title: 火焰中的低语

#### Public
一个声音在蓝色火焰中忽明忽暗，前一刻温柔，下一刻又近乎绝望。

#### DM Notes
这个灵魂被束缚着，必须警告旅人远离封印密室，但孤独已经扭曲了它的判断。

## Clue: Old Record
id: clue_old_record
visibility: dm_only
sourceSceneId: scene_mayors_house
### Text
An old ledger says the lantern was raised to mark a sealed shrine, not merely to guide travelers.
### Locale: zh-CN
title: 古旧记录

#### Text
一本旧账册写着，灯塔被建起并不只是为旅人引路，而是为了标记一座被封印的神龛。

## Clue: Mira's Dropped Charm
id: clue_miras_charm
visibility: dm_only
sourceSceneId: scene_mayors_house
### Text
A clay charm with Mira's initials is wedged behind the mayor's drawer.
### Locale: zh-CN
title: 米拉遗落的护符

#### Text
一枚刻有米拉姓名首字母的陶土护符卡在镇长抽屉后方。

## Clue: Small Footprints
id: clue_small_footprints
visibility: dm_only
sourceSceneId: scene_old_hill_road
### Text
Small muddy footprints circle the tower and vanish near a loose stone.
### Locale: zh-CN
title: 小小脚印

#### Text
小小的泥脚印绕着灯塔转了一圈，又在一块松动石头旁消失。

## Clue: Goblin Scrap Map
id: clue_goblin_scrap_map
visibility: dm_only
sourceSceneId: scene_old_hill_road
### Text
A torn scrap marks the tower hatch and a safer path through the pines.
### Locale: zh-CN
title: 地精碎地图

#### Text
一张撕裂的碎图标出了灯塔活板门，以及穿过松林的一条较安全路径。

## Clue: Broken Lantern Lens
id: clue_broken_lens
visibility: dm_only
aliases: hatch, hidden hatch, tower hatch, hatch below the tower
sourceSceneId: scene_lantern_tower
### Text
The cracked lens is blackened from the inside, and the soot curls toward a hidden hatch.
### Locale: zh-CN
title: 破裂的灯镜
aliases: 活板门, 隐藏活板门, 灯塔活板门, 塔下活板门

#### Text
破裂灯镜的内侧被熏黑，煤灰纹路蜷向一扇隐藏的活板门。

## Clue: Symbol Under Hatch
id: clue_symbol_under_hatch
visibility: dm_only
sourceSceneId: scene_lantern_tower
### Text
A worn symbol under the hatch matches the mark in the mayor's ledger.
### Locale: zh-CN
title: 活板门下的符号

#### Text
活板门下方有一道磨损符号，与镇长账册中的记号相同。

## Clue: Whispered Phrase
id: clue_whispered_phrase
visibility: dm_only
sourceSceneId: scene_buried_shrine
### Text
The flame repeats Kett's old work song as a warning: mend the light, mind the door.
### Locale: zh-CN
title: 低语短句

#### Text
火焰反复低声唱着凯特的旧劳作歌，像是在警告：修好灯火，看紧那扇门。

## Encounter: Hill Scavengers
id: encounter_hill_scavengers
visibility: dm_only
### Public Setup
Two wiry scavengers burst from behind fallen stones, more frightened than bold.
### DM Notes
They try to flee if one is defeated or if the party offers food and a way out.
### Locale: zh-CN
title: 山丘拾荒者

#### Public Setup
两个瘦小结实的拾荒者从倒塌石块后冲出，看起来与其说勇敢，不如说惊慌。

#### DM Notes
如果其中一个被击败，或队伍愿意给食物并指出逃路，它们会试图逃走。
### Combatants
- monster_hill_scavenger x2

## Ending: Repair the Lantern
id: ending_repair_lantern
### Public
The lantern catches with a warm gold flame, and the hill road shines clear before the storm breaks.
### DM Notes
The shrine remains sealed, and Mira owes the party the truth.
### Locale: zh-CN
title: 修复灯火

#### Public
灯塔重新燃起温暖金光，旧山路在暴风雨落下前变得清晰明亮。

#### DM Notes
神龛仍被封印，米拉欠队伍一个真相。

## Ending: Free the Spirit
id: ending_free_spirit
### Public
The blue flame rises like breath on glass, then scatters into the rain as the chamber falls silent.
### DM Notes
The road is safe, but the village must learn to guard the open shrine.
### Locale: zh-CN
title: 释放灵魂

#### Public
蓝色火焰像玻璃上的呼吸般升起，随后散入雨中，密室归于寂静。

#### DM Notes
道路安全了，但村庄必须学会守护敞开的神龛。

## Ending: Bargain with the Spirit
id: ending_bargain_spirit
### Public
The lantern burns blue for one night, and the voice promises guidance at a price yet unnamed.
### DM Notes
Use this ending if the party chooses trust over repair.
### Locale: zh-CN
title: 与灵魂交易

#### Public
灯火在这一夜燃成蓝色，那个声音承诺提供指引，只是代价尚未说出口。

#### DM Notes
如果队伍选择信任而不是修复，就使用这个结局。

## Ending: Fail Before the Storm
id: ending_fail_storm
### Public
The storm swallows the hill road, and the village wakes to fresh lights moving beneath the tower.
### DM Notes
This ending leaves the mystery unresolved for a later session.
### Locale: zh-CN
title: 暴风雨前失败

#### Public
暴风雨吞没了山路，村庄醒来时，看见新的光点正在灯塔下方移动。

#### DM Notes
这个结局会把谜团留到之后的团局中继续处理。
