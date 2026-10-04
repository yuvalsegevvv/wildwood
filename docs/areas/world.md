# World: terrain, ground, edges, roads

Area guide. Moved word for word from `CLAUDE.md` (sections 4, 8 and 9), where each item now has a short row; open this file when your task touches this area.

## Where to change what

### World size, lakes, terrain

`shared/terrain.js` (`SIZE`, `LAKES` and `lakeCut`, which digs each lake a bowl, `baseHeight`; the hills' shape is `hillShape` with `HILL_HOME` / `HILL_VALE`: fbm bent by a domain warp and eroded by `erodeFbm`, so ridges and valleys meander; `ridged` gives the mountain walls' crests and the Greyspine), `shared/noise.js` (`noiseD`: noise with its slope), `shared/zones.js` (`RINGS`, zones, arena; `zoneRidge` wobbles the walls). The shared height is sampled on the server's 4 m grid: put nothing finer than 8-16 m wavelength in it. Tune it offline: load the shared code with `loadShared(['rawHeight'])` (tools/load.js), sample a grid and draw a hillshade; slopes above 0.95 (no trees) were 9% of the home forest before and after the rework

### The ground you see (colours, per-pixel detail, curvature shading) and the far lands

`terrainMaterial` (a Phong material on the desktop so the pixel shader can bump the normal; Lambert with colour detail only on phones; plain in light mode), `groundShade`, `TERRAIN_*` in `game/world/generation-setup.js`; vertex colours `game/world/terrain-color.js`; the placeholder lands beyond the map (an indexed, smooth-shaded mesh of ridged mountains) `game/world/far-lands.js`

### The lands' edges (Crownsea shore, the Sunwall and Redgate Canyon, snowy northern rims, all curved by noise) and the placeholder lands beyond; the edge zones and their monsters (`EDGE_ZONES`, `edgeZoneAt`, `defZone` in `shared/zones.js`; rows with `zone:` in `MON_DEFS`)

`shared/terrain.js` (`coastDist`, `shore`, `sunwall`, `bareGround`), colours `game/world/terrain-color.js`, the sea limit in `worldBounds` (`game/player/movement.js`), names `edgeName` (`game/ui/map.js`); placeholders `game/world/far-lands.js` (`FAR_COAST`, `FAR_ISLES`, `farHeight`); design `docs/WORLD.md`

### Roads, the river bridge and the plank causeways over the drowned roads (found automatically wherever a road runs under water; names `CAUSEWAY_NAMES`)

`shared/roads.js` (`ROADS` waypoints, `roadDist`, `nearRoad`, `BRIDGES`, `bridgeDeck`, `bridgeAt`); the models `game/world/bridges.js`; walking on it `updatePlayer` (movement.js); road names on the map (`placeName`); the map's wavy outline `mapEdgeAlpha` (map.js)

## Pitfalls

- Changing the terrain moves things that are found by scanning it: the bridge (`findTunnel`), Hanami, the boss arenas, the home boss arena, and, worst, the home
  village's entrance `ent` (`findVillage` scan), from which the whole spiral of monster zones starts: the eroded hills once turned it 180 degrees and every zone with it.
  `ent` is pinned to 315 degrees in `VIL`. After a terrain change print `VIL.ent`, `TUN.z` and the arenas with `loadShared` (old `git archive` copy next to the new one) and compare.
  Two tests also depended on where the first monster or node happens to be (`skills-smoke` put the hiker at the target's ground height, `client-smoke` took the first
  snowmoss node beside a camp): both now pick their spot robustly.
- A Phong terrain material needs no textures for detail: world-space noise in the fragment shader (`TERRAIN_COLOR`, `TERRAIN_BUMP`) breaks up the 2 m
  mesh. r128's Lambert is lit per vertex, so a bumped normal does nothing there.
