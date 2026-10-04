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
