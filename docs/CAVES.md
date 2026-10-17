# Caves, sea arches and overhangs (task C of the world revamp)

True 3D rock on a heightmap world: tunnels you walk through, arches you walk under, overhangs, a chamber under a plateau. Files: `src/shared/caves.js` (registry, field, carve, collision), `src/shared/caves-mesh.js` (surface nets, colours), `src/shared/caves/<id>.js` (one site each), `src/game/world/caves.js` (mesh on screen, light), `tools/caves-smoke.js` (test), `tools/caves-preview.js` (a picture of one site without the game).

## 1. The model

- A **site** is a signed distance field (negative = rock) in the site's own frame: origin `x,z`, `+u` along `yaw`, `+v` to the right, `y` above the floor `fy`. It is a union of **rock** blocks (rounded boxes; `follow:true` = the top is the land as it was before the carve, for hillsides, plateaus and islets) minus **voids** (`tunnel`, `arch`, `chamber`, `overhang`), plus strata and a rough skin near the surface.
- **The server only ever sees the floor.** The heightmap (`rawHeight`) is the floor: `cvFloorCarve(x,z,h)` (pure, cheap, 1 line in `terrain-height.js`) sets the ground under every void to its floor, under every rock block to `fy` (blended in from the block's edge over `inner` m; the rock hides it), along `pads` (ramps and shelves) and digs `pits` (tide-pool dimples). So monsters, spawns and the server's movement checks see a normal heightmap; the rock above it is client mesh and client collision.
- **Mesh** (`cvMesh` / `cvMeshGen`, a generator the streaming scheduler runs a slice per frame as job kind `'v'`): surface nets with a Newton step onto the true surface, gradient normals, triangles buried under the ground dropped, vertex colours (strata, wet rock near the sea, ambient occlusion from the field). Cell size `CVC.cell`: 1.4 m desktop, 1.9 m phone (LOW), 2.6 m light (LITE).
- **Collision** is the field itself: `cvResolve` pushes the hiker out of walls at body height and refuses a climb steeper than `SLOPE_MAX` (a kerb up to 0.45 m is a stair); `cvGroundAt(x,z,y)` is the rock surface a hiker with feet at `y` can stand on (a ledge up to `CV_STEP` = 0.9 m above the feet; an arch's top, a roof); `cvCamBoom` shortens the third-person arm; `cvShade` (rays up and out) darkens the light: `cvLightTint` multiplies the hemisphere light, sun and fog and pulls the far plane in. Where two sites' boxes overlap (a turned site has a big world box) `cvSdfW` takes the rock of either.
- **Keep-out**: `cvNear(x,z,m)` is asked by `nearPath`, so trees, props and monster spawns stay off a site.

## 2. Hooks into other files (each one line, marked `// caves:`)

| File | Hook |
|---|---|
| `src/shared/terrain-height.js` | `// caves: floor`: `cvFloorCarve` wraps the other carves |
| `src/shared/village-helpers.js` | `nearPath` begins with `cvNear` (keep-out) |
| `src/game/world/zone-props.js` | `terrainColor`: `cvGroundTint` (the shelf's rock colour) |
| `src/game/world/streaming.js` | job kind `'v'` (the mesh of the next site in range, `cvNeed` / `cvBuildJob`) |
| `src/game/main/loop.js` | `cvNeed()` keeps the stream pump awake; `cvUpdate(dt)` once a frame |
| `src/game/world/time-of-day.js` | `cvLightTint` before `applyEnv` |
| `src/game/player/movement.js` | `cvResolve` after `worldBounds`; `cvGroundAt` in the ground max; `cvCamBoom` in the camera arm |

`grep -rn "// caves:" src` lists them; the test fails if a hook is missing (the page does not boot with the caves).

## 3. Adding a site

Create `src/shared/caves/<id>.js` starting with `//@ ...`, call `defineCave({id,x,z,yaw,fy,pal,sea,inner,strata,rough,n0,dark,rock,voids,pads,pits,walk})` and add the file to `src/manifest.json` after `caves/foothill.js`. Nothing else changes. A bad entry (no id, NaN, empty rock, unknown void, empty tunnel/pad, duplicate id, over 400 m, bad walk) is left out, warned about and listed in `CV_BAD`; the test fails naming it. `walk.under` (a path through the voids) and `walk.top` (a path over the rock) are checked with the real movement code. Rules of thumb: a void's bank (default ~5 m) lowers the ground outside it, so keep every void well inside a rock block; make the rock block the full extent of the cave.

## 4. The sites (all at placeholder x,z: the re-pointing task moves them)

| id | where (placeholder) | what |
|---|---|---|
| `arches` | Sunscar west coast (-976,232) | the photo's sandstone sea cliff: five arches, a passage and a hall behind, a free-standing stack arch, pitted tide-pool shelf (46 pools) |
| `seacave` | Gloamhorn south cliff (-1543,-757) | Sea Caves arena: mouth, 26 m hall under the plateau (Captain Dredge's arena) with alcoves, skylight, two flooded basins, a ramp up the cliff |
| `wrecker` | Lantern Isle islet (-1530,-702) | a tunnel through the islet, mouth to mouth |
| `mine` | Greyspine southern slope (-686,-546) | adit, branch gallery, stope; grey rock |
| `foothill` | home forest north rim (332,-342) | a mossy knoll with a walk-through tunnel and a chamber |

The Gloamhorn hold's painted cave mouths and `buildGloamHold` are untouched; the hall sits on the Captain's arena flat (`ARENA_M35`), the carve overrides it inside the site.

## 5. Test and numbers

`python3 build.py && node tools/caves-smoke.js` (`--fast`: the part that needs no build). Registered in `tools/tests.json`. Checks: the registry and bad entries; the carve changes only the inside of a site's box and the floor under every void equals the cave floor; the mesh lies on the field, winds outward, has air outside and rock inside every face, and agrees with the field's highest rock over random columns; every `walk` point is reachable over the heightmap and walkable with the real movement code; the camera arm never ends in rock; a sheer wall is a wall; the page builds a site's mesh when you are within 420 m and not before; the hall is darker than the plateau; the triangle budget.

Measured (biggest site, `arches`/`seacave`): about 23.7k triangles on a desktop, 13.1k on a phone, 7.2k in light mode; all five sites 58k / 31.8k / 17.2k, but only sites within 420 m are built and only those near the camera are drawn. `cvGroundAt` costs 12-17 microseconds a call; the mesh of the biggest site builds in about 0.8 s on a desktop (a generator: one slice per frame). The server's cost is the carve per `rawHeight` call inside a site's box (a handful of distance tests), nothing elsewhere.

## 6. Notes for later

- A site is placed by plain `x,z`; moving it moves everything (box, carve, mesh). Check `node tools/caves-smoke.js` and the zone/arena smokes (`slope-smoke`, `gloamhorn-smoke`, `sunscar-smoke`, `greyspine-smoke`, `coasts-smoke`).
- `follow:true` samples `rawHeight` with the carve switched off (`CV_NATURAL.on`) on a 2 m grid (`cvTopGrid`), built on first use.
- To see a site without the game: `node tools/caves-preview.js out.png --site seacave --at x,y,z --look x,y,z` (headless Chromium, `--cell`, `--fov`, `--size`, `--dim`).
