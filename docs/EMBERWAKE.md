# The Emberwake Isles (zone 8, stem `emberwake`, land id `'isles'`, levels 42-50)

The last land: four islands in a line south of the old map, mostly human with a few Kin, inspired by Polynesian (Coralhaven), Maya (the jungle) and Inka (the highlands) cultures. The plan, with the decisions and the open items, is `final-zone-plan/final-zone-plan.html` in the project files. This file is the code map.

## What is built (W0, the ground)
- **The strip.** `docs/world-atlas.py` section 13 appends rows below the old canvas (`ISL_Z1` = 2100, the world's new south edge `WZ1`): four islands in a row (the Landing's island, Coralhaven's island, the east isle, the volcano isle), **joined only by bridges** (the atlas roads `Tide` from the Amber Reach's south cape, `Reef`, `Strait`, `Ember`: 96-144 m of open sea between the islands; `roads.js` lays planks over the sea), seven zones `e42..e48` (the Landing's two on the first island, the jungle's on the second, the east isle's three), Coralhaven's hub on the second island. **Every old node is untouched** (checked by decoding the old and the new bake and comparing; do it again after any change: the script is deterministic). Bake: `python3 docs/world-atlas.py --js src/shared/world-atlas-data.js` (45 s).
- **The land.** `waLandId` = 7; `inIsles(x,z)` (`shared/terrain.js`), `landAt` = `'isles'` (`shared/tiers.js`). Ground: `waForm` case 7 and `WA_ISLE_W` (`shared/world-atlas-ground.js`). Islands, hub, zone keys: `shared/emberwake.js`.
- **The zone-tier symbol** (the one past zones forgot): `'isles'` is in `ZTIER_LANDS` and `ZTIER_SYMBOL_LANDS`, `ZTIER_BOSS.isles = 'tuila'` (the boss comes in W3), `newZt`, `ZTIER_NAMES`, `.zs.isles` in `styles/22-tiers.css`. Eight lands x seven tiers = 56 points = +560%. `tools/tiers-smoke.js` and `emberwake-smoke.js` assert it.
- **The far lands** (`game/world/far-lands.js`) no longer draw the old placeholder isles; they draw a few islets beyond the new edge and the smoke over the volcano isle (`FAR_SMOKE`).
- Test: `node tools/emberwake-smoke.js`.

## Hooks into existing files (`// emberwake:`)
| File | Hook |
|---|---|
| `shared/terrain.js` | `inIsles` |
| `shared/vale.js` | `vilAt` returns Coralhaven (`VIL8`) for the isles |
| `shared/terrain-height.js` | `ewWayPad`: the flat pads under the two camps |
| `shared/emberwakezones.js` | `ewZoneAt` leaves the village and a 30 m ring round each camp without a zone (no camps) |
| `server/combat.js` | `rewardKill`: Oldhorn's fall calls `openIslesP` (gear.isles 1) |
| `game/ui/world-map.js`, `world-map-data.js` | the isles are a land of the world map (banner, fog, pin); the sea banks lift when every land is open (`wmapAllOpen`) |
| `game/ui/map.js` | `LANDS.isles`, `landHere`, `landOpen` (`gear.isles`), the land map's Coralhaven and camp labels |
| `game/audio/music.js` | `isles1` (levels 42-45, Coralhaven) and `isles2` (46-50, the Cenote) |
| `shared/raids.js` | `'isles'` in `RD_LANDS` |

## Coralhaven and the waystations (W2)
- **The way in is the Tide Bridge on foot.** Oldhorn's fall sets `gear.isles` 1 (`openIslesP`, `server/players.js`), which lifts the barrier of the Tide Bridge at the Amber Reach's south cape (`barLocked(6,7)` in `shared/barriers.js`; the totem gate and its reed-mat barrier are `buildTideGate` / `ewGateUpdate` in `buildings-isles.js`, placed at `EW_TIDEGATE`). Then the Tide and Reef Bridges lead over the Landing's island to Coralhaven. Walking into Coralhaven sets `gear.isles` 2 (`reachCoralhavenP`), which wakes Coralhaven's circle (`CIRCLES` id `coralhaven`, `open: g.isles>=2`): **the isles' only teleport circle**. Saved as `gear.isles` (0..2, sanitized); the admin tool has a `isles` command (`devP`).
- **Coralhaven** `VIL8` (`shared/coralhaven.js`): the home village's plan on `EW_HUB`, the road facing west to the bridge (Eleaka stands at `anchors.landing`, by the road). Meshes `game/village/buildings-isles.js` (`buildCoralhaven`): stilt houses, thatch hip roofs, a coral basin and totem. People `game/village/villagers-isles.js` (Makoa, Lani, Eleaka, Ottah the Tidekin trader, Pono the smith, Mele the board, Nalu the healer, Old Hina, Kekoa) and filler villagers (about one in seven Tidekin). Music: the home village's theme until a track exists.
- **Camps** `EW_WAYS` (Zotchul in the jungle, Urkuwara on the east isle's terraces): village-shaped records with a flat pad, a hearth and stone landmark (`buildWaystations`) and two people each (`WILD_SITES` zotchul, zotchul2...). **No circle**, no shop, no quest board; the board and shops are Coralhaven's.
- `/stuck` in the isles goes to Coralhaven only; nobody on the mainland is sent across the sea to it.
- Tests: `emberwake-smoke` (the islands apart without the bridges and joined by them, the tide gate, the village, the camps, the circle trips), `atlas-smoke` and `slope-smoke` (every zone and the volcano reachable over the decks), `client-smoke` (the travel window lists 9 circles).

## The two world bosses (W3)
- **Places** (`docs/world-atlas.py` section 13, `WA_POIS` of land `isles`, pinned by hand on the flattest ground 70 m or more from the shore): Ocelo's arena in zone 45, Tuila's in zone 46, the Cenote's dungeon door in zone 44 (`EW_DOOR`), the Seven Gates raid on Condor Heights (`EW_GATES`, zone 48). `shared/emberwakezones.js`: `ARENA_E45` (`eboss45`, the Jaguar Court) and `ARENA_E46` (`eboss46`, Tuila's Tidepool), `ewKeepOut` (nothing is placed at random on the village, the waystations, the door, the raid or the arenas).
- **Ocelo, the Sun-Jaguar** (level 45, fire, `feline` model, kit `jaguar`): pounce, double rake, obsidian volleys that leave ember pools, rolling sun-disc lanes, and from phase 2 the stalk (hidden and immune, he rises under three or four players in turn). Add: the Jaguar Acolyte.
- **Tuila, the Tide-Caller** (level 46, water, `djinn` model with the siren flag, kit `tidecaller`): flood waves with a gap, whirlpools under the nearest and the farthest player, the ebb (a pull toward her, then a ring of 8 m falls on the spot), Tide Spirits. **Her fall opens the zone tier** (`ZTIER_BOSS.isles`).
- Each drops six skills (a skill and a burst per class, level 45 / 46, 10% each: `sunclaw` ... `whirlpool` in `shared/classes.js`) and a material (`MAT_NAMES`). Skill sets from them are W5.
- Files: `shared/emberwake-bosses.js`, `server/boss-kits-isles.js`; test `node tools/emberwake-bosses-smoke.js`.

## Side quests (W4)
Three chains (`saltwatch`, `strait`, `terraces`) in `shared/side-quests.js`, all from Coralhaven's people; details in `docs/SIDE-QUESTS.md`. The story is base settings only: the isles keep a Crown-forgotten sun-and-sea court, the stars going out in the east, and seven gates that count. Yuval co-writes it zone by zone; no main-quest steps are added (the main quest ends at act IV).

## The Cenote of Hollow Stars (W6)
The isles' dungeon (zone e44's door `EW_DOOR`, boss Ahmetl at level 48, pays only level-40 pendants): `docs/DUNGEON-THEMES.md` section 14. Files: `shared/dungeons/themes/cenote.js`, `server/dungeons/boss-kits-cenote.js`, `game/dungeon/view-cenote.js`, `game/village/buildings-dungeon-isles.js`; the level-40 pendant family in `shared/dungeon-rewards.js` / `pendants.js`; test `node tools/cenote-dungeon-smoke.js`.

## The Seven Gates raid (W7)
`shared/raids/sevengates.js` at `EW_GATES` (zone 48): boss pool Ocelo and Tuila, material Gate Tally, look `gates` (`game/raids/structure.js`, `structure-extras.js`). `docs/RAIDS.md` section 1.

## Left for later steps
The sets' signature outfits are built (`game/outfits/meleni.js`, `tzaya.js`, `atuqa.js`, their weapon models `game/combat/weapon-shapes-isles.js`, designs `docs/skillkits/looks/`; villagers wearing them are not done). Left: the volcano pass below, the boats to the volcano isle, a final balance pass on the ladder of Meleni, Tzaya and Atuqa (their `node tools/skillsets-ladder.js` rows warn: Meleni is above and the other two below their roles' bands).

## Reserved for the volcano (not built, Yuval's later pass)
The volcano isle (`EW_ISLANDS[3]`, `EW_VOLC`) is reached on foot over the Ember Bridge from the east isle (its fringe has a few trees and nothing else yet); its interior is a low placeholder dome. Zones `e49`, `e50`, village slot `VIL9`, the boss `sinkwarden` (level 50, a long multi-phase fight), a high-polygon volcano model with a phone fallback, `WX.ash`, `EW_VOLC_DOOR`, main-quest steps E3 (the destination) and E6-E10.

## View distance and the jungle (the isles review)
- The fog, the chunk streaming radius, the lazy ground colouring and the server's `SNAP_PLAYERS` (420) grew with `VIEW_K` (`game/core/setup.js`: 1.7, a phone in `LOW` 1.3, `LITE` 1, a strong machine 2; `time-of-day.js`, `streaming.js`).
- The tropical plants are `game/world/plant-models-isles.js` (`ceiba` about 34 m with buttress roots and an umbrella crown, `jtree` / `jtree2` canopy trees, `tpalm` / `tpalm2` coconut palms, `banana`, `treefern`); the placement is the isles branch of `genChunk` (`generation-chunks.js`): about twice the old tree count per chunk, a ceiba about every 11 m, the Landing's island and the beaches planted with palms.
- Bare skin of an outfit stays the wearer's skin when the top or bottom is recoloured (`ofPaint`, `outfit-tools.js`; Sefi's fur is its skin).
