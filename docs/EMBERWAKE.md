# The Emberwake Isles (zone 8, stem `emberwake`, land id `'isles'`, levels 42-50)

The last land: four islands in a line south of the old map, mostly human with a few Kin, inspired by Polynesian (Coralhaven), Maya (the jungle) and Inka (the highlands) cultures. The plan, with the decisions and the open items, is `final-zone-plan/final-zone-plan.html` in the project files. This file is the code map.

## What is built (W0, the ground)
- **The strip.** `docs/world-atlas.py` section 13 appends rows below the old canvas (`ISL_Z1` = 2100, the world's new south edge `WZ1`): four islands, a reef causeway (Coralhaven | Jungle) and an isthmus (Jungle | Highland), seven zones `e42..e48`, Coralhaven's hub. **Every old node is untouched** (checked by decoding the old and the new bake and comparing; do it again after any change: the script is deterministic). Bake: `python3 docs/world-atlas.py --js src/shared/world-atlas-data.js` (45 s).
- **The land.** `waLandId` = 7; `inIsles(x,z)` (`shared/terrain.js`), `landAt` = `'isles'` (`shared/tiers.js`). Ground: `waForm` case 7 and `WA_ISLE_W` (`shared/world-atlas-ground.js`). Islands, hub, zone keys: `shared/emberwake.js`.
- **The zone-tier symbol** (the one past zones forgot): `'isles'` is in `ZTIER_LANDS` and `ZTIER_SYMBOL_LANDS`, `ZTIER_BOSS.isles = 'tuila'` (the boss comes in W3), `newZt`, `ZTIER_NAMES`, `.zs.isles` in `styles/22-tiers.css`. Eight lands x seven tiers = 56 points = +560%. `tools/tiers-smoke.js` and `emberwake-smoke.js` assert it.
- **The far lands** (`game/world/far-lands.js`) no longer draw the old placeholder isles; they draw a few islets beyond the new edge and the smoke over the volcano isle (`FAR_SMOKE`).
- Test: `node tools/emberwake-smoke.js`.

## Hooks into existing files (`// emberwake:`)
| File | Hook |
|---|---|
| `shared/terrain.js` | `inIsles` |
| `shared/vale.js` | `vilAt` returns the home village for the isles until Coralhaven (`VIL8`) exists (W2) |
| `game/ui/world-map.js` | `wmapPin` returns null in the isles until the world map paints them (W8) |

## Left for later steps
W1 zones and monsters, W2 Coralhaven + the waystations, W3 bosses (Ocelo 45, Tuila 46), W4 quests, W5 Kin parts / skill sets / cosmetics / professions, W6 the Cenote dungeon (pays only level-40 pendants), W7 the Seven Gates raid, W8 docs, the land map and the world map (`landHere`, `LANDS`, `WMAP_*`, `landOpen` have no isles entry yet), balance, soak.

## Reserved for the volcano (not built, Yuval's later pass)
The volcano isle (`EW_ISLANDS[3]`, `EW_VOLC`) is a separate island with no way on foot (the boats come later); its interior is a low placeholder dome. Zones `e49`, `e50`, village slot `VIL9`, the boss `sinkwarden` (level 50, a long multi-phase fight), a high-polygon volcano model with a phone fallback, `WX.ash`, `EW_VOLC_DOOR`, main-quest steps E3 (the destination) and E6-E10.
