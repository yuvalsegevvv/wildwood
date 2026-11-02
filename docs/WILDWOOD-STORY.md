# The Wildwood story (zone one, levels 1-5, the home forest)

The approved dialogue script lives with the owner (38 scenes). This file is the code map of what is built. **Built: the prologue P1-P6, then Act I as a guided tutorial: W1 to W18 (the witch, the road north, Pip and the cure, the training arc, the Rootwarden) and the playable signature looks of Morrow and Pip.** The story's names: the village is Ribbonside, the witch Morrow, the lost child Pip, the Lodge keeper Hollen (renamed from Tamsin, who is now only the quarry-hand outfit).

## The flow in one screen
| Part | Steps | What happens |
|---|---|---|
| Prologue | P1-P6 | A morning at the well (Wren well), the road to Tansy's farm, slimes, the farm, a first dark ripple, the walk back, Wren falls ill. Tansy leads and runs ahead. Skill slot 2 is taught at level 2. |
| Who knows a cure | W1-W2c | Ask the village; the witch's hut east of the Mushroom Hollow; three small things for her; the grey reaches Wren. |
| Learning the craft | W6a, W6, W7b, W7, W8 | Working hands (the Lodge), the board, Linnea's kettle, Torgeir at the gate, the peddler. |
| The north road | W9-W9d | Pip's hollow, the cure, where the drops fell, thornlings (grey monsters: `thornlet`). |
| The training arc | W10-W16b | Sharper (weapons and skills), root spikes, steel that sings, Under the Ridge, the beat, not alone (party), the big moment (level-8 slot 3), the song, three totems, ready. |
| The Rootwarden | W17, W18 | The boss with spoken barks and a vision (the grey touch); goodbye for now, the road to the Sakura Vale is set up, not opened. |

## Code map
| What | Where |
|---|---|
| The steps | `MQ` in `shared/main-quest.js` (ids `P1`-`P6`, `W1`-`W18` with the letters above) |
| Places, story-led NPC positions, the sick Wren rule | `MQ_PLACES`, `MQ_SITE_NPC`, `mqStoryAt`, `mqWrenSick` (`shared/main-quest.js`) |
| New part kinds | `visit` (walk to a place, `say` shows in the bubble), `spawn` (a few ordinary monsters for you at a place), `fx` (a dark moment), step `intro` (said after the previous step's last talk), step `at:{npc:[places]}` (where a story villager stands) |
| Server | `mqVisitP`, the spawn branch of `mqTickP`, `fx` in `mqProgressP`, the story-villager rule in `mqTalkP` (`server/main-quest.js`); the Rootwarden's barks, vision and grey touch: `rootsBarkS`, `ROOTS_VISION`, `rootsStoryTickS` (`server/boss-kits-home.js`) |
| Client | `mqPartTarget` (`economy/main-quest.js`), `mqDarkFx` (`economy/main-quest-fx.js`, event `mqfx`: the world loses its colour, dims, shakes, black veins grow from the screen's edges, a toll sounds), the log and the other props (`world/farm-props.js`), story NPCs moving (`atFn` / `site` in `village/villagers.js`, `villagers-outfits.js`), the guide trail (`economy/main-quest-guide.js`, runs until W1) |
| The lore pass | `MQ_MORE` / `MQ_MORE_B` (`shared/main-quest-more.js`): extra `intro` / `offer` / `done` / part `say` lines, `pre` before the base lines and `post` after, spliced into `MQ` at load by `mqApplyMore`; `say` entries are counted over the parts that have a `say` |
| Voiced story | `game/village/story-voice.js`: every line (villager, hero, narration, boss shouts) is read aloud; the next line plays once the voice has ended and 5 s have passed since the line began (+ 2.2 s of quiet), and the story goes on while you walk (`svBusy`, `svFar`) |
| Story choice | `game/ui/story-mode.js` (`storySkip`, `storyCut`, `storySet`; `localStorage` `wildwood-story`): asked on the creation screen (`#edStory`), changeable in Settings (`#storyChips`). "Just objectives": nothing is read aloud or paced, no freeze, a story conversation is cut to its last spoken line, a place's scene is not shown, boss shouts are not read; the quest log, tips and dark moments stay. Stored per device, not per account |
| Key scenes | a first line `@cine Title` in a `say` / `offer` / `done` list (rides in front of the next line, `mqSplitLines` / `mqLineOf`): letterbox bars, a title card, the hiker frozen (`cineOn`, `uiOpen`, `updatePlayer`); it ends with the scene, on damage, death, Escape or after 150 s. Marked: P6, W2c, W15 (grave), W17 |
| Farm and hut buildings | `game/world/story-houses.js` (`buildStoryHouses`: barn, coop, haystacks, field, fence, scarecrow; Morrow's hut with garden); the farm stands at `MQ_FARM` (-24, 200), on dry ground (mainquest-smoke checks it) |
| The grey monster | `thornlet` (`shared/monster-defs.js`) |
| Skill slots | `SKILL_SLOT_LV` 2, `BURST_SLOT_LV` 8 (`shared/classes.js`); starter skills lowered to match (whirlwind, volley and frost nova at level 2; quake, hail and blizzard at level 8); slot 3 is gated by level 8, not a story flag, so nobody can get stuck |
| Outfits | `game/outfits/morrow.js`, `pip.js` (signature looks, also worn by the villagers), looks `docs/skillkits/looks/morrow.md`, `pip.md`; their voices in `game/audio/voices-hero.js` |
| Saves | `MQ_VER` 3, `MQ_INSERTED` entries are `[after, n, version]`; `MQ_V2_IDS` and `mqMigrate` move a version-2 save to the nearest step **by id** (`mqV2Index`), so veterans do not repeat the new prologue |

## Events
`mqfx [pid, 'ripple'|'ash'|'grey'|'green'|'amber']` (server -> client). Visit scenes reuse `sqsay [pid, title, lines]`.

## Deviations from the script, and what is not built
- Healthy Wren is a second villager (`wren0`) so the sick one (`wren`) keeps its id; `wren0` is shown until `mqWrenSick`.
- P6 puts the visit at the bed: the sick Wren is already in the bed when you arrive (the script carries them there).
- Tansy does not come on the north trip (Torgeir and Pell take her roles there).
- The Rootwarden still has its season mechanics in code; the story overlay only adds barks and the vision.
- Not built: the Greenwash item, the Strike / Release choice, the goblin side story (script appendix A), practice-grove dummies.
- The brewing step W7b hands out three sunpetal and the fee when it starts (`gift:'herbs'`, `mqStartP`), so the potion can always be brewed.
- Not checked in a real browser: the story is covered by `node tools/mainquest-smoke.js`, `boss-smoke` and `client-smoke`, not by eye.

## Test
`node tools/mainquest-smoke.js` (the whole flow, migration, the story NPC rules), `node tools/outfit-smoke.js --only morrow` / `--only pip`, `node tools/outfit-looks-check.js`.
