# Regions: the Sakura Vale, the Hoarfrost Reach, teleport circles, Glasswell's model

Area guide. Moved word for word from `CLAUDE.md` (sections 4, 8 and 9), where each item now has a short row; open this file when your task touches this area.

## The Sunscar (the fifth land)

Built in version 3: see `docs/areas/sunscar.md` (ground, gates `river` / `redgate`, `inSun`, Glasswell `VIL5`, zones `s28`-`s36`). `landAt(x,z)` returns `'sun'` for it; `GREY_GATES` now holds three rock falls (`neck`, `river` with `dir:'s'`, `redgate` with `dir:'e'`).

## Where to change what

### Hoarfrost Reach (levels 22-30): the plateau, Frostgate Pass and its ice wall, Rimehold `VIL3`, zones `h22`-`h30`, the two boss arenas, the rectangle `NORTH_D` / `EAST_W` / `HZ0` / `WZ0`

the ground is the atlas's (`world-atlas-ground.js`), `FROST_LAKES` in `shared/terrain.js`; pass, village, zones, ridges, arenas, `CIRCLES` in `shared/hoarfrost.js` (`passCarve` is called by `rawHeight`); roads in `shared/roads.js`; monsters `MON_DEFS` rows with `zone:'h22'`..; the gate: `PASS.ice` + `barStep` (`shared/barriers.js`, called by `worldBounds` and `setPos`), opened by `openNorthP` when Akaoni falls (`server/combat.js`), saved as `gear.north`; meshes, the ice wall, the boss halls, the iron bird `game/village/buildings-hoar.js`; snow and needle colours `hoarColor` (`game/world/terrain-color.js`); trees/rocks `generation-chunks.js` (`inHoar`); map view `LANDS.hoar` (`game/ui/map.js`); music `rimehold` / `hoar1` / `hoar2` / `boss26` / `boss30`

### Weather: snow instead of rain in the Reach (the server still has one weather); the aurora at night over it (`game/world/aurora.js`)

`WX.snow`, the snowfall layer and `weatherTint` in `game/world/weather.js` (in the Greyspine `WX.snow` follows the ground's height instead: `greySnowAmt`, `docs/areas/greyspine.md`), the wind in `game/audio/rain.js`, wind / howls / crunch in `audio/driver.js`, `audio/ambience.js`

### Teleport circles and their travel window (choose among the villages; it opens by itself when you step onto an attuned circle)

`CIRCLES` in `shared/hoarfrost.js` (where each leads, when it wakes); `warpP` in `server/players.js`; `useCircle`, `circlePrompt` in `game/village/talking.js`; the window `game/ui/travel.js`; the circle meshes `buildCircle` in `game/village/buildings-vale.js`

### Sakura Vale: the Greyfall bridge `TUN` (once a tunnel), Hanami `VIL2`, vale zones/ridges, arenas `ARENAS`, `vilAt` (knows all four villages)

`shared/vale.js`; meshes `game/village/buildings-vale.js`; the bridge's gate and parapets in `worldBounds` (`game/player/movement.js`); unlock / attune / `warpP` in `server/players.js`; Hanami NPCs (`vil:2`) in `game/village/villagers.js`

### Glasswell, the Sunscar's desert city (design in `docs/DESERT-CITY.md`; **only its 3D model exists, it is not placed in the world**: the Bowl with three gates and the Weir, the Old Citadel with the broken statue at the centre, the Great Well, a lake and river, 30 places and 80 homes, palms)

The layout is **generated** by `docs/glasswell-plan.py --js src/shared/sunscar.js` (change the script, not `shared/sunscar.js`); `gwRimH` (the Bowl as a height function) in `shared/sunscar-shape.js`; the model `game/village/sun-rim.js` (rim, floor, water, gates, `gwGround`), `sun-ruin.js`, `sun-houses.js`, `sun-halls.js`, `sun-shops.js`, `sun-props.js`, assembled by `buildGlasswell({x,z,h})` in `buildings-sun.js`; **see it** with `node tools/city-preview.js out/ --views overview,street,statue` (playwright + Chromium, real WebGL); test `node tools/glasswell-smoke.js`; what is missing (placement, collision, people, lore spots, the statue's function) is in `docs/NOT-BUILT.md` section 2

### The lands, their borders, the barriers (the atlas)

The world is `shared/world-atlas.js` (docs/world-atlas.py bakes it): `waLandId(x,z)` / `waLand(x,z)` say which land a point is in (home 0, vale 1, hoar 2, grey 3, sun 4, gloam 5, amber 6; `waLand` is null at sea), `waLandBorderDist` the metres to the nearest border, `waCoast` the metres inland of the waterline. The land tests `inVale` (vale and Reach), `inHoar`, `inGrey` (Greyspine and Gloamhorn: ask `inGloam` first), `inSun` (Sunscar and Amber), `landAt(x,z)`, `vilAt(x,z)` all answer from it; **never write a coordinate compared with a constant to mean a land**. The old frame (`HALF`, `HZ0`, `HX0`, `GW0`, `GDX`, `borderX(z)`, `borderXN(z)`, `borderZ(x)`) is left in `shared/terrain.js` for one reason: `wvOldLand` (`server/players.js`) reads it to move a save from before the atlas to its land's village (`gear.wv`, `WORLD_VER` in `shared/items.js`). The old frame's ground (`baseHeightRaw`, `homeHeight`, `valeHeight`, `hoarHeight`, `greyspineBase`), the Greyfall waterfall and the old coast module (with its smoke test) are deleted; the coast is `waCoast` (`coastDist(x,z)` = `waCoast + 21`).

- **Barriers (`shared/barriers.js`, BUILD.md 0.3).** While a land is locked, its gate holds; once it is open for you **no invisible clamp of that land remains**: only the ground (the slope limit `SLOPE_MAX`, `slopeBlock`), the shore's knee-deep water rule, rock (caves) and the world's outer edge (14 m inside `WX0..WX1` / `WZ0..WZ1`, `worldBounds`) stop a hiker. `barStep(o,ox,oz,gear)` is the one function for both sides (the client's `worldBounds`, the server's `setPos`), in this order: the Greyfall Bridge's door strip (while `gear.east` < 1); the ice wall across Frostgate Pass (`PASS.ice`, while `gear.north` < 1); the ice fall across the glacier valley (`barFallX`, while `gear.west` < 1; steps over 30 m are teleports and are not held); `barHold`, which drops the part of a step that changes land across a shut border (`barLocked`: home | vale until `east`; the Reach's borders until `north`; the Greyspine's borders with the forest and the Reach until `west`; Greyspine | Gloamhorn by `gloamNeckHold` and Sunscar | Gloamhorn by `neck`; anything touching the Amber Reach from the forest or the Sunscar, always); the rock falls (`GREY_GATES`: `gateHold`, `sunWallHold` with `redgate`, `sunCrestHold` with `river`, `gloamNeckHold` with `neck`). A step across a shut border slides along it. `barLandOpen(land,gear)` says whether a testing teleport or a warp may land in a land. `gear.amber` is always 0 (the Amber Reach never opens); `gear.wv` is the save's world version.
- **The border river is a ford, not a wall.** The river between the forest and the vale is wadeable (the atlas's fords, about 1.1 m): with `east` open a hiker crosses it anywhere; with it locked `barHold` holds the border. The old "river is a wall" knee-depth clamp, `glenWall`, `frostWall` and `greyWall` are removed.
- **A save from before the atlas** (`gear.wv` < `WORLD_VER`) has its position moved to the village of the land it was in (if that land is open for it, else the home village): positions are not saved by the server, the join spawns at the village anyway, and `wvSpawnOf` only picks which one.
- **Test the geometry, not the look**: `atlas-smoke` (anchors on their land and dry, every zone reachable, roads), `greyfall-smoke` (one land per point, the villages on their hubs, the border river's ford), the barriers in `server-smoke` (`setPos`) and `client-smoke` (`worldBounds`: a hiker crosses the ford with the vale open and is held while it is locked).

## Pitfalls

- Adding a region (the Hoarfrost Reach taught these): `WZ0` is the whole world's north edge now, not the forest's or the vale's: their edge is `HZ0`
  (`inHoar(x,z)` tells the Reach apart; `inVale(x)` is true there too). A zone key is a level for the home forest and the vale but `'h22'`.. for the Reach
  (`ZONES.find(z=>z.key===level)` finds only the first two: use `z.level===L`, `defZone(def)`). Hoarfrost zones carry `vale:true` (a polar cell with `x,z,R`)
  and `hoar:true`. `upgradeNeeds` must cap the level it asks drops of (`VALE_TOP_LV`): above it every kind has a `zone` and the pool is empty.
  Constants used by terrain functions at load must be defined before the first call (TDZ across the concatenated files): `FROST_LAKES`, `hoarBase` live in
  `shared/terrain.js` for that reason. A new region also needs `ok()` in `server/monsters.js`, `worldBounds` (movement.js), the map's `LANDS`, `vilAt`, the music and
  ambience, and a look at every `inVale(x)` (vegetation, petals, motes).

## Reference numbers

- Hoarfrost Reach: 18 monster kinds (two per level 22-30, `zone:'h22'`..`'h30'`), 12 of each, two bosses (26 Ymrik, 30 Vetrmaw, 6 skills each), 90 resource nodes.
- Vale progress: `gear.east` 0 barred, 1 bridge gate open (anyone rewarded for a Rootwarden kill), 2 walked into Hanami
  (its circle and home's work). Vale monsters: 2 kinds per level, 12 of each; gear tiers 4-5 at levels 20 and 25.
- Hoarfrost progress: `gear.north` 0 ice wall shut, 1 open (anyone rewarded for an Akaoni kill; old saves past V10 get 1), 2 walked into Rimehold
  (its circle works). Professions: `gear.prof` `{mining|woodcutting|gathering: {xp}}` (60 coins each at any Lodge), `gear.res` the resources, `gear.pot` the potions; the tools are worn in `gear.eq.pick|axe|sickle`.
