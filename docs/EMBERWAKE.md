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
| `shared/vale.js` | `vilAt` returns Coralhaven (`VIL8`) for the isles |
| `shared/terrain-height.js` | `ewWayPad`: the flat pads under the two waystations' circles |
| `shared/emberwakezones.js` | `ewZoneAt` leaves the village and a 30 m ring round each waystation without a zone (no camps) |
| `server/combat.js` | `rewardKill`: Oldhorn's fall calls `openIslesP` (gear.isles 1) |
| `game/ui/world-map.js`, `world-map-data.js` | the isles are a land of the world map (banner, fog, pin); the sea banks lift when every land is open (`wmapAllOpen`) |
| `game/ui/map.js` | `LANDS.isles`, `landHere`, `landOpen` (`gear.isles`), the land map's Coralhaven and waystation labels |
| `game/audio/music.js` | `isles1` (levels 42-45, Coralhaven) and `isles2` (46-50, the Cenote) |
| `shared/raids.js` | `'isles'` in `RD_LANDS` |

## Coralhaven and the waystations (W2)
- **The way in is the circles.** Oldhorn's fall sets `gear.isles` 1 (`openIslesP`, `server/players.js`) and the harbour-master sails: Coralhaven's circle (`CIRCLES` id `coralhaven`, `open: g.isles>=1`) is a destination from every attuned circle. Walking into Coralhaven sets `gear.isles` 2 (`reachCoralhavenP`) which wakes the two waystation circles `zotchul` and `urkuwara` (`open: g.isles>=2`). Saved as `gear.isles` (0..2, sanitized); the admin tool has a `isles` command (`devP`).
- **Coralhaven** `VIL8` (`shared/coralhaven.js`): the home village's plan on `EW_HUB`, the road facing north; `CH_LANDING` is the harbour jetty (Eleaka stands at `anchors.landing`). Meshes `game/village/buildings-isles.js` (`buildCoralhaven`): stilt houses, thatch hip roofs, a coral basin and totem, canoes. People `game/village/villagers-isles.js` (Makoa, Lani, Eleaka, Ottah the Tidekin trader, Pono the smith, Mele the board, Nalu the healer, Old Hina, Kekoa) and filler villagers (about one in seven Tidekin). Music: the home village's theme until a track exists.
- **Waystations** `EW_WAYS` (Zotchul, Jungle Edge; Urkuwara, Highland): village-shaped records like the Deep Cave's mouth, with a flat pad, a circle, a stone landmark (`buildWaystations`) and two people each (`WILD_SITES` zotchul, zotchul2...). No shop, no quest board; the board and shops are Coralhaven's.
- `/stuck` in the isles goes to Coralhaven only; nobody on the mainland is sent across the sea to it.
- Tests: `emberwake-smoke` (the village, the waystations, the harbour gate and the circle trips), `client-smoke` (the travel window lists 11 circles).

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
The volcano isle (`EW_ISLANDS[3]`, `EW_VOLC`) is a separate island with no way on foot (the boats come later); its interior is a low placeholder dome. Zones `e49`, `e50`, village slot `VIL9`, the boss `sinkwarden` (level 50, a long multi-phase fight), a high-polygon volcano model with a phone fallback, `WX.ash`, `EW_VOLC_DOOR`, main-quest steps E3 (the destination) and E6-E10.
