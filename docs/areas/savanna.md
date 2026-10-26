# The Amber Reach (7th land, levels 37-45) and Tallgrass

Design and decisions: `docs/SAVANNA.md`. The land's file stem is `savanna` (not `amber`: that word means the upgrade material `gear.amb` and the gate flag `gear.amber`). The Kin features also have their own doc, `docs/KIN.md`.

## Code map

| What | Where |
|---|---|
| The ground, hub, gate, the nine zone records and the places on the atlas (door, boss sites, raid site, pier, Seven Pools, the Wet River) | `shared/savanna.js` (`SAV_*`), the atlas data (`docs/world-atlas.py` bakes `shared/world-atlas-data.js`; land id 6) |
| Land test `inAmber(x,z)` (**ask before `inSun`**, which is true there too), `landAt` = `'amber'`, `waLandId` = 6 | `shared/terrain.js`, `tiers.js`, `world-atlas.js` |
| The gate: `SAV_GATE`, `SUN_AMBER` (`shared/sunland.js`), held by `barHold` until `gear.amber` is 1 | `shared/barriers.js` |
| Zones `a37`..`a45` (`savZoneAt`, `SAV_ZONE_NAMES`), arenas `ARENA_A41` / `ARENA_A45`, `savKeepOut` | `shared/savannazones.js`, `zoneAt` in `shared/zones.js` |
| Tallgrass `VIL7`, `TG_BAOBAB`, `TG_LANDING`, its row in `CIRCLES`; `gear.tall` (0..2), `reachTallgrassP`, `respawnVil`, the `tall` event | `shared/tallgrass.js`, `server/players.js`, `game/net/client.js` |
| 18 monsters (two a level), `FAM` lines, drops | `shared/monster-defs.js`; models `game/combat/monster-savanna.js` (feline, swarm, bird, hoofed, hollowed) |
| Bosses Old Thunder and Oldhorn (defs, adds, `SAV_BOSS_ROWS` appended to `BOSS_DEFS`), kits `thunder` / `herdmother`, the `grassfire` and `greyfloor` ground zones | `shared/savanna-bosses.js`, `server/boss-kits-savanna.js` |
| 12 boss skills (`drop:'oldthunder'` / `'oldhorn'`), materials | `shared/classes.js`, `shared/drops.js` (`MAT_NAMES`) |
| Zone tier `amber`, opened by `oldhorn`, the symbol's seventh badge (`.zs.amber`, `22-tiers.css`; the symbol has no cap: +490% at most) | `shared/tiers.js` |
| Seasons (Greenfall / Goldfall), `savTint`, `savDryAt`; rain thinned in Goldfall | `game/world/savanna-sky.js` (hooks in `time-of-day.js`, `weather.js`) |
| Ground colours, acacia, baobab, tall grass, zone dressing | `game/world/terrain-color-savanna.js`, `plant-models-savanna.js`, `zone-props-models-savanna.js`, hooks in `generation-chunks.js`, `zone-props.js` (`zpTheme` rows) |
| Resource nodes (5 a zone, after the Gloamhorn's so no older node moves) | `shared/professions.js` |
| Tallgrass meshes, the Moot Baobab, the sealed pier | `game/village/buildings-savanna.js` |
| People (`vil:7`) and small talk `SMALLTALK7` | `game/village/villagers.js`, `smalltalk-savanna.js` |
| The Termite Cathedral: theme, Queen Ortha's kit, door, interior props | `shared/dungeons/themes/termitecathedral.js`, `server/dungeons/boss-kits-termite.js`, `game/village/buildings-dungeon-savanna.js`, `game/dungeon/view-termite.js`; the door's ground patch is the `termite` kind in `game/dungeon/entrances.js` |
| The Broken Moot raid | `shared/raids/moot.js` |
| Side quests `dawnseat`, `drought` | `shared/side-quests.js` |
| Kin parts (ears, tails, muzzles, horns, mane, fur, markings) | `shared/kin.js`, `game/character/model-kin.js`, `cospieces.js` (hook `// kin:`), `docs/KIN.md` |
| Signature sets Brindle, Dessa, Sefi: kits, outfits, skill looks, cave skills, weapon shapes | `shared/skillsets/<id>.js`, `game/outfits/<id>.js`, `game/skillsets/look-<id>.js`, `shared/cave/skill-2-burningglass.js`, `skill-3-seamsplitter.js`, `skill-4-tailwind.js`, `game/combat/weapon-shapes-kin.js` |
| Ring rolling (level-40 rings, the Ring Reroll Stone `gear.rsr`) | `shared/rolls.js`, `server/rolls.js` |
| Land map, world map, music `savanna1` / `savanna2` | `game/ui/map.js`, `game/ui/world-map.js`, `game/audio/music.js` |

Tests: `atlas-smoke` (the land's size and the gate), `savanna-bosses-smoke`, `termite-dungeon-smoke`, `raids-smoke`, `sidequests-smoke`, `cospieces-smoke`, `outfit-smoke`, `skillsets-v3b-smoke`, `cave-smoke`, `zoneprops-smoke`, `tiers-smoke`, `entrances-client-smoke`, `cosmetic-items-smoke`, `client-smoke`, `server-smoke`.

## Numbers

- Area 0.70 km², x -1810..-170, z 520..1130; the border with the Sunscar is the straight line z 690 (x -1060..-480).
- `MAX_ZONE_LV` is 45 (`shared/balance.js`); it moves the quest board's top level, so `client-smoke` and `server-smoke` cover it.
- Bosses: Old Thunder level 41 (arena key `aboss41`), Oldhorn level 45 (`aboss45`); the Cathedral's Queen Ortha is level 45 at +0, enter from 42.
- Nine named people; the Dawn Seat is held by Warden Oruvi.

## Pitfalls

- `inAmber(x,z)` must be asked **before** `inSun` (as `inGloam` before `inGrey`), and always with both coordinates.
- A look field is untrusted: Kin shapes go through `kinPart` (an own-property check on a prototype-less map), never a bare key.
- The glove test counts sets with a glove item (`cosmetic-items-smoke`): it is 9 with the three Kin sets; a new set with a glove changes it.
- The termite door patch must differ from the savanna ground by 0.07 or more (`entrances-client-smoke`); the ground there is already clay-coloured, so the patch uses a darker clay.
- Villagers of Kin folk are many at once on a phone: keep their extra triangles low.
