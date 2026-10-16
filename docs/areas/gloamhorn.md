# The Gloamhorn (6th land, levels 30-40) and Wraithwick

The old Stormhorn of `docs/WORLD.md`, renamed and made a permanently dark, gothic land: a narrow hooked horn of heath over sheer sea cliffs west of the Greyspine, always a violet dusk with a low moon, sea fog and a steady gale. It opens with the Mountain Golem (the neck rock fall). No main-quest steps: villagers' small talk and quest-board notices only. Test: `node tools/gloamhorn-smoke.js`.

## Code map

| What | Where |
|---|---|
| The ground: the spine `GLOAM_PTS`, `gloamGround`, `gloamIn` (metres inside the cliff edge), `gloamCoast`, 16 sea stacks `GLOAM_STACKS`, 5 wrecks, 9 cave mouths, the lighthouse `GLOAM_LIGHT`, the Captain's hold `GLOAM_HOLD`, the reserved door `GLOAM_DG_DOOR`, `gloamKeepOut` | `shared/gloamhorn.js` |
| Land test `inGloam(x,z)` (x < `GW0` and north of the border), `GW0`, `GLX`, `WX0 = GW0 - GLX`; `coastDist` and `baseHeightRaw` branches | `shared/terrain.js` |
| The Greyspine meets it: `greyspineHeight` eases into `gloamGround` west of `GW0 - 40`; the neck gate `GREY_GATES[1]` at `x = GW0 + 56`, the gate hold along the whole wall | `shared/greyspine.js` |
| Wraithwick `VIL6` (`layoutVillage`, seed 6161), its row in `CIRCLES` (`open: g => g.gloam >= 2`) | `shared/wraithwick.js` |
| Zones m30..m40 (R 100, along the spine), the two boss arenas `ARENA_M35` / `ARENA_M40`, `gloamZoneAt` | `shared/gloamzones.js`, `zoneAt` in `shared/zones.js` |
| 22 monsters (two per level), `CAPTAIN_DEF`, `WARDEN_DEF` and their adds, `BOSS_DEFS` rows | `shared/monster-defs.js` (the `bat` family: `game/combat/monster-gloam.js`; ghost looks `monster-spirits.js`; `siren` flag in `monster-desert.js`) |
| 12 boss skills (2 per class per boss), materials, quest notices | `shared/classes.js` (`anchorswing` ... `undertow`, `blackcleave` ... `nightfall`), `shared/drops.js` (`MAT_NAMES`), `shared/quests.js` (`BOSS_QUESTS`) |
| Boss kits `captain`, `gloamwarden`; the `gloom` ground zone | `server/boss-kits-gloam.js`, `ZONE_HIT` (`server/boss-fx.js`), `ZONE_COL` (`game/combat/boss-fx.js`) |
| Gate and save: `gear.gloam` (0..2), `reachWraithwickP`, `respawnVil`, the `gloam` event, dev commands | `server/players.js`, `server/economy.js` (`devP`: `gloam`, teleports `wraithwick`, `captain`, `warden`, `gloamvault`), `shared/items.js` (`newGearFor`) |
| Zone tiers: `gloam` in `ZTIER_LANDS`, opened by `gloamwarden` (not in the symbol) | `shared/tiers.js` |
| Resource nodes: 5 per zone m30..m40 (rime ore, frostpine, snowmoss) | `shared/professions.js` (rng 5155) |
| The perpetual dusk (blend over the neck, 120 m), `GLOAM_SKY.k`, `gloamTint` | `game/world/gloam-sky.js` (hook in `time-of-day.js`) |
| Ground colours, plants, stones | `game/world/terrain-color-gloam.js`, `generation-chunks.js` (own branch: `bareGround` is true all over the west) |
| Meshes: Wraithwick, the Gloam Light (dim lamp, pale beam every 14 s), wrecks, caves, the Captain's hold, cairns and standing stones, the sealed door | `game/village/buildings-gloam.js` (`buildGloamhorn`, `updateGloamhorn`) |
| People (8 named + fillers), small talk `SMALLTALK6` | `game/village/villagers.js` (`vil:6`) |
| Music `gloam1` (30-35 and Wraithwick) / `gloam2` (36-40); a steady gale at `GLOAM_SKY.k` | `game/audio/music.js`, `game/audio/rain.js` |
| The land map, travel window, zone label | `game/ui/map.js` (`LANDS.gloam`), `travel.js`, `time-of-day.js` (`updateZoneLabel`) |

## Numbers

- Rectangle: `WX0 = GW0 - 720 = -1740` (`GW0 = HX0 + GDX = -1020`). All Greyspine and Sunscar geometry keeps its coordinates (they use `GW0`, no longer `WX0`).
- Ground: a plateau 38 m up (`GLOAM_TOP`), cliffs rise from the waterline in 9 m, sea floor -5. The spine is about 966 m long; Wraithwick at (-1116, -787) h 38; the lighthouse at the tip (-1551, -1153).
- Zones: m30 Wraithwick Heath, m31 Wreckers' Reach, m32 The Cairn Fields, m33 Drowned Meadow, m34 Siren Cliffs, m35 Gallows Down, m36 The Mourning Stones, m37 Banshee Tor, m38 Vault Heath, m39 Gargoyle Crag, m40 Lanternfall; arenas mboss35 (The Sea Caves, (-1530, -795)) and mboss40 (The Gloam Light, about (-1572, -1124)).
- Rolls (`docs/ROLLS.md`): `res` / `acc` 0.10 at level 30 rising 0.02 a level to 0.30 at 40 (every kind has one or both); both bosses 0.35.
- Bosses: Captain Dredge (35; cannon volleys, the anchor rake, deckhands, a tide wall, a broadside, the whirl) and the Gloam Warden (40; lantern beams, gloom pools, the wail ring, tentacle slams, a soul-lantern shield, the turning beam wheel).
- Reserved door: `GLOAM_DG_DOOR` = `{id:'gloamvault', name:'The Gloamvault', x:-1664, z:-969, r:12, rot:-1.35}`, zone m38 (Vault Heath), ground h 36. Now the real door of the Gloamvault (`DG_ENTRANCES.gloamvault`, `buildings-dungeon-gloam.js`; docs/DUNGEON-THEMES.md section 12). The zone m38 lies only 25 m from Banshee Tor's edge there.

## Pitfalls

- `inGloam(x,z)` must be asked **before** `inGrey` (also true there): `landAt`, `vilAt`, `zoneAt`, `respawnVil` and the music / label code do.
- Anything that used `WX0` as "the Greyspine's west wall" now means `GW0`. Fresh code that clamps to the world keeps `WX0`.
- `bareGround` is true everywhere west of `HX0`; the Gloamhorn plants in its own branch (`gloamIn(x,z) >= 14`, `gloamKeepOut`).
- Sea stacks count as land for `coastDist` and are terrain (`gloamGround`), not meshes.
- The sky blend runs on the camera's position (`gloamDepth`); it changes `envCur` after `weatherTint` and before `dgGloomTint`.
- No snow falls here: `greySnowAmt` is 0 at the plateau's height.
- The festival's name must not appear in `src/` or `docs/` (the smoke test scans for it).

## Left out (also in `docs/NOT-BUILT.md`)

(The Gloamvault dungeon is built: docs/DUNGEON-THEMES.md section 12.) (the skill-set sources are built: `SS_SOURCES.gloam`) main-quest steps and the lamp-room story (`docs/STORY.md`); the land on the docs world map (it stays fog); recorded music; a shared zone-tier symbol for the land.
