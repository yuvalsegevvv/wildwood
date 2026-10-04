# Regions: the Sakura Vale, the Hoarfrost Reach, teleport circles

Area guide. Moved word for word from `CLAUDE.md` (sections 4, 8 and 9), where each item now has a short row; open this file when your task touches this area.

## Where to change what

### Hoarfrost Reach (levels 22-30): the plateau, Frostgate Pass and its ice wall, Rimehold `VIL3`, zones `h22`-`h30`, the two boss arenas, the rectangle `NORTH_D` / `HZ0` / `WZ0`

shape `hoarHeight`, `FROST_LAKES`, `NORTH_D` in `shared/terrain.js` (the cheap Greyspine massif is `greyspineHeight`); pass, village, zones, ridges, arenas, `CIRCLES` in `shared/hoarfrost.js` (`passCarve` is called by `rawHeight`); roads in `shared/roads.js`; monsters `MON_DEFS` rows with `zone:'h22'`..; the gate: `frostWall` (`game/player/movement.js`) + `setPos` (`server/api.js`), opened by `openNorthP` when Akaoni falls (`server/combat.js`), saved as `gear.north`; meshes, the ice wall, the boss halls, the iron bird `game/village/buildings-hoar.js`; snow and needle colours `hoarColor` (`game/world/terrain-color.js`); trees/rocks `generation-chunks.js` (`inHoar`); map view `LANDS.hoar` (`game/ui/map.js`); music `rimehold` / `hoar1` / `hoar2` / `boss26` / `boss30`

### Weather: snow instead of rain in the Reach (the server still has one weather); the aurora at night over it (`game/world/aurora.js`)

`WX.snow`, the snowfall layer and `weatherTint` in `game/world/weather.js` (in the Greyspine `WX.snow` follows the ground's height instead: `greySnowAmt`, `docs/areas/greyspine.md`), the wind in `game/audio/rain.js`, wind / howls / crunch in `audio/driver.js`, `audio/ambience.js`

### Teleport circles and their travel window (choose among the villages; it opens by itself when you step onto an attuned circle)

`CIRCLES` in `shared/hoarfrost.js` (where each leads, when it wakes); `warpP` in `server/players.js`; `useCircle`, `circlePrompt` in `game/village/talking.js`; the window `game/ui/travel.js`; the circle meshes `buildCircle` in `game/village/buildings-vale.js`

### Sakura Vale: tunnel `TUN`, Hanami `VIL2`, vale zones/ridges, arenas `ARENAS`, `vilAt` (knows all three villages)

`shared/vale.js`; meshes `game/village/buildings-vale.js`; tunnel collision `worldBounds` in `game/player/movement.js`; unlock / attune / `warpP` in `server/players.js`; Hanami NPCs (`vil:2`) in `game/village/villagers.js`

### The borders between the four lands, the Greyfall River and the Greyfall (a waterfall off the home forest's north rim)

`borderX(z)` / `borderZ(x)` and the helpers `pinK`, `bordNoise`, `wallW` / `wallK` / `wallP` / `wallAdd` (the mountain range's profile), `riverK` / `riverCut` / `riverHalfW` (the river), `FALL` / `fallProfile` / `fallY` / `fallCut` (the waterfall) in `shared/terrain.js`; the land tests `inVale(x,z)`, `inHoar(x,z)`, `inGrey(x,z)`, `landAt(x,z)`, `vilAt(x,z)`; the drawing `game/village/buildings-greyfall.js` (`buildGreyfall`, `updateGreyfall`; the two hooks `// greyfall:` in `generation-setup.js` and `main/loop.js`); the blocking `worldBounds` / `glenWall` / `frostWall` / `greyWall` in `game/player/movement.js` and `northBarZ` (`shared/hoarfrost.js`) with `setPos` (`server/api.js`); test `node tools/greyfall-smoke.js`.

- **The borders are curves, not the rectangle's sides.** The Vale Wall (home forest | vale south of the junction, Greyspine | Reach north of it) is the line `x = borderX(z)` and the north wall (home | Greyspine west of the junction, vale | Reach east of it) the line `z = borderZ(x)`. They bend by what each land can spare: the home forest has room, so the river bulges up to 215 m west into it (and 30 m east), the north wall up to 90 m south into it; the vale and the Greyspine own content close to the lines (zones at x 570 and z -300, Highmark, the Sink), so they give at most 55 m (the Reach up to 110 m north of the vale); the Greyspine never loses ground (nothing leans north or west into it). Where something is built across a line it is **pinned straight** (`BORDER_X_PINS`, `BORDER_Z_PINS`: the tunnel z -100, the junction z -440 and x 440 (the Greyfall is born there, z -536..-344), the glacier valley z -722, Frostgate Pass x 636), so the tunnel, Hanami, the pass, the glen, Rimehold and Highmark did not move. A new gate on a border needs a pin first; a new content cluster near a line needs the lean checked (`tools/greyfall-smoke.js` states the limits).
- **The land tests take both coordinates.** `inVale(x)` and `x > HALF` are gone: a point is east of the Vale Wall when `x > borderX(z)`, north of the north wall when `z < borderZ(x)`. Everything that decided a land by `HALF` / `HZ0` (zones, ridges, villages, colours, weather, music, the map's names and edges, the camps' `ok()`, respawn, the gates' server clamps, chamois, `terrain-color.js`) asks the lines now; `HALF` and `HZ0` are only the junction and the lines' mean.
- **The mountain range varies.** Both lands on either side of a crest add the same `wallAdd` terms (distance to the crest line, so they meet without a step): a body 58-128 m wide (`wallW`), a crest at x0.55-x1.5 of its height (`wallK`: saddles and massifs), a profile from a long ramp to a steep wall (`wallP`), low ridges that run out into the land (the foothills), none where `riverK` is 1.
- **The Vale Wall south of the junction is a river** (`riverK`: 1 on the river, 0 on the spur where the tunnel crosses, z -170..-30, and north of the junction): a channel 32-60 m wide and 2.8 m deep at its middle (the sea's level fills it: no new water surface), a low flat flood plain either side (`riverCut`, applied by `homeHeight` and `valeHeight` alike). Nobody crosses it but through the tunnel: it is deeper than the 0.8 m a hiker may wade (the shore's rule, applied in `worldBounds` where `riverK > 0.15`) and the crest-line clamp (14 m) is still there. The edge zones treat the river and its bank as the wall's body (`edgeZoneAt`, 56 m), a vale zone reaches 190 m from its seed at most (`valeZoneAt`: the strip the river gives the vale has no zone), the map names it **The Greyfall River** (`edgeName`) and widens the lands' crops (`LANDS`).
- **The Greyfall**: the river is born at the foot of the home forest's north rim, at the junction. On the rim's top (about 140 m up) a tarn (`FALL.tl`; `waterSurf` returns its level) overflows through a slot cut across the crest (the chute, `fallCut`, 6 m half-wide) and falls about 125 m down the rim's face to a plunge pool (`FALL.pool`, 3.4 m deep). `fallProfile` is the fall's path (every 2 m, never rising, never above the ground; computed on first use from `baseHeightRaw`, so no load order problem). `baseHeight` = `baseHeightRaw` + `fallCut` in the fall's box. The client draws a streaked sheet over the path (a canvas texture that runs down it), a foam ring and a puff of spray at the pool (counts by device, nothing updated beyond 340 m) and a two-loop roar (audible from about 420 m, none in a dungeon). Seeing it: `shot.js`-style Playwright views (docs/areas/greyspine.md) at (441, -330) looking north.
- **Test the geometry, not the look**: `greyfall-smoke` checks the curves (amplitudes, one-sided leans, the pins), that every point is in exactly one land and its village agrees, the river's depth, width and banks all along, the spur and the tunnel, the fall's path, the tarn's rim and the pool; the client side (the mesh, the clamps, the map's names) is in `client-smoke`.

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
- Vale progress: `gear.east` 0 sealed, 1 tunnel open (anyone rewarded for a Rootwarden kill), 2 walked into Hanami
  (its circle and home's work). Vale monsters: 2 kinds per level, 12 of each; gear tiers 4-5 at levels 20 and 25.
- Hoarfrost progress: `gear.north` 0 ice wall shut, 1 open (anyone rewarded for an Akaoni kill; old saves past V10 get 1), 2 walked into Rimehold
  (its circle works). Professions: `gear.prof` `{mining|woodcutting|gathering: {xp}}` (60 coins each at any Lodge), `gear.res` the resources, `gear.pot` the potions; the tools are worn in `gear.eq.pick|axe|sickle`.
