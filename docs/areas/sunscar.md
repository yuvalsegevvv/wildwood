# The Sunscar (version 3, the fifth land, levels 28-36) and Glasswell (VIL5)

Playable since version 3. The design (what the land should be, the city's districts and cast) is `docs/WORLD.md` (Sunscar) and `docs/DESERT-CITY.md`; this file is the code map, the numbers and the pitfalls. Test: `node tools/sunscar-smoke.js` (plus `slope-smoke`, `greyspine-smoke`, `client-smoke`, `boss-smoke`).

## Where to change what

| Task | Files |
|---|---|
| The ground: red mesas, dunes, salt pans, black glass fields, the Sunwall, the River Pass, the Glass River and the Springhead, the Bowl | `shared/sunland.js` (`SUN_BASE`, `SUN_CITY`, `SUN_FLAT`, `SUN_PASS`, `SUN_MESAS` / `SUN_PANS` / `SUN_GLASS`, `sunDuneK`, `sunMesaH`, `sunPanK`, `sunGlassK`, `SUN_RIVER`, `sunWaterSurf`, `sunKeepOut`, `sunGround`, `sunHook`, `SUN_DG_DOOR`); `homeHeight` calls `sunHook` for `x < HX0-12` (`shared/terrain.js`); the Bowl is carried by the heightmap (`V.bowl`: `gwRimH` in `sunscar-shape.js`), not by the model's own ground |
| Land tests | `inSun(x,z)` = the atlas's land 4 (or 6, the Amber Reach, which `inAmber` is asked before); `landAt` returns `'sun'`; `vilAt` finds `VIL5`; always ask both coordinates. The gates are `barStep`'s (`gear.river`, `gear.redgate`; `gear.amber` opens the Ashbed Gate, see savanna.md), see `docs/areas/regions.md` |
| Glasswell as a village | `shared/glasswell.js` (`VIL5`, `GW_PLACE`, `gwWorld`, anchors `place:<id>`, `questboard`, `well`, `garden`, `cart`, `gate`, `lamp:0-6`, `plaza0-7`, `house:0-79`); the model `game/village/sun-*.js` + `buildings-sun.js` (`buildGlasswell`), placed by `game/village/buildings-sunscar.js` (`buildSunscar`: the model, colliders from the footprints, the river ribbon, the Springhead, the reserved door) |
| People of Glasswell | `game/village/villagers.js` (`vil:5`: Marshal Zahra, Idris, Samira, Karim, Nadia, Captain Omar, Yusuf, Healer Amal, plus filler with `SMALLTALK5`); no story steps, no peddler (Odran's route ends at Highmark) |
| Colours | `game/world/terrain-color-sun.js` (hooked in `terrain-color.js`) |
| Plants (palm, cactus, thorn tree) | `game/world/plant-models-sun.js`, the `inSun` branch of `genChunk` (`generation-chunks.js`), `PAL.palm` / `PAL.thorn`, `RAD` (`generation-setup.js`); each plant draws from its own `mrng(seed)` |
| Zones, arenas | `shared/sunzones.js`: `s28`..`s36` (two kinds per level), `ARENA_S32` (the Guardian's Court), `ARENA_S36` (the Wyrm's Pit); `sunZoneAt` called from `zoneAt` |
| Monsters | 18 rows in `MON_DEFS` (`shared/monster-defs.js`: `res` / `acc` on the rows, see below), `FAM` rows scorpion / cactus / sandworm / djinn / sentinel, models `game/combat/monster-desert.js`; camps in `server/monsters.js` (`ok()`: `sunKeepOut`); drop names `MAT_NAMES` (`shared/drops.js`) |
| Bosses | `BOSS_DEFS` (kits `glass`, `sandwyrm`), `GLASSGUARD_DEF`, `SHARD_DEF`, `MIRROR_DEF`, `SANDWYRM_DEF`, `WHELP_DEF`; kits `server/boss-kits-sun.js`; the `sandstorm` zone kind (`server/boss-fx.js`, `game/combat/boss-fx.js`); 12 boss skills in `SKILLS` (`shared/classes.js`); `boss quests` in `shared/quests.js` |
| The gates | `GREY_GATES` has three rock falls now: `neck` (west wall), `river` (`dir:'s'`, the River Pass, opened by the Gryphon Queen, `gear.river`), `redgate` (`dir:'e'`, Redgate Canyon in the Sunwall, opened by the Sand Wyrm: `openGateP(q,'redgate')` in `server/combat.js`); `gateHold` (both directions), `sunWallHold` (the Sunwall's crest while `redgate` is 0), `sunCrestHold` (the north crest while `river` is 0): client `worldBounds`, server `setPos` |
| Arriving | `gear.sun` (0-2): 2 once you walk into Glasswell with a gate open (`reachGlasswellP`, `server/players.js`); it attunes the circle (`CIRCLES`: `open:g=>g.sun>=2`) and makes Glasswell your respawn (`respawnVil`); the travel window lists five villages (`game/ui/travel.js`) |
| Map | `LANDS.sun` in `game/ui/map.js` (the painter is the shared one: no snowy peaks on mesas); no art on the world map of Eldmere (no pin there) |
| Weather, music | no rain, snow or lightning in the Sunscar (`WX.dry`, `game/world/weather.js`); procedural songs `sun1` (28-32 and Glasswell) and `sun2` (33-36), `game/audio/music.js` |
| Nodes | `NODES` (`shared/professions.js`), last: 5 per zone (2 rime ore, 2 frostpines, 1 snowmoss) |
| Zone tiers | `ZTIER_LANDS` has `sun` (opened by the Sand Wyrm), not in `ZTIER_SYMBOL_LANDS` (the symbol cap is a balance placeholder) |
| Test | `tools/sunscar-smoke.js` |

## Numbers

- World (the atlas): the Sunscar is the atlas's land 4, south-west of the forest, its Bowl (Glasswell, `SUN_CITY`) on the atlas's hub; the ground is the atlas's with the Bowl laid in by `sunBowlHook` (a ring skirt `sunSkirtAt` blends the Bowl's rim into the atlas's ground over 118-190 m, so the River Pass has no cliff). Zone s28 reaches out `SUN_CITY.r + 90` so camps stand outside the apron. The door of the Sandglass `SUN_DG_DOOR` is at (-1045, 365), 24 m off the Sun Door Road and clear of the Arches cave. Atlas roads that end at the Bowl's rim do not match the plan's gate bearings (`docs/glasswell-plan.py`: river 163, red 83, dune -26, weir -69 degrees): `atlas-smoke` skips road steps inside the rim; to fix, regenerate the plan with the atlas's road entries.
- Ways in: the River Pass from the Greyspine (the `river` rock fall at (-798, -390)); Redgate Canyon through the Sunwall (`SUN_RED`, (-380, 40)). Both are shut by default; with both shut no Sunscar ground is reachable (sunscar-smoke floods it).
- Monsters: 18 kinds, two per level 28-36, 12 each (216), elements fire / earth / light. **Rolls (version 3, `docs/ROLLS.md`)**: `res` (resistance) and/or `acc` (accuracy) on the row, 0.05 at level 28 rising to 0.20 at 36; some kinds have only one; bosses 0.25. `docs/MOBS.md` shows both columns.
- Bosses: the Glass Guardian (level 32, light; shards, glassfall, the radiant ring, a black-mirror shield in phase 2 (break the three mirrors), the prism wheel in phase 3) and the Sand Wyrm (level 36, earth; tail sweeps, the burrow, sand walls, the sandstorm, whelps). The Wyrm opens Redgate.
- `MAX_ZONE_LV` is 40; quests clamp to the highest monster level (`questTop` in `quests.js`, 36), so the board never asks for a level with no monsters.
- The reserved dungeon door: `SUN_DG_DOOR` ('sandglass', 'The Sandglass', (-700, 250), 230 m south of the city's centre, zone s34): now the Sandglass's real door (`DG_ENTRANCES.sandglass`, built by `dgEntSand` in `buildings-dungeon.js`; the prop in `buildSunscar` is gone): the dungeon (boss Khet, level 40, enter from 36, needs `gear.sun` 2, pays a level-40 weapon) is `docs/DUNGEON-THEMES.md` section 11.

## Pitfalls

- A gate hold needs the previous position: a test must place the player (`p.x`, `p.z`) and then walk with `setPos` in small steps; a jump from the spawn is read as coming from the south.
- `sunKeepOut` is the one question for camps, nodes and plants (water, the Springhead, the city's plateau, the reserved door).
- `bareGround(x,z)` is true everywhere in the Sunscar (the old Sunwall rule), so the common planting loops skip it; the Sunscar has its own branch.
- A tool's headless canvas has no `measureText` width: `gwSign` guards it.

## Left out (also in `docs/NOT-BUILT.md`)

The dungeon behind the door; (its skill-set sources are built: `SS_SOURCES.sun`) the main quest (no steps; Glasswell's physician is only a villager); desert-specific ore, wood and herbs (the nodes reuse the top grades); gear above tier 5; the world map's art and fog for the Sunscar; recorded music; the Stormhorn and the Amber Reach beyond it.
