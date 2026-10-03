# Rendering: vegetation, instancing, performance numbers

Area guide. Moved word for word from `CLAUDE.md` (sections 4, 8 and 9), where each item now has a short row; open this file when your task touches this area.

## Where to change what

### Vegetation / animals

`game/world/plant-models.js` (the low-poly models: what far plants and light mode draw), `plant-models-hi.js` (the desktop's detailed ones, the `*Hi` builders: conifers with drooping bough fronds, broadleaf crowns of leaf fans on forked limbs, bushes, ferns, rocks, logs, reeds), `grass-models.js` (grass tufts in 3 levels of detail, flowers), `generation-*.js` (placement; `addTreeKind` / `addGrass` / `addRocks` choose the models), `game/wildlife/animals.js`. `VD` (plant-models-hi.js) is the detail level: 0 light mode, 1 phones (curved grass only), 2 desktop. Levels of detail: `addInstanced(geo, mat, items, {lods:[{geo,from,frac}]})` in `instancing.js` decides per instance from its distance to the eye (the nearest level's geometry is `geo`); trees switch at 120 m, bushes 65 m, ferns 55 m, boulders 90 m, stones 45 m, grass 30 m and 62 m. A new plant: build a `*Hi` geometry from its own `mrng(seed)` stream (never the global `rand`: it would move the whole world's layout), keep its outline like the low-poly one so the switch does not show, use a double-sided material (`matBroadD`, `matConiferD`, `matBushD`) for open polygons

## Pitfalls

- three r128's `InstancedMesh` sets `frustumCulled = false` in its constructor, so every plant chunk within the fog was drawn, behind the camera too.
  `addInstanced` now turns it back on and fits each mesh's bounding sphere to its instances (`hgt` / `rad` say how big one model is: a loose sphere
  would cull nothing, a too tight one makes plants vanish at the screen's edge). That halved the triangles and paid for the detailed plants.
  A mesh per bucket and level made 5,000+ meshes and 2,700 draw calls: levels of detail are per instance now (one mesh per level, its buffers packed from a shared source), and a group 150 m beyond its draw range hands its buffers
  back (`lodRelease`, packed again by `lodAlloc`): a world walked end to end held 146 MB of level buffers before that and 7 MB after, which is the kind of thing that
  loses a WebGL context. Measure it headless: teleport the hiker over a grid of the whole world (a scratch script on `tools/headless.js` exposing `LODS`) and sum the buffers.
- **Every instanced mesh must have `instanceColor`.** r128 picks a material's shader program once, from whichever instanced mesh draws first, and never looks at
  `instanceColor` again. A material shared by meshes with and without colours (`matBark`: trunks and mushrooms, `matFlower`: stems and heads, `matAnimal`) crashes the
  render loop with "Cannot read properties of null (reading 'isInterleavedBufferAttribute')" whenever a coloured mesh happens to draw before an uncoloured one (it depends
  on what is nearest to the camera at the first frame, so it hits only some runs). `addInstanced` and `animMesh` give every mesh colours (white where there is no tint);
  `client-smoke` checks that none is bare. A new `InstancedMesh` made any other way must do the same.

## Reference numbers

- Measured costs (desktop, village): the client's JS is about 0.2 ms per frame (headless, no GPU); the world took about 1.1 s of JS to generate before the Hoarfrost Reach and takes about 2 s now (the heightmap is 1.7 times as big; 17% is `noise2`; the eroded hills added about 40% to `rawHeight`, and `buildGeometries` with every detailed plant takes 140 ms). The server ticks in under 5 ms with 40 players
  spread over the woods (about 4% of a core).
  Monster models (`node tools/monster-preview.js --all --stats`): slimes about 2,000 triangles (1 mesh), mushrooms 2,700 (3), beetles / spiders / crabs 2,400-3,400 (3-5), boars 2,600 (6), foxes 2,100-2,500 (6), wisps 1,400 (2), ghosts 2,200 (1), treants 5,000-7,500 (5), the goblin family 3,900-6,200 (11-13; the yeti 9,000 with its fur), bosses 4,500-9,100 (Akaoni 8,300, the Rootwarden 9,100, Vetrmaw 6,200 in 16 meshes); before the rework the goblin family was 14,000 each (the player's rig) and the rest 600-2,400. Building every kind takes about 400 ms, spread over the game by the build-on-first-sight rule.
  What the GPU draws (`renderer.info.render`, counting the shadow pass, a level-50 hiker in a meadow, the world fully grown): before the plant rework
  about 710 calls and 5.4 M triangles per frame, most of them instanced trees drawn behind the camera too (chunks are 110 m, fog ends at 230 m); after it
  about 340 calls and 3.5 M (frustum culling on, detailed plants near the eye). Other views: forest 2.8-3.0 M, the village vista 3.0 M, Hanami 4-5.4 M, Rimehold 3.3 M
  triangles; phones 280 calls and 1.2 M; light mode 335 calls and 1.0 M. A detailed oak is about 4,400 triangles, a spruce 2,500, a bush 1,900, a boulder 980,
  a grass tuft 180 (mid 55, far 24). If a change adds more, check these numbers first.
