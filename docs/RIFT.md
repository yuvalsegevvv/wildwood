# Rifts

A rift is a tear in the world into a **void of glass**: a hub platform and four outer platforms joined by glass bridges, floating in a bright aura of blue, purple and pink. Glass monsters pour in, **wave after wave**, at **your level**, each paying **3x the XP** of the same monster in the world. It is an XP rift: it pays XP and nothing else. **Solo only.** **Rift energy** (100 at most, full in 28 hours, refilling online and offline) doubles a run's XP for 20.

Two kinds of rift are built. **The Shardmere** (`shared/rift/shardmere.js`) is the XP rift. The **elemental rifts** (section 5, step 17a of the skill revamp) pay Essence for the Awakening trees: the first is **the Taproot**, Wildwood's root rift (`shared/rift/taproot.js`, Prime Essence). Another rift is one more data file.

Stem `rift`, prefix `rift` / `RIFT_`. Plan and decisions: the project's `rifts-plan/PLAN.md`.

## 1. Files

| File | What it holds |
|---|---|
| `shared/rift.js` | the numbers, `riftEnergyAt`, the registry `defineRift` / `RIFT_DEFS` / `RIFT_BAD`, `riftMobDef` (glass copies of existing kinds), `riftLayout` (the platforms as a dungeon layout), `riftNear` (the tear's clearing), the HUD row `DG_HUD.rift` |
| `shared/rift/shardmere.js` | the first rift: its tear, its aura, its seven glass kinds and the waves they join |
| `shared/rift/taproot.js` | the first elemental rift (Prime Essence): the model for every other one |
| `shared/essence.js` | the seven Essence materials (`ESSENCE`, `ESS_ORDER`, `essOf`, `essIdOf`, `essCol`) |
| `server/rift.js` | `gear.rift` and its sanitizer, the window (`MSG.rift`), a solo run in a rift slot, the wave kit `DG_KITS.rift`, `riftRewardS` and `RIFT_PAY` (what a rift pays, by its `reward` mode: `xp`, `essence`), the clear bonus, the death rule, leaving |
| `game/rift/rift.js` | the tear in the wild, the talk key, the window (`#rift`), the wave banner |
| `game/rift/view.js` | the void world: glass platforms, rims, hanging crystals, tears, the portal, the aura sky, the drifting shards, the light, the music theme `rift` |
| `game/rift/glass.js` | the glass monster material and the shatter on death |
| `styles/36-rift.css` | the window |
| `tools/rift-smoke.js` | the test |
| `tools/rift-site.js` | finds spots in the home forest's wilds for a tear |

## 2. Numbers (`shared/rift.js`)

| Name | Value | What |
|---|---|---|
| `RIFT_E_MAX`, `RIFT_E_FULL_H` | 100, 28 | energy cap; hours from 0 to full (one point every 16.8 min, by the server's clock) |
| `RIFT_E_DOUBLE` | 20 | a doubled run (refunded if you leave before the first kill) |
| `RIFT_LV` | 10 | the entry level; the run fights at your level |
| `RIFT_XP_K` | 3 | a kill pays 3x `xpFor(L)`, times every XP bonus `rewardKill` counts |
| `RIFT_HP_K`, `RIFT_DMG_K` | 0.6, 0.6 | glass monsters are brittle |
| `RIFT_WAVES`, `riftWaveSize(n)` | 10, 12 + 2n | 230 monsters, plus a Rift Herald (x8 health) on waves 5 and 10 |
| `RIFT_NEXT_PCT`, `RIFT_WAVE_S`, `RIFT_RELEASE_S` | 0.75, 40, 10 | the next wave at 75% dead or 40 s; a wave pours in over 10 s |
| `RIFT_ALIVE_MAX` | 45 | the most alive at once (the rest wait at the tears) |
| `RIFT_BONUS_KILLS` | 75 | the clear bonus: 75 same-level world kills' XP |
| `RIFT_RESPAWN_S` | 5 | one respawn on the hub; a second knock-out ends the run |
| `RIFT_SLOT0` | 16 | rift runs use the slots 16-31 (`DG_MAX_INST` 32); dungeons keep 0-15 (`DG_DG_SLOTS`) |

No coins, items or materials from kills or the clear; kills count for no quest, tier or gate.

**Reward modes.** A rift's data file names what it pays with `reward` (default `'xp'`, the Shardmere's). The engine calls only `riftPayOf(run)`; each mode is one entry of `RIFT_PAY` in `server/rift.js` with `kill(run,m,q,mb)` and `clear(run,p,mb)`, and its name is listed in `RIFT_REWARDS` (`shared/rift.js`), so `defineRift` leaves out a rift naming an unknown mode (`RIFT_BAD`). A mode may also have `wave(run,p,mb,w)`, called for each hiker when wave w begins (`essence` uses it). `riftPayOf` is the only thing the engine asks.

## 3. How it is built

A rift run **is a dungeon run object** (`server/dungeons/instances.js`) made by `riftRunNewS` in a rift slot: mission `'rift'` (not in `DG_MISSIONS`, so the Delve board never deals it; its kit is set as `DG_KITS.rift`), its theme the rift's entry, its layout `riftLayout` (3 x 3 tiles of 48 m), its bake `B.open` (the void is solid to walkers, never to hits, projectiles or the camera). One member, no party. That gives the slot, the walls, the flow field, the instance events and snapshot, the HUD and the results card unchanged.

Save: `gear.rift = {e, at, best, clears}`: the energy and the server time it was brought up to date; the client never sends it.

Protocol: `rift{a:'open'}` at a tear → `{t:'rift',a:'info',id,e,full,L,best,clears,lv,cost}`; `rift{a:'go',x2}` starts a run; leaving is the dungeons' `dg{a:'leave'}`. Events: `riftw [pid, wave]` and the dungeons' (`tp` with `dg.m === 'rift'`, `dge` at the end). The HUD tuple after the dungeons' three: `[wave, monsters left, seconds to the next wave, x2, XP so far]`.

## 4. Hooks (`grep -rn "// rift:" src`)

| File | Hook |
|---|---|
| `shared/dungeon-slots.js` | 32 slots, `DG_DG_SLOTS` 16 |
| `shared/village-helpers.js` `nearPath` | the tear's clearing: no tree, prop or camp |
| `server/dungeons/instances.js` | `dgNewRunS` takes a dungeon slot only; `dgWallAtS` and `dgHitOkS` see through the void |
| `server/dungeons/mobs.js` `rewardAllS` | `riftRewardS` |
| `server/dungeons/runs.js` | no puzzle stones (`dgSetupS`); `riftDownTickS` (`dgDownTickS`) |
| `server/dungeons/lobby.js` `dgLeaveP` | `riftLeaveP` |
| `server/players.js` `sanitizeGear` | `riftSanitize` |
| `game/dungeon/run.js` `dgRunEnter` | the layout and theme of a rift |
| `game/dungeon/view.js` | `riftViewBuild`, `riftViewTick` |
| `game/dungeon/look.js` `dgLookEnter` | `riftLookTune` |
| `game/dungeon/collide.js` `dgCamBoom` | the void does not push the camera in |
| `game/combat/monsters.js` `addMonView` | `riftGlassMat` for `pal.glass` |
| `game/combat/attacks.js` `onMonKill` | `riftShatter` |
| `game/village/talking.js`, `ui/panels.js`, `world/generation-setup.js`, `main/loop.js`, `index.html` | the talk key, the panel, `riftBuild`, `riftUpdate`, `#rift` |

## 5. The elemental rifts (step 17a)

Design: the skills revamp's PLAN section 5. A rift with `reward:'essence'` pays **Essence** and nothing else: no XP, no coins, no items. It is made by `defineElemRift(o)` (`shared/rift.js`), never by `defineRift` directly, so that every elemental rift shares one plan and no element is easier to farm.

| What | Value |
|---|---|
| `RIFT_ELEM_LV` | 28: the hiker level every elemental rift opens at (`R.lv`; the Shardmere keeps `RIFT_LV` = 10) |
| Wave plan, monster count, level rule | the engine's own: 10 waves, `riftWaveSize`, your level; `RIFT_ELEM_SLOTS` is the kind plan (slot i of a file's six monsters: first wave and weight) |
| `RIFT_ESS_FULL`, `riftEssFor(w)` | 12 for a full run: `round(12 * w / 10)` for the first w waves |
| Payment | wave w-1 is paid when wave w begins, the last wave at the clear; only a hiker who has killed something in the run is paid; a lost run keeps what it got through; the Double (20 energy) pays x2 |
| The material | `gear.awm['ess_<element>' or 'ess_prime']`, clamped to `MAT_MAX` (999) by `awkSanitize`; `awkEssenceP` adds; `awkPlanP` / `awkTakeP` spend it (the Awakening trees ask `ess_<element>`; element-less characters and the Wanderer ask `ess_prime`) |
| The monsters | all seven glass kinds of a rift carry its element (`el`), so the elemental wheel applies; `defineElemRift` leaves a rift out (`RIFT_BAD`) if one does not, or if `essence` is neither `'prime'` nor the rift's own element |

**A data file** (copy `shared/rift/taproot.js`): six `riftMobDef(base, id, name, {el, pal:{tint}})` and the Herald (a unique id each: a repeated id is refused), then `defineElemRift({id, name, blurb, door:{x,z}, aura:[3 hex], music:'rift', el, essence, herald, mobs:[6 ids]})`, and its path in `src/manifest.json` after `rift/taproot.js` (the server and the client groups load `shared` from the one line). The tear must pass the placement rules; `tools/rift-smoke.js` checks every elemental rift it finds (level 28, plan, element, the tear's land, village, road, coast, 250 m from other tears, camps). The map marker, the tear's model, the prompt and the window text all follow from the data.

| Rift (id) | Land | Pays | State |
|---|---|---|---|
| the Taproot (`taproot`) | Wildwood, 345 m east of the village at (368, 68) | Prime Essence (`ess_prime`), earth monsters | built |
| petal, sunlit, rime, long-night, stone, forge | Sakura Vale, Hoarfrost Reach, Greyspine | Air, Light, Water, Dark, Earth, Fire Essence | the card `haiku-rift-card.md` in the revamp plan folder |

Window and HUD: an essence rift's window says what it pays and its element; the HUD's last line and the results card show the Essence (`mb.got.mats`). The inventory lists Essence under the trophies (`essIcon`).

## 6. Modes, shapes, tiers and the coin and stone rifts (8 Nov)

Every rift plays its own **mode** on its own **shape**; glass monsters run **twice as fast** as the kind they copy (`RIFT_SPEED_K`).

| Rift | Land | Pays | Mode (`server/rift/<mode>.js`) | Shape |
|---|---|---|---|---|
| Shardmere | home | XP x3 | waves | the plus |
| Taproot | home | Prime Essence | heart: a root heart on the hub, a quarter of each wave breaks for it | a root tree |
| Petal | vale | Air Essence | gale: a platform glows, 3 s later its gust takes a third of your health | a ring |
| Sunlit | vale | Light Essence | beacons: stand in three beacons to light them, then the Herald | a sun road |
| Rime | hoar | Water Essence | thaw: frost fills in 45 s, kills melt it, full frost bites; 6 minutes, then the Rimecaller | a stair |
| Long-night | hoar | Dark Essence | lanterns: a dark look; four shielded cores (kill the wardens, channel 2 s), then the Herald | two wings |
| Stone | grey | Earth Essence | quarry: an immune colossus, four pylons (channel 3 s) open it | a mesa |
| Forge | grey | Fire Essence | gauntlet: five champions, fire vents, a 10-minute clock | a ring of forges |
| Gilded | sun | coins (15x a world kill, a clear 1500 more) | gale | a comb |
| Blade | gloam | Weapon Reroll Stones | quarry | a long cross |
| Bulwark | amber | Armor Reroll Stones | heart | a broken square |
| Charm | isles | Accessory Reroll Stones | lanterns | a double comb |

- **Shape** (`R.shape`): rows of H (hub), O (platform, two tears), o (stepping stone), `.` (void); neighbours are bridged; `riftShapeBad` checks it, `riftLayout` builds it (also `isles`, `mid` for the view).
- **Mode** (`R.mode`, `RIFT_MODES` text in `shared/rift.js`, kits `RIFT_MODE_KITS.<mode>`): the engine's shared parts are in `server/rift.js` (`riftQueueS`, `riftPourS`, `riftWaveStepS`, `riftStageS`, `riftHudS`, `riftBigIslesS`, `riftGuardsS`). Every mode counts 10 stages; Essence and stones pay by stage. The objectives are dungeon objectives (`dgObjS`; kinds `riftheart`, `gust`, `beacon`, `core`, `pylon`, `vent` in `DG_OBJ_KINDS`).
- **Tiers** (elemental rifts): pick level 30-80 in the window (`rift{a:'go',lv}`); the monsters fight at it; a full clear pays `RIFT_TIER_ESS` (12 / 18 / 26 / 38 / 55 / 80); a clear opens the next tier in every elemental rift (`gear.rift.tier`, `riftTierOpen`).
- **Coin and stone rifts** fight at your level: coins from level 20 (`RIFT_COIN_*`, above a level-5 pipe's net coins a minute even at the rift's slowest; the smoke test checks it), stones from level 30 (`riftStonesFull(L)` = 10 + 0.75 L a full clear).
- HUD tuple now: `[stage, monsters, clock, x2, paid, tier, a, b]` (`DG_HUD.rift`).
