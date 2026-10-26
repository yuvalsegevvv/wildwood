# Zone dressing: the ground and props that match each zone's monsters

Area guide. Code: `src/game/world/zone-props.js` (themes, placement), `zone-props-models.js` (helpers, the home forest's and the Vale's props), `zone-props-models2.js` (the Reach, Greyspine, Sunscar, Gloamhorn and ruins). Test: `node tools/zoneprops-smoke.js`. See the props: `node tools/zoneprops-preview.js out.png [--kinds gobhut,web,toro] [--cols 6] [--cam 0.6]` (a gallery of the models in real WebGL, no game build needed). In the game: `node tools/shot.js out.png --unlock --at x,z,deg` (`--unlock` opens the lands first; the facing is 0 = north (-z), 90 = west; stand 25 m south of a camp).

## What it does

- **Ground tint** (`zpGroundTint`, called by the `terrainColor` wrapper in `zone-props.js`; the old function is `terrainColorBase` in `terrain-color.js`): each zone has a colour and a strength (0.15-0.45) in its `zpTheme` row. Zones are looked up on a 12 m cell grid (`zpCellZone`, filled lazily from `zoneAt`), blended bilinearly, so the tint fades over a zone's border instead of stopping at it. Less on steep rock, none under water. Boss arenas have a theme row too (their zone is the arena disc).
- **Themed props** (`genZoneProps`, the last step of `genChunk`): per chunk 150 attempts (x `Q`); each tries the zone's density, picks a weighted kind (an entry with a cluster minimum only stands where `zpClu` noise is high: camps are patchy), checks the land's keep-outs (`zpBlocked`: villages, roads, tunnel, story spots, dungeon doors, the Sunscar's / Gloamhorn's / Reach's / Greyspine's own lists), and places it. An entry's `with:[...]` puts a fire, totem or banner 3-5 m from a hut.
- **Boss surroundings** (`ZP_BOSS[arenaKey]`): rings of themed props from the arena's edge + a..b metres, the same slots for every chunk (seeded by the arena key), only those inside the chunk are placed. They add to the arenas' own dressing in `buildings*.js`.
- **Ruins**: five layouts (`ZP_PLANS`: hall, gate, colonnade, tower stump, shrine yard), each one merged prop kind (`ruinplan0..4`), 5 attempts per chunk gated by `zpAge` (home 0.10, Vale 0.12, Reach 0.22, Greyspine 0.30, Sunscar 0.34, Gloamhorn 0.50) and a patchy noise; tinted per land (`zpRuinTint`).

## Zone to theme (from the monster list)

Goblin Woods / Hobgoblin Warrens / Chieftain's Hold: hide huts, war huts, fires, totems, palisades. Mushroom Hollow / Deathcap Dell: toadstools. Beetle Thicket / Ironshell: shells and burrows. Boar runs: wallows, barricades, ribs. Bog / Rotwood / Ember Flats: pools, dead stumps, rotten logs, cinder rock. Ghostlight Marsh, Glacier Tongue, Vault Heath: spider webs, web domes, cocoons. Oni Crags: iron clubs and spikes. Fox Hills: fox statues and torii. Tengu Peaks: prayer flags. Hunters' Wold: tents, drying racks. Bonefrost Barrow: mounds and frost graves. Miners' Scree: carts, timber frames, ore. Gryphon Cirque: nests. The Sunscar: raider tents, hoodoos, salt, sarcophagi, obelisks, glass. The Gloamhorn: graves, lamps, wrecks, gallows, crypt, gargoyles. Full table: the `zpTheme` rows.

## Adding a prop or a theme

1. `zpDef('id',{gen,glow?,mat?,w,hgt,sink,rad,cast,tilt})` in a models file: `gen()` returns ONE painted geometry (`merge([...])` of `zpBox` / `zpCyl` / `zpBlob` / `zpDome` / `zpSpire` / `zpRibs` / `zpLathe` / `zpStrand`), base at y=0, about 1 unit = 1 m. `glow()` is a second geometry drawn unlit (lantern panes, embers, rune lines). Keep it under ~800 triangles (the smoke test fails above 1,500). Draw from `h3` / the part index, never the global `rand`.
2. Add it to a `zpTheme` row (or `ZP_BOSS`). A row naming a missing kind lands in `ZP_BAD` and the smoke test fails.
3. A new zone needs a `zpTheme` row, even one with no props (`dens` 0): the smoke test fails for a zone without one.

## Costs and pitfalls

- One instanced mesh per kind and chunk (plus one for the glow part), with the three own materials (`zpMat`: not `matRock` / `matGlow`, which non-instanced meshes also use; r128 picks a program per material once). Distance culled at 118 m (85 on a phone, no shadows there). The smoke test asserts a chunk adds at most 16 draw calls (typical 6-10).
- Props are placed AFTER the plants in the same chunk and draw from the chunk's `rand` last, so no tree moves. They only avoid trees by `canPlace` (collision grid), not the other way round, so a camp can sit in a thin wood.
- `terrainColor` is hot (every ground vertex, every grass tuft). Do not call `zoneAt` in it; use `zpCellZone`.
- A prop on a slope sinks its base by `sink` m; keep `w` honest, it is the spacing radius.
